import { Injectable } from '@nestjs/common';

export interface MetricComparisonResult {
  currentValue: number;
  previousValue: number;
  difference: number;
  percentageChange: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

@Injectable()
export class ComparisonEngineService {
  /**
   * Compares a current numeric value against a previous baseline value.
   * Handles division by zero gracefully and formats growth.
   */
  compare(current: number, previous: number): MetricComparisonResult {
    const currentValue = Math.round(current * 100) / 100;
    const previousValue = Math.round(previous * 100) / 100;
    const difference = Math.round((currentValue - previousValue) * 100) / 100;

    let percentageChange = 0;
    if (previousValue === 0) {
      percentageChange = currentValue > 0 ? 100.0 : 0.0;
    } else {
      percentageChange =
        Math.round(((currentValue - previousValue) / previousValue) * 10000) /
        100;
    }

    let trend: 'UP' | 'DOWN' | 'FLAT' = 'FLAT';
    if (difference > 0) trend = 'UP';
    else if (difference < 0) trend = 'DOWN';

    return {
      currentValue,
      previousValue,
      difference,
      percentageChange,
      trend,
    };
  }

  /**
   * Calculates comparison date bounds given a current date window and comparison mode.
   */
  resolveComparisonWindow(
    currentFrom: Date,
    currentTo: Date,
    mode: 'PREVIOUS_PERIOD' | 'PREVIOUS_YEAR' | 'SAME_DAY_LAST_WEEK' | 'CUSTOM',
    customPreviousFrom?: Date,
    customPreviousTo?: Date,
  ): { previousFrom: Date; previousTo: Date } {
    if (mode === 'CUSTOM' && customPreviousFrom && customPreviousTo) {
      return { previousFrom: customPreviousFrom, previousTo: customPreviousTo };
    }

    const durationMs = currentTo.getTime() - currentFrom.getTime();

    if (mode === 'PREVIOUS_YEAR') {
      const prevFrom = new Date(currentFrom);
      prevFrom.setFullYear(prevFrom.getFullYear() - 1);
      const prevTo = new Date(currentTo);
      prevTo.setFullYear(prevTo.getFullYear() - 1);
      return { previousFrom: prevFrom, previousTo: prevTo };
    }

    if (mode === 'SAME_DAY_LAST_WEEK') {
      const prevFrom = new Date(currentFrom.getTime() - 7 * 86400000);
      const prevTo = new Date(currentTo.getTime() - 7 * 86400000);
      return { previousFrom: prevFrom, previousTo: prevTo };
    }

    // Default: PREVIOUS_PERIOD (adjacent identical time window)
    const prevTo = new Date(currentFrom.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - durationMs);
    return { previousFrom: prevFrom, previousTo: prevTo };
  }
}
