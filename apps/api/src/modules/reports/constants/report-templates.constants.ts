export interface ReportTemplateDefinition {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  category: 'SALES' | 'MENU' | 'OPERATIONS' | 'CUSTOMERS' | 'FINANCE';
  configuration: {
    metrics: string[];
    dimensions: string[];
    filters: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    dateRange: {
      preset: string;
      customFrom?: string;
      customTo?: string;
    };
    sorting: Array<{
      field: string;
      direction: 'ASC' | 'DESC';
    }>;
    limit?: number;
    visualization: {
      type: string;
      title?: string;
    };
  };
}

export const PREBUILT_REPORT_TEMPLATES: ReportTemplateDefinition[] = [
  {
    id: 'tmpl-daily-sales',
    name: 'Daily Sales & Revenue Summary',
    description: 'Hourly sales curve and order breakdown for today',
    dataSource: 'SALES',
    category: 'SALES',
    configuration: {
      metrics: [
        'GROSS_SALES',
        'NET_SALES',
        'TOTAL_ORDERS',
        'AVERAGE_ORDER_VALUE',
      ],
      dimensions: ['DATE_HOUR'],
      filters: [],
      dateRange: { preset: 'TODAY' },
      sorting: [{ field: 'DATE_HOUR', direction: 'ASC' }],
      visualization: { type: 'LINE_CHART', title: 'Hourly Revenue Curve' },
    },
  },
  {
    id: 'tmpl-weekly-branch-rev',
    name: 'Weekly Revenue by Branch',
    description: 'Multi-branch performance benchmark across the last 7 days',
    dataSource: 'BRANCHES',
    category: 'SALES',
    configuration: {
      metrics: [
        'BRANCH_REVENUE',
        'TOTAL_ORDERS',
        'AVERAGE_ORDER_VALUE',
        'NETWORK_SHARE_PERCENT',
      ],
      dimensions: ['BRANCH'],
      filters: [],
      dateRange: { preset: 'THIS_WEEK' },
      sorting: [{ field: 'BRANCH_REVENUE', direction: 'DESC' }],
      visualization: { type: 'BAR_CHART', title: 'Branch Revenue Benchmark' },
    },
  },
  {
    id: 'tmpl-monthly-profit',
    name: 'Monthly Revenue & Tax Breakdown',
    description: 'Detailed daily financial summary for the current month',
    dataSource: 'SALES',
    category: 'FINANCE',
    configuration: {
      metrics: [
        'GROSS_SALES',
        'NET_SALES',
        'TAX_AMOUNT',
        'DISCOUNT_AMOUNT',
        'REFUND_AMOUNT',
      ],
      dimensions: ['DATE_DAY'],
      filters: [],
      dateRange: { preset: 'THIS_MONTH' },
      sorting: [{ field: 'DATE_DAY', direction: 'ASC' }],
      visualization: { type: 'TABLE', title: 'Monthly Financial Table' },
    },
  },
  {
    id: 'tmpl-top-10-items',
    name: 'Top 10 Best-Selling Menu Items',
    description:
      'Highest volume dishes ranked by unit velocity and revenue contribution',
    dataSource: 'MENU',
    category: 'MENU',
    configuration: {
      metrics: ['UNITS_SOLD', 'GROSS_REVENUE', 'REVENUE_SHARE_PERCENT'],
      dimensions: ['MENU_ITEM'],
      filters: [],
      dateRange: { preset: 'THIS_MONTH' },
      sorting: [{ field: 'UNITS_SOLD', direction: 'DESC' }],
      limit: 10,
      visualization: { type: 'BAR_CHART', title: 'Top 10 Dishes Sold' },
    },
  },
  {
    id: 'tmpl-category-rev',
    name: 'Category Revenue Contribution',
    description:
      'Sales distribution across Starters, Mains, Desserts, and Beverages',
    dataSource: 'MENU',
    category: 'MENU',
    configuration: {
      metrics: ['GROSS_REVENUE', 'UNITS_SOLD', 'REVENUE_SHARE_PERCENT'],
      dimensions: ['MENU_CATEGORY'],
      filters: [],
      dateRange: { preset: 'THIS_MONTH' },
      sorting: [{ field: 'GROSS_REVENUE', direction: 'DESC' }],
      visualization: { type: 'DONUT_CHART', title: 'Category Revenue Share' },
    },
  },
  {
    id: 'tmpl-staff-turnaround',
    name: 'Staff Operational Turnaround',
    description:
      'Orders handled, completion velocity, and operational activity by employee',
    dataSource: 'STAFF',
    category: 'OPERATIONS',
    configuration: {
      metrics: ['ORDERS_HANDLED', 'TOTAL_ACTIONS'],
      dimensions: ['STAFF_MEMBER'],
      filters: [],
      dateRange: { preset: 'THIS_MONTH' },
      sorting: [{ field: 'ORDERS_HANDLED', direction: 'DESC' }],
      visualization: { type: 'TABLE', title: 'Staff Performance Matrix' },
    },
  },
  {
    id: 'tmpl-customer-retention',
    name: 'Customer Segmentation & Retention',
    description: 'Revenue and customer counts grouped by loyalty segments',
    dataSource: 'CUSTOMERS',
    category: 'CUSTOMERS',
    configuration: {
      metrics: ['TOTAL_CUSTOMERS', 'LIFETIME_VALUE', 'REPEAT_RATE'],
      dimensions: ['CUSTOMER_SEGMENT'],
      filters: [],
      dateRange: { preset: 'THIS_MONTH' },
      sorting: [{ field: 'TOTAL_CUSTOMERS', direction: 'DESC' }],
      visualization: {
        type: 'DONUT_CHART',
        title: 'Customer Segmentation Share',
      },
    },
  },
  {
    id: 'tmpl-payment-methods',
    name: 'Payment Methods Volume',
    description:
      'Realized settlement volume split across Cash, Card, and UPI Intent',
    dataSource: 'PAYMENTS',
    category: 'FINANCE',
    configuration: {
      metrics: ['PAYMENT_VOLUME', 'TRANSACTION_COUNT'],
      dimensions: ['PAYMENT_METHOD'],
      filters: [],
      dateRange: { preset: 'THIS_MONTH' },
      sorting: [{ field: 'PAYMENT_VOLUME', direction: 'DESC' }],
      visualization: { type: 'BAR_CHART', title: 'Payment Channel Volume' },
    },
  },
  {
    id: 'tmpl-cancellations-refunds',
    name: 'Order Cancellations & Refunds',
    description: 'Lost revenue and cancellation rates tracked by branch',
    dataSource: 'SALES',
    category: 'OPERATIONS',
    configuration: {
      metrics: ['CANCELLED_AMOUNT', 'REFUND_AMOUNT', 'TOTAL_ORDERS'],
      dimensions: ['BRANCH'],
      filters: [],
      dateRange: { preset: 'THIS_MONTH' },
      sorting: [{ field: 'CANCELLED_AMOUNT', direction: 'DESC' }],
      visualization: {
        type: 'TABLE',
        title: 'Cancellations & Refunds by Branch',
      },
    },
  },
  {
    id: 'tmpl-peak-hours',
    name: '7×24 Peak Hour Demand',
    description: 'Hourly order volume distribution across operating hours',
    dataSource: 'SALES',
    category: 'OPERATIONS',
    configuration: {
      metrics: ['TOTAL_ORDERS', 'GROSS_SALES'],
      dimensions: ['DATE_HOUR'],
      filters: [],
      dateRange: { preset: 'LAST_30_DAYS' },
      sorting: [{ field: 'DATE_HOUR', direction: 'ASC' }],
      visualization: { type: 'AREA_CHART', title: 'Hourly Demand Volume' },
    },
  },
];
