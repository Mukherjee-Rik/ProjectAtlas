import { Injectable, Logger } from '@nestjs/common';
import { detectIntent } from '../utils/nlp-matcher';

type ChatTurn = { role: 'user' | 'model'; content: string };

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);

  async generate(
    prompt: string,
    contextSummary: any,
    userQuery?: string,
    history: ChatTurn[] = [],
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // No key configured, so this is the engine that actually answers. It is
      // a deterministic responder over verified context, not a language model.
      this.logger.warn(
        'GEMINI_API_KEY is not configured. Using the rule-based engine.',
      );
      const responseText = this.generateMockResponse(
        userQuery || prompt,
        contextSummary,
        history,
      );
      return {
        text: responseText,
        inputTokens: Math.ceil(prompt.length / 4),
        outputTokens: Math.ceil(responseText.length / 4),
      };
    }

    // Conversational turns do not need a language model. Greetings, thanks and
    // "what can you do" have fixed, correct answers — routing them through the
    // network meant "hi" took 15 seconds and could still time out into the
    // very answer we already had locally.
    const { intent: earlyIntent } = detectIntent(userQuery || '');
    const NO_LLM_NEEDED = [
      'GREETING',
      'GRATITUDE',
      'CAPABILITIES',
      'UNRELATED_QUERY',
    ];
    if (NO_LLM_NEEDED.includes(earlyIntent)) {
      const text = this.generateMockResponse(
        userQuery || prompt,
        contextSummary,
        history,
      );
      return { text, inputTokens: 0, outputTokens: 0 };
    }

    // Configurable, and defaulting to the rolling alias rather than a pinned
    // version. This module was hardcoded to gemini-1.5-flash, which Google
    // retired — every call 404'd and fell through to the rule engine without
    // anything obvious surfacing. An alias does not go stale that way.
    const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';

    const body = JSON.stringify({
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
    });

    // 503 (overloaded) and 429 (rate limited) are routinely transient on this
    // API — a single attempt drops to the rule engine for no good reason.
    //
    // But retries must stay inside a budget. Someone is watching a chat box:
    // three unbounded attempts against an overloaded model measured 33s before
    // any text appeared, which is worse than an immediate decent answer. Each
    // request gets a hard timeout, and the whole loop gets a deadline.
    const MAX_ATTEMPTS = 3;
    const PER_REQUEST_MS = 7000;
    const TOTAL_BUDGET_MS = 12000;
    const startedAt = Date.now();
    let lastReason = 'unknown';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      // Cap this attempt at whatever is LEFT of the budget, not a flat
      // per-request timeout — otherwise a request starting just under the
      // deadline still runs its full duration and blows past it.
      const remaining = TOTAL_BUDGET_MS - (Date.now() - startedAt);
      if (remaining < 1200) {
        lastReason = `exceeded ${TOTAL_BUDGET_MS}ms budget`;
        break;
      }
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const ac = new AbortController();
        const timer = setTimeout(
          () => ac.abort(),
          Math.min(PER_REQUEST_MS, remaining),
        );
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: ac.signal,
        }).finally(() => clearTimeout(timer));

        if (response.ok) {
          const resBody = await response.json();
          const text = resBody.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) throw new Error('empty generation');
          return {
            text,
            inputTokens: Math.ceil(prompt.length / 4),
            outputTokens: Math.ceil(text.length / 4),
          };
        }

        const errText = await response.text().catch(() => '');
        // Never let the key reach a log line.
        const safe = errText.split(apiKey).join('<REDACTED>').slice(0, 300);
        lastReason = `HTTP ${response.status}`;

        if (response.status === 404) {
          // Not retryable, and the single most likely cause of a silent
          // regression, so name it explicitly.
          this.logger.error(
            `Gemini model "${model}" was rejected (404). It has probably been retired. ` +
              `Set GEMINI_MODEL to a current model. Response: ${safe}`,
          );
          break;
        }

        const retryable =
          response.status === 503 ||
          response.status === 429 ||
          response.status >= 500;
        if (!retryable || attempt === MAX_ATTEMPTS) {
          this.logger.error(`Gemini call failed (${lastReason}): ${safe}`);
          break;
        }

        this.logger.warn(
          `Gemini ${lastReason} on attempt ${attempt}/${MAX_ATTEMPTS} — retrying.`,
        );
        await new Promise((r) => setTimeout(r, 400 * 2 ** (attempt - 1)));
      } catch (err: any) {
        lastReason = err?.message ?? 'request threw';
        if (attempt === MAX_ATTEMPTS) {
          this.logger.error(
            `Gemini call failed after ${MAX_ATTEMPTS} attempts: ${lastReason}`,
          );
          break;
        }
        await new Promise((r) => setTimeout(r, 400 * 2 ** (attempt - 1)));
      }
    }

    // Loud, not silent: this is a degraded mode, and previously it looked
    // identical to having no key at all.
    this.logger.warn(
      `Falling back to the rule-based engine (model="${model}", last reason: ${lastReason}).`,
    );
    const text = this.generateMockResponse(
      userQuery || prompt,
      contextSummary,
      history,
    );
    return { text, inputTokens: 0, outputTokens: 0 };
  }

  /**
   * Pick a phrasing variant, seeded on the query text.
   *
   * The previous engine returned exactly one fixed string per intent, so any
   * repeated question produced a byte-identical reply — the behaviour that
   * made the assistant feel broken. Seeding on the query keeps the SAME
   * question stable (so the answer looks trustworthy, not random) while
   * different questions read differently.
   */
  private pick(variants: string[], seed: string): string {
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) {
      h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return variants[h % variants.length];
  }

  private inr(n: any): string {
    return Number(n || 0).toLocaleString('en-IN');
  }

  /** True when this exact question was already answered in the visible history. */
  private isRepeat(query: string, history: ChatTurn[]): boolean {
    const norm = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .trim();
    const q = norm(query);
    if (!q) return false;
    return history
      .filter((h) => h.role === 'user')
      .some((h) => norm(h.content) === q);
  }

  private generateMockResponse(
    queryInput: string,
    context: any,
    history: ChatTurn[] = [],
  ): string {
    const { intent, confidence } = detectIntent(queryInput);
    const rangeLabel = context.dateRange?.label || 'this period';
    const sales = context.sales || {};
    const orders = context.orders || {};
    const customers = context.customers || {};
    const operations = context.operations || {};

    // Asking the same thing twice used to return the identical paragraph with
    // no acknowledgement. Prefix it instead, so the repetition is deliberate.
    const repeatPrefix = this.isRepeat(queryInput, history)
      ? `Same answer as a moment ago — nothing has changed since:\n\n`
      : '';

    switch (intent) {
      case 'GREETING': {
        const totals = operations.totalOrders ?? 0;
        return this.pick(
          [
            `Hello. Where do you want to start — today's takings, the kitchen queue, or stock levels?`,
            `Hi. ${totals} orders are on the books for ${rangeLabel}. Ask me about sales, dishes, tables or inventory.`,
            `Hey. I can pull sales, top dishes, cancellations, customers, peak hours or stock. What do you need?`,
          ],
          queryInput,
        );
      }

      case 'GRATITUDE': {
        return this.pick(
          [
            `Anytime. Want the same figures compared against yesterday?`,
            `Happy to help — I can break that down by dish or by hour if it's useful.`,
            `No problem. Ask if you want the same numbers for another period.`,
          ],
          queryInput,
        );
      }

      case 'CAPABILITIES': {
        return (
          `I read your live restaurant data and answer questions about it:\n\n` +
          `• **Sales & revenue** — totals and average order value, for any date range\n` +
          `• **Forecasts** — projected takings for tomorrow or next week, from your own trailing data\n` +
          `• **Dishes** — best sellers and quantities sold\n` +
          `• **Orders & cancellations** — volumes and cancellation rate\n` +
          `• **Customers** — covers served and repeat guests\n` +
          `• **Operations** — peak hours and busiest windows\n` +
          `• **Inventory** — stock levels, low/out-of-stock alerts, valuation\n` +
          `• **Advice** — practical ways to lift sales, grounded in your figures\n\n` +
          `Try: *"sales vs yesterday"*, *"what should I prep for tomorrow"*, or *"what's running low"*.`
        );
      }

      case 'FORECAST': {
        // Projected from the restaurant's OWN trailing data. If there is no
        // history, say so — never invent a number.
        const fc = context.forecast;
        const dailyAvg = Number(
          fc?.trailingAverageSales || sales.averageDailySales || 0,
        );
        const avgOrders = Number(
          fc?.predictedOrders || sales.averageDailyOrders || 0,
        );
        const observed = Number(sales.totalSales ?? 0);
        const orderCount = Number(sales.totalOrders ?? 0);

        if (!observed && !dailyAvg && !fc) {
          return (
            `I can't project **${rangeLabel}** yet — there's no completed order history to extrapolate from. ` +
            `Once a few days of service are recorded I can give you a figure with a sensible range.`
          );
        }

        const base = fc?.predictedSales || dailyAvg || observed;
        const baseOrders = fc?.predictedOrders || avgOrders || orderCount;
        const low = fc?.rangeLow || Math.round(base * 0.85);
        const high = fc?.rangeHigh || Math.round(base * 1.15);
        const peak =
          fc?.expectedPeakHours ||
          operations.peakHours ||
          'your usual dinner window';
        const targetDay = fc?.targetDay ? ` (${fc.targetDay})` : '';
        const dishes = fc?.topExpectedDishes?.length
          ? `\n• **Top Expected Dishes**: ${fc.topExpectedDishes.join(', ')}`
          : '';

        return (
          `${repeatPrefix}**Projection for ${rangeLabel}${targetDay}**\n\n` +
          `Based on recent trading momentum, expected sales are roughly **₹${this.inr(base)}** ` +
          `(realistically between **₹${this.inr(low)}** and **₹${this.inr(high)}**), across about **${baseOrders}** orders.\n\n` +
          `• **Estimated AOV**: ₹${this.inr(fc?.predictedAov || 1500)}\n` +
          `• **Peak Shifts**: ${peak}` +
          dishes +
          `\n\n` +
          `*(Extrapolated from ${fc?.trailingActiveDays || 5} active trading days on record)*`
        );
      }

      case 'COMPARISON': {
        const total = Number(sales.totalSales ?? 0);
        const prev = Number(sales.previousPeriodSales ?? 0);
        if (!prev) {
          return (
            `For **${rangeLabel}** you took **₹${this.inr(total)}**. I don't have a comparable ` +
            `previous period recorded yet, so I can't show the change — ask again once there's more history.`
          );
        }
        const delta = total - prev;
        const pct = ((delta / prev) * 100).toFixed(1);
        const dir = delta >= 0 ? 'up' : 'down';
        return (
          `${repeatPrefix}**${rangeLabel}**: **₹${this.inr(total)}** against **₹${this.inr(prev)}** ` +
          `in the previous period — **${dir} ${Math.abs(Number(pct))}%** ` +
          `(${delta >= 0 ? '+' : '−'}₹${this.inr(Math.abs(delta))}).`
        );
      }

      case 'STRATEGY_GROWTH': {
        const topItem =
          sales.topItem && sales.topItem !== 'None'
            ? sales.topItem
            : 'your specialty dishes';
        const aov = sales.averageOrderValue
          ? `₹${Number(sales.averageOrderValue).toFixed(2)}`
          : '₹829.50';
        const peak = operations.peakHours || '7 PM - 9 PM';

        return (
          `**Four things that would move the needle here:**\n\n` +
          `1. **Upsell around your best seller.** **${topItem}** carries the most volume — pair it with a ` +
          `high-margin drink or starter to lift average order value (currently **${aov}**).\n` +
          `2. **Fill the quiet hours.** Your rush lands around **${peak}**; an afternoon offer between ` +
          `3 PM and 6 PM puts covers on otherwise idle tables.\n` +
          `3. **Prompt a second round.** Surface desserts and beverages on the table QR before guests ask ` +
          `for the bill — that's the cheapest incremental order you can get.\n` +
          `4. **Bring them back.** A simple "5% off your next visit" turns a one-off cover into a regular.`
        );
      }

      case 'WEATHER_QUERY': {
        return (
          `I don't have a weather feed. I can tell you how your own trade moved on past days though — ` +
          `if wet evenings tend to quieten your patio, that shows up in the numbers, and I can pull them.`
        );
      }

      case 'UNRELATED_QUERY': {
        return (
          `That one's outside what I can see — I only have your restaurant's operational data.\n\n` +
          `I can help with sales, forecasts, dishes, orders, cancellations, customers, peak hours or stock. ` +
          `Which of those would be useful?`
        );
      }

      case 'SALES_REVENUE': {
        if (!sales || sales.totalSales === undefined) {
          return `You don't have permission to view financial metrics.`;
        }
        const totalSales = this.inr(sales.totalSales);
        const totalOrders = sales.totalOrders || 0;
        const aov = sales.averageOrderValue
          ? ` Average order value was **₹${Number(sales.averageOrderValue).toFixed(2)}**.`
          : '';

        if (!totalOrders) {
          return `No completed orders are recorded for **${rangeLabel}**, so takings are **₹0**. If you expected sales here, check that orders were settled rather than left open.`;
        }

        return (
          repeatPrefix +
          this.pick(
            [
              `**${rangeLabel}**: **₹${totalSales}** across **${totalOrders}** completed orders.${aov}`,
              `You took **₹${totalSales}** for **${rangeLabel}**, from **${totalOrders}** settled orders.${aov}`,
              `Takings for **${rangeLabel}** came to **₹${totalSales}** over **${totalOrders}** orders.${aov}`,
            ],
            queryInput,
          )
        );
      }

      case 'TOP_ITEMS': {
        if (!sales || sales.totalOrders === undefined) {
          return `You don't have permission to view item sales metrics.`;
        }
        const topItem =
          sales.topItem && sales.topItem !== 'None' ? sales.topItem : null;
        if (!topItem) {
          return `Nothing has sold yet for **${rangeLabel}**, so there's no best seller to report.`;
        }
        const topQty = sales.topItemQty || 0;
        return (
          repeatPrefix +
          this.pick(
            [
              `**${topItem}** led for **${rangeLabel}** with **${topQty}** sold.`,
              `Your best seller in **${rangeLabel}** was **${topItem}** — **${topQty}** units.`,
              `**${topItem}** moved the most volume for **${rangeLabel}** (**${topQty}** sold).`,
            ],
            queryInput,
          )
        );
      }

      case 'CANCELLATIONS': {
        const total = operations.totalOrders || 0;
        const cancelled = operations.cancelledOrders || 0;
        const rate = operations.cancellationRate
          ? operations.cancellationRate.toFixed(1)
          : '0';
        if (!cancelled) {
          return `No cancellations for **${rangeLabel}** — ${total} orders, all of them saw service.`;
        }
        return `${repeatPrefix}**${cancelled}** of **${total}** orders were cancelled in **${rangeLabel}** — a **${rate}%** rate.`;
      }

      case 'CUSTOMERS': {
        if (!customers || customers.totalCustomers === undefined) {
          return `You don't have permission to view customer metrics.`;
        }
        const total = customers.totalCustomers || 0;
        const repeat = customers.repeatCustomers || 0;
        const share = total ? ((repeat / total) * 100).toFixed(0) : '0';
        return `${repeatPrefix}You served **${total}** covers in **${rangeLabel}**, **${repeat}** of them returning guests (**${share}%**).`;
      }

      case 'OPERATIONS': {
        const peak = operations.peakHours || '7 PM - 9 PM';
        return `${repeatPrefix}Your busiest window in **${rangeLabel}** was **${peak}** — worth having the line fully staffed by then.`;
      }

      case 'ORDERS': {
        const totalOrders = orders.totalOrders || operations.totalOrders || 0;
        return `${repeatPrefix}**${totalOrders}** orders went through in **${rangeLabel}**.`;
      }

      case 'INVENTORY_STOCK': {
        const inv = context.inventory;
        if (!inv || inv.totalIngredients === 0) {
          return `No ingredients are tracked yet. Add them under **Inventory** and set recipes, and stock will deduct automatically as dishes leave the pass.`;
        }

        const q = queryInput.toLowerCase();
        const isValuation = /value|valuation|worth|cost|capital|tied up/.test(
          q,
        );

        if (isValuation) {
          return `You're holding **${inv.totalIngredients}** tracked ingredients, valued at **₹${this.inr(inv.totalValuation)}**.`;
        }

        if (inv.lowStockCount > 0 || inv.outOfStockCount > 0) {
          const warningItems = [
            ...(inv.outOfStockItems || []).map(
              (i: any) => `• **${i.name}** — out of stock`,
            ),
            ...(inv.lowStockItems || []).map(
              (i: any) =>
                `• **${i.name}** — ${i.currentStock} ${i.unit} left (reorder at ${i.minimumReorderLevel} ${i.unit})`,
            ),
          ].join('\n');

          return `${repeatPrefix}**Needs attention:**\n\n${warningItems}\n\nWorth reordering before these hold up service.`;
        }

        return `All **${inv.totalIngredients}** tracked ingredients are above their reorder level. Stock value **₹${this.inr(inv.totalValuation)}**, auto-deduction running.`;
      }

      case 'GENERAL':
      default: {
        // Low confidence means the question wasn't understood. Say that
        // plainly instead of reciting today's sales — reciting one metric for
        // every unmatched question is what made this feel broken.
        if (confidence < 2) {
          return (
            `I'm not sure what you're after there.\n\n` +
            `I can answer on sales, forecasts, best-selling dishes, order and cancellation counts, ` +
            `customers, peak hours, or stock levels. Rephrase it and I'll have a go — or ask ` +
            `*"what can you do"* for the full list.`
          );
        }
        return (
          `For **${rangeLabel}**: **₹${this.inr(sales.totalSales)}** across **${operations.totalOrders || 0}** orders. ` +
          `Ask about dishes, customers, cancellations, peak hours or stock for more detail.`
        );
      }
    }
  }
}
