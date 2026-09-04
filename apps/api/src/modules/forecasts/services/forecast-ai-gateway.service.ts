import { Injectable } from '@nestjs/common';
import { ForecastingEngineService } from './forecasting-engine.service';
import { MenuDemandForecasterService } from './menu-demand-forecaster.service';
import { MealPeriodChannelForecasterService } from './meal-period-channel-forecaster.service';
import { ForecastExplainabilityService } from './forecast-explainability.service';

export interface AiForecastAnswer {
  question: string;
  intent:
    | 'SALES_TOMORROW'
    | 'BUSIEST_DAY'
    | 'DINNER_ORDERS'
    | 'MENU_DEMAND'
    | 'EXPLAIN_CHANGE'
    | 'GENERAL';
  headlineAnswer: string;
  supportingDetails: string[];
  confidence: number;
  dataPayload: Record<string, any>;
}

@Injectable()
export class ForecastAiGatewayService {
  constructor(
    private readonly forecastingEngine: ForecastingEngineService,
    private readonly menuDemandForecaster: MenuDemandForecasterService,
    private readonly mealChannelForecaster: MealPeriodChannelForecasterService,
    private readonly explainabilityService: ForecastExplainabilityService,
  ) {}

  /**
   * Evaluates natural-language conversational queries regarding forecasting.
   */
  async answerQuery(
    restaurantId: string,
    question: string,
    branchId?: string,
  ): Promise<AiForecastAnswer> {
    const qLower = question.toLowerCase();

    // 1. Fetch current 7-day forecast
    const salesForecast = await this.forecastingEngine.generateSalesForecast(
      restaurantId,
      branchId,
      7,
    );
    const tomorrow = salesForecast.summary;

    if (qLower.includes('busiest') || qLower.includes('busy')) {
      const sortedBySales = [...salesForecast.dailyProjections].sort(
        (a, b) => b.predictedSales - a.predictedSales,
      );
      const busiest = sortedBySales[0];
      return {
        question,
        intent: 'BUSIEST_DAY',
        headlineAnswer: `${busiest.dayName} (${busiest.date}) is expected to be the busiest day, with approximately ₹${busiest.predictedSales.toLocaleString('en-IN')} in sales across ${busiest.predictedOrders} orders.`,
        supportingDetails: [
          `Peak rush expected between 7:00 PM and 9:30 PM.`,
          `Confidence rating for this projection is ${busiest.confidence}%.`,
        ],
        confidence: busiest.confidence,
        dataPayload: { busiestDay: busiest },
      };
    }

    if (
      qLower.includes('dinner') ||
      qLower.includes('lunch') ||
      qLower.includes('meal')
    ) {
      const breakdown =
        await this.mealChannelForecaster.forecastMealPeriodsAndChannels(
          restaurantId,
          tomorrow.tomorrowSales,
          tomorrow.tomorrowOrders,
          branchId,
        );
      const dinner =
        breakdown.mealPeriods.find((m) => m.periodId === 'DINNER') ||
        breakdown.mealPeriods[0];
      const lunch =
        breakdown.mealPeriods.find((m) => m.periodId === 'LUNCH') ||
        breakdown.mealPeriods[1];

      return {
        question,
        intent: 'DINNER_ORDERS',
        headlineAnswer: `Tomorrow's dinner rush is projected at ${dinner.predictedOrders} orders (₹${dinner.predictedSales.toLocaleString('en-IN')}), representing ${dinner.sharePercentage}% of total daily volume.`,
        supportingDetails: [
          `Lunch rush is projected at ${lunch?.predictedOrders || 0} orders (₹${(lunch?.predictedSales || 0).toLocaleString('en-IN')}).`,
          `Kitchen prep should be ramped up by 6:30 PM.`,
        ],
        confidence: tomorrow.tomorrowConfidence,
        dataPayload: { breakdown },
      };
    }

    if (
      qLower.includes('item') ||
      qLower.includes('menu') ||
      qLower.includes('dish') ||
      qLower.includes('demand')
    ) {
      const menuDemand = await this.menuDemandForecaster.forecastMenuDemand(
        restaurantId,
        branchId,
      );
      const top3 = menuDemand.slice(0, 3);
      const topText = top3
        .map(
          (t, idx) =>
            `${idx + 1}. ${t.name}: ${t.predictedPortionsTomorrow} portions (range ${t.portionRangeLower}-${t.portionRangeUpper})`,
        )
        .join(', ');

      return {
        question,
        intent: 'MENU_DEMAND',
        headlineAnswer: `Top projected menu items for tomorrow are: ${topText}.`,
        supportingDetails: [
          `Highest revenue generator: ${top3[0]?.name || 'Top Dish'} (₹${top3[0]?.predictedRevenueTomorrow?.toLocaleString('en-IN') || 0}).`,
          `Portion ranges include a 90% confidence interval buffer.`,
        ],
        confidence: 85,
        dataPayload: { topItems: top3 },
      };
    }

    if (
      qLower.includes('why') ||
      qLower.includes('reason') ||
      qLower.includes('change') ||
      qLower.includes('increase') ||
      qLower.includes('decrease')
    ) {
      const explanation = await this.explainabilityService.explainForecast(
        restaurantId,
        tomorrow.tomorrowSales,
        branchId,
      );
      return {
        question,
        intent: 'EXPLAIN_CHANGE',
        headlineAnswer: explanation.summaryText,
        supportingDetails: explanation.factors.map(
          (f) =>
            `${f.name} (${f.impactPercentage >= 0 ? '+' : ''}${f.impactPercentage}%): ${f.description}`,
        ),
        confidence: tomorrow.tomorrowConfidence,
        dataPayload: { explanation },
      };
    }

    // Default: Sales Tomorrow
    return {
      question,
      intent: 'SALES_TOMORROW',
      headlineAnswer: `Expected tomorrow revenue is ₹${tomorrow.tomorrowSales.toLocaleString('en-IN')} (Range: ₹${tomorrow.tomorrowSalesLower.toLocaleString('en-IN')} – ₹${tomorrow.tomorrowSalesUpper.toLocaleString('en-IN')}) across ${tomorrow.tomorrowOrders} orders with ${tomorrow.tomorrowConfidence}% confidence.`,
      supportingDetails: [
        `Projected Average Order Value (AOV): ₹${tomorrow.tomorrowAov.toLocaleString('en-IN')}.`,
        `Next 7 days total expected sales: ₹${tomorrow.totalHorizonSales.toLocaleString('en-IN')}.`,
      ],
      confidence: tomorrow.tomorrowConfidence,
      dataPayload: { summary: tomorrow },
    };
  }
}
