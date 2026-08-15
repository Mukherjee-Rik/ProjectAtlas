export interface DashboardOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  tableName: string;
  itemCount: number;
}

export interface RestaurantStaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
}

export interface DashboardOverview {
  metrics: {
    totalOrders: number;
    totalSales: number;
    activeTables: number;
    menuItems: number;
    staffCount: number;
  };
  recentOrders: DashboardOrderSummary[];
  restaurantStaff: RestaurantStaffMember[];
}

export interface RevenueTransaction {
  id: string;
  orderNumber: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  itemCount?: number;
  status: string;
  tableName: string;
  createdAt: string;
}

export interface TableSpend {
  tableName: string;
  totalRevenue: number;
  ordersCount: number;
  averageSpend: number;
}

export interface RevenueBreakdown {
  totalGrossRevenue: number;
  totalSubtotal: number; // excluding tax
  totalTaxAmount: number; // total tax collected
  totalDiscountAmount: number; // total discounts applied
  netRevenue: number; // net after discounts
  averageOrderValue: number;
  averageTaxPerOrder: number;
  effectiveTaxRate: number;
  totalOrders: number;
  dineInOrdersCount: number;
  takeoutOrdersCount: number;
  totalItemsCount?: number;
  averageItemsPerOrder?: number;
  highestOrderAmount?: number;
  lowestOrderAmount?: number;
  ticketDistribution?: {
    under500: number;
    between500And1000: number;
    above1000: number;
  };
  tableSpendBreakdown?: TableSpend[];
  recentTransactions: RevenueTransaction[];
}

export interface DashboardAnalytics {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
  revenueBreakdown?: RevenueBreakdown;
  salesTrend: {
    date: string;
    sales: number;
    subtotal?: number;
    taxAmount?: number;
    discountAmount?: number;
    orders: number;
  }[];
  popularItems: {
    name: string;
    count: number;
    revenue: number;
  }[];
  peakHours: {
    hour: number;
    count: number;
  }[];
  branchPerformance: {
    branchName: string;
    sales: number;
    orders: number;
  }[];
}
