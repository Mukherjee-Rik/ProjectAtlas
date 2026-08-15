import { Injectable, Logger } from '@nestjs/common';
import { detectIntent } from '../utils/nlp-matcher';

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);

  async generate(
    prompt: string,
    contextSummary: any,
    userQuery?: string,
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback rule-based model for local testing
      this.logger.warn('GEMINI_API_KEY is not configured. Falling back to rule-based engine.');
      const responseText = this.generateMockResponse(userQuery || prompt, contextSummary);
      return {
        text: responseText,
        inputTokens: Math.ceil(prompt.length / 4),
        outputTokens: Math.ceil(responseText.length / 4),
      };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${prompt}\n\nHere is the verified restaurant context structured data:\n${JSON.stringify(
                    contextSummary,
                    null,
                    2,
                  )}`,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const resBody = await response.json();
      const text = resBody.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini API returned empty generation');
      }

      return {
        text,
        inputTokens: Math.ceil(prompt.length / 4),
        outputTokens: Math.ceil(text.length / 4),
      };
    } catch (err: any) {
      this.logger.error('Gemini API query failed, falling back to rule engine:', err);
      const text = this.generateMockResponse(userQuery || prompt, contextSummary);
      return {
        text,
        inputTokens: 0,
        outputTokens: 0,
      };
    }
  }

  private generateMockResponse(queryInput: string, context: any): string {
    const { intent } = detectIntent(queryInput);
    const rangeLabel = context.dateRange?.label || 'this period';
    const sales = context.sales || {};
    const orders = context.orders || {};
    const customers = context.customers || {};
    const operations = context.operations || {};

    switch (intent) {
      case 'STRATEGY_GROWTH': {
        const topItem = sales.topItem && sales.topItem !== 'None' ? sales.topItem : 'your specialty dishes';
        const aov = sales.averageOrderValue ? `₹${Number(sales.averageOrderValue).toFixed(2)}` : '₹829.50';
        const peak = operations.peakHours || '7 PM - 9 PM';

        return `💡 **Here are 4 targeted strategies to increase your restaurant sales:**\n\n` +
          `1. **Upsell Top Items & Combos**: Your most ordered item is **${topItem}**. Pair it with high-margin beverages or appetizers as a combo deal to raise your Average Order Value (currently **${aov}**).\n` +
          `2. **Target Off-Peak Slow Hours**: Your main rush occurs around **${peak}**. Introduce an afternoon *"Happy Hour (3 PM - 6 PM)"* discount or special tea/snack combos to drive tables during quiet hours.\n` +
          `3. **Drive Table Re-Orders via QR**: Promote digital dessert or beverage add-ons directly on table QR menus before guests request their final bill.\n` +
          `4. **Customer Retention**: Introduce a digital loyalty reward (e.g. *"5% off your next visit"*) to turn one-time dine-in guests into regular repeat customers.`;
      }

      case 'WEATHER_QUERY': {
        return `🌦️ I don't have access to live meteorological weather sensors, but you can use weather conditions to boost sales! For instance, on rainy or chilly days, feature hot soups and warm beverages prominently on your QR menu to increase impulsive orders.`;
      }

      case 'UNRELATED_QUERY': {
        return `🤖 I am **Atlas AI**, your dedicated Restaurant Operations Copilot. I specialize in helping you with sales analytics, menu optimization, order fulfillment, staff management, and table operations. How can I assist with your restaurant today?`;
      }

      case 'SALES_REVENUE': {
        if (!sales || sales.totalSales === undefined) {
          return `You do not have access permission to view financial metrics.`;
        }
        const totalSales = sales.totalSales !== undefined ? Number(sales.totalSales).toLocaleString('en-IN') : '0';
        const totalOrders = sales.totalOrders || 0;
        const aov = sales.averageOrderValue ? ` (Average order value: **₹${Number(sales.averageOrderValue).toFixed(2)}**)` : '';
        return `Your restaurant generated a total sales income of **₹${totalSales}** across **${totalOrders}** completed orders for **${rangeLabel}**${aov}.`;
      }

      case 'TOP_ITEMS': {
        if (!sales || sales.totalOrders === undefined) {
          return `You do not have access permission to view item sales metrics.`;
        }
        const topItem = sales.topItem && sales.topItem !== 'None' ? sales.topItem : 'No sales recorded yet';
        const topQty = sales.topItemQty || 0;
        return `The best-selling dish for **${rangeLabel}** was **${topItem}** with **${topQty}** units sold.`;
      }

      case 'CANCELLATIONS': {
        const total = operations.totalOrders || 0;
        const cancelled = operations.cancelledOrders || 0;
        const rate = operations.cancellationRate ? operations.cancellationRate.toFixed(1) : '0';
        return `For **${rangeLabel}**, you had **${cancelled}** cancelled orders out of **${total}** total orders (**${rate}%** cancellation rate).`;
      }

      case 'CUSTOMERS': {
        if (!customers || customers.totalCustomers === undefined) {
          return `You do not have access permission to view customer metrics.`;
        }
        const total = customers.totalCustomers || 0;
        const repeat = customers.repeatCustomers || 0;
        return `You served **${total}** customer tables for **${rangeLabel}**. **${repeat}** of them were repeat customers.`;
      }

      case 'OPERATIONS': {
        const peak = operations.peakHours || '7 PM - 9 PM';
        return `Your restaurant's busiest operational window for **${rangeLabel}** was **${peak}**.`;
      }

      case 'ORDERS': {
        const totalOrders = orders.totalOrders || operations.totalOrders || 0;
        return `You processed a total of **${totalOrders}** orders for **${rangeLabel}**.`;
      }

      case 'INVENTORY_STOCK': {
        const inv = context.inventory;
        if (!inv || inv.totalIngredients === 0) {
          return `Your inventory currently has **0** items tracked. You can add ingredients and configure recipes in the **Inventory** tab to enable live stock deductions!`;
        }

        const isValuationQuery =
          queryInput.toLowerCase().includes('value') ||
          queryInput.toLowerCase().includes('valuation') ||
          queryInput.toLowerCase().includes('worth') ||
          queryInput.toLowerCase().includes('cost');

        if (isValuationQuery) {
          return `Your restaurant currently holds **${inv.totalIngredients}** tracked raw ingredients with a total valuation of **₹${Number(
            inv.totalValuation || 0,
          ).toLocaleString('en-IN')}**.`;
        }

        if (inv.lowStockCount > 0 || inv.outOfStockCount > 0) {
          const warningItems = [
            ...(inv.outOfStockItems || []).map((i: any) => `• ❌ **${i.name}**: OUT OF STOCK (0 ${i.unit})`),
            ...(inv.lowStockItems || []).map(
              (i: any) => `• ⚠️ **${i.name}**: ${i.currentStock} ${i.unit} (Min: ${i.minimumReorderLevel} ${i.unit})`,
            ),
          ].join('\n');

          return `Here is your current inventory stock summary:\n\n${warningItems}\n\n💡 **Action Recommended**: Place reorder requests with your suppliers to avoid kitchen prep delays.`;
        }

        return `Your inventory is in excellent condition! All **${inv.totalIngredients}** ingredients are currently above their minimum reorder thresholds (Total asset valuation: **₹${Number(
          inv.totalValuation || 0,
        ).toLocaleString('en-IN')}**). Live auto-deductions are active on incoming orders.`;
      }

      case 'GENERAL':
      default: {
        return `Hello! I'm **Atlas AI**, your restaurant operations copilot. For **${rangeLabel}**, your restaurant has recorded **₹${
          Number(sales.totalSales || 0).toLocaleString('en-IN')
        }** in sales across **${operations.totalOrders || 0}** orders. Ask me about popular dishes, revenue trends, customer retention, or peak rush hours!`;
      }
    }
  }
}
