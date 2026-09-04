/**
 * Atlas V2.4 Forecasting Models & Metrics Constants
 */

export const FORECAST_METRICS = {
  GROSS_SALES: 'GROSS_SALES',
  TOTAL_ORDERS: 'TOTAL_ORDERS',
  AVERAGE_ORDER_VALUE: 'AVERAGE_ORDER_VALUE',
  ITEM_UNITS: 'ITEM_UNITS',
} as const;

export const FORECAST_TYPES = {
  SALES: 'SALES',
  ORDERS: 'ORDERS',
  MENU_DEMAND: 'MENU_DEMAND',
} as const;

export const MODEL_REGISTRY = {
  SEASONAL_DOW_V1: {
    id: 'seasonal-dow-v1',
    name: 'Seasonal Day-of-Week 4W Model',
    type: 'SEASONAL_WEIGHTED',
    version: '1.0',
    description:
      'Weights identical days of the week over the previous 4 weeks (40%, 30%, 20%, 10%)',
    status: 'ACTIVE',
  },
  WMA_SALES_V1: {
    id: 'wma-sales-v1',
    name: 'Weighted Moving Average 7D',
    type: 'WEIGHTED_MOVING_AVERAGE',
    version: '1.0',
    description:
      'Linear decay moving average over the preceding 7 calendar days',
    status: 'ACTIVE',
  },
  DIURNAL_HOURLY_V1: {
    id: 'diurnal-hourly-v1',
    name: 'Diurnal Hour-of-Day Curve',
    type: 'HISTORICAL_CONCENTRATION',
    version: '1.0',
    description:
      'Projects lunch/dinner rush hour distributions based on historical diurnal shares',
    status: 'ACTIVE',
  },
  ITEM_VELOCITY_V1: {
    id: 'item-velocity-v1',
    name: 'Item Demand Moving Average',
    type: 'ITEM_LEVEL_WEIGHTED',
    version: '1.0',
    description:
      'Item portion volume projection using 14-day velocity and category trend factors',
    status: 'ACTIVE',
  },
};
