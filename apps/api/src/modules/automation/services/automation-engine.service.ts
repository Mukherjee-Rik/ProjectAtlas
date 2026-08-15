import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AiContextService } from '../../ai/services/ai-context.service';
import { NotificationService } from './notification.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class AutomationEngineService {
  private readonly logger = new Logger(AutomationEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: AiContextService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Evaluate a single automation rule against live restaurant data.
   * Returns true if the rule fired, false otherwise.
   */
  async evaluateRule(ruleId: string): Promise<boolean> {
    const rule = await this.prisma.automationRule.findUnique({ where: { id: ruleId } });
    if (!rule || !rule.enabled) return false;

    // Cooldown check
    if (rule.lastTriggeredAt) {
      const cooldownMs = rule.cooldownMinutes * 60 * 1000;
      const elapsed = Date.now() - rule.lastTriggeredAt.getTime();
      if (elapsed < cooldownMs) {
        this.logger.debug(`Rule "${rule.name}" is in cooldown (${Math.round((cooldownMs - elapsed) / 60000)}m remaining)`);
        return false;
      }
    }

    // Compute context for condition evaluation
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let conditionMet = false;
    let contextData: any = {};

    if (rule.conditionType && rule.conditionValue !== null) {
      switch (rule.conditionType) {
        case 'SALES_BELOW': {
          const sales = await this.contextService.getSalesContext(rule.restaurantId, todayStart, now);
          conditionMet = sales.totalSales < (rule.conditionValue ?? 0);
          contextData = { sales };
          break;
        }
        case 'SALES_ABOVE': {
          const sales = await this.contextService.getSalesContext(rule.restaurantId, todayStart, now);
          conditionMet = sales.totalSales > (rule.conditionValue ?? 0);
          contextData = { sales };
          break;
        }
        case 'ORDERS_ABOVE': {
          const orders = await this.contextService.getOrderContext(rule.restaurantId, todayStart, now);
          conditionMet = orders.totalOrders > (rule.conditionValue ?? 0);
          contextData = { orders };
          break;
        }
        case 'CANCELLATIONS_ABOVE': {
          const ops = await this.contextService.getOperationsContext(rule.restaurantId, todayStart, now);
          conditionMet = ops.cancelledOrders > (rule.conditionValue ?? 0);
          contextData = { ops };
          break;
        }
        case 'PENDING_ORDERS_ABOVE': {
          const orders = await this.contextService.getOrderContext(rule.restaurantId, todayStart, now);
          conditionMet = (orders.statusBreakdown['PENDING'] || 0) > (rule.conditionValue ?? 0);
          contextData = { orders };
          break;
        }
        case 'INVENTORY_LOW': {
          const inv = await this.contextService.getInventoryContext(rule.restaurantId);
          conditionMet = inv.lowStockCount > 0;
          contextData = { inventory: inv };
          break;
        }
        case 'INVENTORY_CRITICAL': {
          const inv = await this.contextService.getInventoryContext(rule.restaurantId);
          conditionMet = inv.criticalCount > 0;
          contextData = { inventory: inv };
          break;
        }
        case 'INVENTORY_OUT': {
          const inv = await this.contextService.getInventoryContext(rule.restaurantId);
          conditionMet = inv.outOfStockCount > 0;
          contextData = { inventory: inv };
          break;
        }
        default:
          this.logger.warn(`Unknown condition type: ${rule.conditionType}`);
          return false;
      }
    } else {
      // No condition — always fires (e.g. scheduled reports)
      conditionMet = true;
    }

    if (!conditionMet) return false;

    // Create execution record
    const execution = await this.prisma.automationExecution.create({
      data: {
        automationId: rule.id,
        status: 'RUNNING',
      },
    });

    try {
      // Dispatch action
      await this.dispatchAction(rule, contextData);

      // Mark execution complete
      await this.prisma.automationExecution.update({
        where: { id: execution.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      // Update last triggered timestamp
      await this.prisma.automationRule.update({
        where: { id: rule.id },
        data: { lastTriggeredAt: new Date() },
      });

      // Audit log
      await this.auditService.log({
        action: 'AUTOMATION_EXECUTED',
        resourceType: 'AUTOMATION',
        resourceId: rule.id,
        restaurantId: rule.restaurantId,
        metadata: { ruleName: rule.name, actionType: rule.actionType },
      });

      return true;
    } catch (err: any) {
      this.logger.error(`Automation "${rule.name}" failed: ${err.message}`);

      await this.prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
          completedAt: new Date(),
        },
      });

      return false;
    }
  }

  /**
   * Dispatches events (e.g. from OrderController, PaymentService, InventoryService)
   * and runs all event-triggered automations.
   */
  async handleEvent(eventType: string, restaurantId: string, eventData?: any): Promise<number> {
    const rules = await this.prisma.automationRule.findMany({
      where: {
        restaurantId,
        enabled: true,
        triggerType: 'EVENT',
        eventType,
      },
    });

    let firedCount = 0;
    for (const rule of rules) {
      const fired = await this.evaluateRule(rule.id);
      if (fired) firedCount++;
    }

    return firedCount;
  }

  private async dispatchAction(rule: any, contextData?: any) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (rule.actionType) {
      case 'SEND_NOTIFICATION': {
        await this.notificationService.create({
          restaurantId: rule.restaurantId,
          title: `⚡ ${rule.name}`,
          message: `Automation "${rule.name}" was triggered. Condition: ${rule.conditionType} ${rule.conditionValue ?? ''}`,
          type: 'ALERT',
          metadata: { automationId: rule.id },
        });
        break;
      }
      case 'NOTIFY_LOW_INVENTORY': {
        const inv = contextData?.inventory || (await this.contextService.getInventoryContext(rule.restaurantId));
        const items = inv.lowStockItems.concat(inv.outOfStockItems);
        const itemSummary = items
          .slice(0, 5)
          .map((i: any) => `• ⚠️ **${i.name}**: ${i.currentStock} ${i.unit} (Min: ${i.minimumReorderLevel} ${i.unit} | Recommended reorder: ${i.recommendedReorder} ${i.unit})`)
          .join('\n');

        await this.notificationService.create({
          restaurantId: rule.restaurantId,
          title: `📦 Low Inventory Warning — ${items.length} Item(s)`,
          message: `The following ingredients are at or below minimum threshold:\n\n${itemSummary}\n\nPlease generate purchase orders with suppliers to avoid stockouts.`,
          type: 'ALERT',
          metadata: { automationId: rule.id, lowStockCount: inv.lowStockCount, outOfStockCount: inv.outOfStockCount },
        });
        break;
      }
      case 'GENERATE_REPORT': {
        const sales = await this.contextService.getSalesContext(rule.restaurantId, todayStart, now);
        const orders = await this.contextService.getOrderContext(rule.restaurantId, todayStart, now);
        const ops = await this.contextService.getOperationsContext(rule.restaurantId, todayStart, now);

        const report =
          `📊 **${rule.name}**\n\n` +
          `• Total Orders: **${orders.totalOrders}**\n` +
          `• Gross Sales: **₹${sales.totalSales.toLocaleString()}**\n` +
          `• Average Order Value: **₹${Math.round(sales.averageOrderValue)}**\n` +
          `• Top Selling Item: **${sales.topItem}** (${sales.topItemQty} units sold)\n` +
          `• Cancellation Rate: **${ops.cancellationRate.toFixed(1)}%** (${ops.cancelledOrders} cancelled)\n` +
          `• Peak Rush Window: **${ops.peakHours}**`;

        await this.notificationService.create({
          restaurantId: rule.restaurantId,
          title: `📊 ${rule.name}`,
          message: report,
          type: 'REPORT',
          metadata: { automationId: rule.id, sales, orders, ops },
        });
        break;
      }
      case 'GENERATE_RECOMMENDATION': {
        const sales = await this.contextService.getSalesContext(rule.restaurantId, todayStart, now);
        const ops = await this.contextService.getOperationsContext(rule.restaurantId, todayStart, now);
        const inv = await this.contextService.getInventoryContext(rule.restaurantId);

        const recommendations: string[] = [];

        if (ops.cancellationRate > 10) {
          recommendations.push(`• 🚨 **High Cancellation Rate (${ops.cancellationRate.toFixed(1)}%)**: Review kitchen prep bottlenecks or customer table wait times.`);
        }
        if (inv.lowStockCount > 0) {
          recommendations.push(`• 📦 **${inv.lowStockCount} ingredient(s) low in stock**: Create purchase orders for ${inv.lowStockItems.map((i: any) => i.name).slice(0, 3).join(', ')}.`);
        }
        if (sales.topItem && sales.topItem !== 'None') {
          recommendations.push(`• ⭐ **Promote Star Dishes**: "${sales.topItem}" is your #1 seller. Consider featuring it in menu combos during peak hours (**${ops.peakHours}**).`);
        }
        if (recommendations.length === 0) {
          recommendations.push(`• ✅ **Operations Stable**: All operational metrics and stock levels are currently within target thresholds.`);
        }

        await this.notificationService.create({
          restaurantId: rule.restaurantId,
          title: `💡 Operational Recommendations — ${rule.name}`,
          message: `Atlas AI analyzed your restaurant operations:\n\n${recommendations.join('\n\n')}`,
          type: 'AI_INSIGHT',
          metadata: { automationId: rule.id },
        });
        break;
      }
      case 'CREATE_AI_INSIGHT': {
        const sales = await this.contextService.getSalesContext(rule.restaurantId, todayStart, now);
        const ops = await this.contextService.getOperationsContext(rule.restaurantId, todayStart, now);

        const insight =
          `🤖 **Atlas Insight — ${rule.name}**\n\n` +
          `Sales today: ₹${sales.totalSales.toLocaleString()} across ${sales.totalOrders} orders. ` +
          `Cancellation rate: ${ops.cancellationRate.toFixed(1)}%. ` +
          `Top item: ${sales.topItem} (${sales.topItemQty} units).`;

        await this.notificationService.create({
          restaurantId: rule.restaurantId,
          title: `🤖 ${rule.name}`,
          message: insight,
          type: 'AI_INSIGHT',
          metadata: { automationId: rule.id },
        });
        break;
      }
      default:
        this.logger.warn(`Unknown action type: ${rule.actionType}`);
    }
  }

  /**
   * Evaluate all enabled scheduled rules for a given restaurant.
   */
  async evaluateAllForRestaurant(restaurantId: string) {
    const rules = await this.prisma.automationRule.findMany({
      where: { restaurantId, enabled: true },
    });

    const results: { ruleId: string; fired: boolean }[] = [];
    for (const rule of rules) {
      const fired = await this.evaluateRule(rule.id);
      results.push({ ruleId: rule.id, fired });
    }
    return results;
  }

  /**
   * Platform Admin System-wide statistics.
   */
  async getAdminStats() {
    const [totalRules, activeRules, totalExecutions, failedExecutions, notificationsSent] = await Promise.all([
      this.prisma.automationRule.count(),
      this.prisma.automationRule.count({ where: { enabled: true } }),
      this.prisma.automationExecution.count(),
      this.prisma.automationExecution.count({ where: { status: 'FAILED' } }),
      this.prisma.notification.count(),
    ]);

    const successfulExecutions = totalExecutions - failedExecutions;

    return {
      totalRules,
      activeRules,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      notificationsSent,
    };
  }
}
