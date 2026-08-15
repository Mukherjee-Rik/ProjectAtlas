import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AiContextService } from './ai-context.service';
import { AiProviderService } from './ai-provider.service';
import { AuditService } from '../../audit/audit.service';
import { UserRole } from '../../../generated/prisma/enums';
import { detectIntent, extractDateRange } from '../utils/nlp-matcher';
import crypto from 'node:crypto';

@Injectable()
export class AiService {
  // Simple in-memory token rate-limit counter (max 20 prompts per minute)
  private readonly rateLimits = new Map<string, { count: number; resetTime: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: AiContextService,
    private readonly provider: AiProviderService,
    private readonly audit: AuditService,
  ) {}

  private checkRateLimit(userId: string) {
    const now = Date.now();
    const limit = this.rateLimits.get(userId);

    if (!limit) {
      this.rateLimits.set(userId, { count: 1, resetTime: now + 60000 });
      return;
    }

    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + 60000;
      return;
    }

    if (limit.count >= 20) {
      throw new BadRequestException('AI request rate limit exceeded. Please wait a minute.');
    }

    limit.count++;
  }

  async runQuery(
    userId: string,
    role: UserRole,
    restaurantId: string,
    query: string,
    history: { role: 'user' | 'model'; content: string }[] = [],
  ) {
    this.checkRateLimit(userId);

    const { intent } = detectIntent(query);
    const isFinancialQuery = intent === 'SALES_REVENUE';

    // Enforce permission checks: waiters/kitchen staff cannot query sales context
    const allowedRoles: UserRole[] = [UserRole.PLATFORM_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER];
    if (isFinancialQuery && !allowedRoles.includes(role)) {
      await this.audit.log({
        actorUserId: userId,
        action: 'AI_QUERY_BLOCKED',
        resourceType: 'AI_ASSISTANT',
        restaurantId,
        metadata: { query, intent, error: 'Unauthorized financial details request' },
      });
      throw new ForbiddenException('You do not have access permission to view financial metrics.');
    }

    const { startDate, endDate, label } = extractDateRange(query);

    // Context aggregation
    const orders = await this.contextService.getOrderContext(restaurantId, startDate, endDate);
    const operations = await this.contextService.getOperationsContext(restaurantId, startDate, endDate);

    let sales: any = null;
    let customers: any = null;

    if (allowedRoles.includes(role)) {
      sales = await this.contextService.getSalesContext(restaurantId, startDate, endDate);
      customers = await this.contextService.getCustomerContext(restaurantId, startDate, endDate);
    }

    const inventory = await this.contextService.getInventoryContext(restaurantId);

    const aiContext = {
      restaurantId,
      dateRange: { startDate, endDate, label },
      orders,
      operations,
      sales,
      customers,
      inventory,
    };

    const systemPrompt = `You are Atlas AI, an ultra-smart, conversational restaurant operations copilot.

NATURAL LANGUAGE UNDERSTANDING (NLU) DIRECTIVES:
1. TYPO & PHRASING TOLERANCE:
   - Handle typos, misspellings, colloquialisms, and broken grammar with 100% forgiveness.
   - Examples:
     * "potal income", "totl revenue", "totall", "aaj ka sale", "kamai" -> Match to Sales & Income metrics.
     * "most seling item", "hit dish", "best saler" -> Match to Top Selling Items.
     * "how mny custmr", "repeat guest", "tables" -> Match to Customer & Table metrics.
     * "canceld order", "rejections" -> Match to Cancellation statistics.
2. ACCURACY & CONSTRAINTS:
   - Rely EXCLUSIVELY on the provided structured JSON context. Never hallucinate or invent fake metrics.
   - If sales/customer properties are null or missing, politely state that you do not have permission or data is not recorded.
   - Format numbers cleanly with ₹ (INR), bold highlights (**₹7,465.50**), and bullet points.
3. CONVERSATIONAL TONE:
   - Be concise, direct, helpful, and executive-ready.
   - Frame your response relative to the requested time window: "${label}".`;

    const chatHistoryText = history
      .map((h) => `${h.role === 'user' ? 'User' : 'Atlas AI'}: ${h.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}\n\nHistory:\n${chatHistoryText}\n\nUser Question: ${query}`;

    const { text, inputTokens, outputTokens } = await this.provider.generate(fullPrompt, aiContext, query);

    const requestId = crypto.randomUUID();

    // Log LLM Usage
    await this.prisma.aiUsage.create({
      data: {
        restaurantId,
        userId,
        provider: 'GEMINI',
        model: 'gemini-1.5-flash',
        inputTokens,
        outputTokens,
        requestId,
      },
    });

    // Write security audit trace
    await this.audit.log({
      actorUserId: userId,
      action: 'AI_QUERY_SUCCESS',
      resourceType: 'AI_ASSISTANT',
      restaurantId,
      metadata: { query, intent, requestId, inputTokens, outputTokens },
    });

    return {
      text,
      requestId,
      dateRange: { startDate, endDate, label },
    };
  }
}
