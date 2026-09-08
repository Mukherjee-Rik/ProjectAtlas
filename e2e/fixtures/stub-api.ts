import type { Page, Route } from '@playwright/test';

/**
 * Renders every authenticated screen without a database.
 *
 * The layout audit needs two things the real stack cannot give it here: a
 * signed-in session, and the same rows on every run so a width-by-width
 * comparison measures the layout rather than whatever happened to be in the
 * database that day. Both come from stubbing the one network boundary the
 * browser actually crosses — `/api/proxy/*`, which `lib/config.ts` points the
 * API client at — so all of the client code under test still runs for real.
 *
 * Deliberately NOT a replacement for e2e/fixtures/atlas.ts: that suite proves
 * the product works against the real API. This one proves the layout holds.
 */

const ISO = (offsetDays = 0) =>
  new Date(Date.UTC(2026, 8, 8, 9, 30) + offsetDays * 86_400_000).toISOString();

const TENANT_ID = 'tnt_stub_0001';
const RESTAURANT_ID = 'rst_stub_0001';
const BRANCH_ID = 'brn_stub_0001';
const USER_ID = 'usr_stub_0001';

export const STUB = {
  tenantId: TENANT_ID,
  restaurantId: RESTAURANT_ID,
  branchId: BRANCH_ID,
  tableToken: 'stubtoken000000000000000000001',
  orderNumber: 'ORD-20260908-0042',
  orderId: 'ord_stub_0001',
  menuId: 'mnu_stub_0001',
  menuItemId: 'itm_stub_0001',
  tableId: 'tbl_stub_0001',
  branchId2: 'brn_stub_0002',
  userId2: 'usr_stub_0002',
  reportId: 'rpt_stub_0001',
};

/**
 * Long on purpose. Narrow screens break on the longest string a screen can
 * hold, not the average one, so the fixtures carry realistic worst cases: a
 * restaurant name that fills a header, an email that cannot wrap at a hyphen,
 * and dish names longer than a phone is wide.
 */
const user = {
  id: USER_ID,
  name: 'Rajalakshmi Venkataraman',
  email: 'rajalakshmi.venkataraman@thecoastalkitchen.co.in',
  phone: '+91 98840 21200',
  role: 'OWNER',
  status: 'ACTIVE',
  createdAt: ISO(-400),
  updatedAt: ISO(-2),
};

const tenant = {
  id: TENANT_ID,
  name: 'Coastal Kitchen Hospitality Private Limited',
  slug: 'coastal-kitchen-hospitality',
  status: 'ACTIVE',
  createdAt: ISO(-400),
  updatedAt: ISO(-2),
};

const restaurant = {
  id: RESTAURANT_ID,
  tenantId: TENANT_ID,
  name: 'The Coastal Kitchen - Besant Nagar',
  slug: 'the-coastal-kitchen-besant-nagar',
  status: 'ACTIVE',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  createdAt: ISO(-400),
  updatedAt: ISO(-2),
};

const branches = [
  {
    id: BRANCH_ID,
    restaurantId: RESTAURANT_ID,
    name: 'Besant Nagar (Flagship)',
    code: 'BSN-01',
    address: '12/4 Elliot Beach Road, Besant Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600090',
    phone: '+91 44 4560 1200',
    status: 'ACTIVE',
    createdAt: ISO(-400),
    updatedAt: ISO(-2),
  },
  {
    id: 'brn_stub_0002',
    restaurantId: RESTAURANT_ID,
    name: 'Adyar',
    code: 'ADY-02',
    address: '5 Sardar Patel Road, Adyar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600020',
    phone: '+91 44 4560 1201',
    status: 'ACTIVE',
    createdAt: ISO(-200),
    updatedAt: ISO(-2),
  },
  {
    id: 'brn_stub_0003',
    restaurantId: RESTAURANT_ID,
    name: 'Velachery (Opening soon)',
    code: 'VLC-03',
    address: '88 Grand Southern Trunk Road, Velachery',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600042',
    phone: '+91 44 4560 1202',
    status: 'INACTIVE',
    createdAt: ISO(-30),
    updatedAt: ISO(-1),
  },
];

const plan = {
  id: 'pln_growth',
  name: 'Growth',
  price: 4999,
  currency: 'INR',
  billingCycle: 'MONTHLY' as const,
  trialDays: 14,
  description: 'Multi-branch operations, analytics and AI forecasting.',
  features: ['ai_copilot', 'analytics', 'forecasting', 'multi_branch', 'qr_ordering'],
  limits: { tables: 60, users: 40, branches: 5, menuItems: 500 },
  status: 'ACTIVE' as const,
  createdAt: ISO(-400),
};

const subscription = {
  id: 'sub_stub_0001',
  restaurantId: RESTAURANT_ID,
  planId: plan.id,
  status: 'ACTIVE' as const,
  billingCycle: 'MONTHLY' as const,
  trialStart: null,
  trialEnd: null,
  currentPeriodStart: ISO(-8),
  currentPeriodEnd: ISO(22),
  cancelledAt: null,
  createdAt: ISO(-400),
  plan,
  restaurant: { id: RESTAURANT_ID, name: restaurant.name, slug: restaurant.slug },
};

const DISHES: Array<[string, string, number, string]> = [
  ['Meen Kuzhambu with Kerala Matta Rice', 'Coastal Mains', 480, 'NON_VEG'],
  ['Nethili Fry (Anchovy, rava crusted)', 'From the Fryer', 320, 'NON_VEG'],
  ['Chettinad Pepper Chicken - half portion', 'Coastal Mains', 420, 'NON_VEG'],
  ['Kadalai Curry with Appam (two appams)', 'Breakfast All Day', 260, 'VEG'],
  ['Avial, Beetroot Pachadi and Rice Platter', 'Thali', 340, 'VEG'],
  ['Prawn Ghee Roast', 'Coastal Mains', 560, 'NON_VEG'],
  ['Elaneer Payasam', 'Desserts', 180, 'VEG'],
  ['Filter Coffee (by the tumbler)', 'Beverages', 90, 'VEG'],
  ['Sukku Malli Coffee', 'Beverages', 110, 'VEG'],
  ['Karimeen Pollichathu (banana leaf)', 'Coastal Mains', 640, 'NON_VEG'],
  ['Ulundhu Vadai (three pieces)', 'Small Plates', 140, 'VEG'],
  ['Ragi Kali with Kaara Kuzhambu', 'Breakfast All Day', 220, 'VEG'],
];

const menuItems = DISHES.map(([name, categoryName, price, dietaryType], i) => ({
  id: `itm_stub_${String(i + 1).padStart(4, '0')}`,
  categoryId: `cat_stub_${String((i % 7) + 1).padStart(4, '0')}`,
  categoryName,
  category: { id: `cat_stub_${String((i % 7) + 1).padStart(4, '0')}`, name: categoryName },
  name,
  code: `ITM${String(i + 1).padStart(3, '0')}`,
  description:
    'Cooked to order. Contains no artificial colour. Ask the steward about the catch of the day and about allergens before you order.',
  price,
  dietaryType,
  imageUrl: null,
  status: i === 11 ? 'INACTIVE' : 'ACTIVE',
  position: i + 1,
  variants: [],
  addons: [],
  createdAt: ISO(-100 + i),
  updatedAt: ISO(-1),
}));

const CATEGORY_NAMES = [
  'Small Plates',
  'Breakfast All Day',
  'Coastal Mains',
  'From the Fryer',
  'Thali',
  'Desserts',
  'Beverages',
];

const categories = CATEGORY_NAMES.map((name, i) => ({
  id: `cat_stub_${String(i + 1).padStart(4, '0')}`,
  menuId: 'mnu_stub_0001',
  name,
  code: `CAT${i + 1}`,
  position: i + 1,
  status: 'ACTIVE',
  menuItems: menuItems.filter((m) => m.categoryName === name),
  items: menuItems.filter((m) => m.categoryName === name),
  createdAt: ISO(-100),
  updatedAt: ISO(-1),
}));

const menus = [
  {
    id: 'mnu_stub_0001',
    restaurantId: RESTAURANT_ID,
    branchId: BRANCH_ID,
    name: 'All-Day Menu - Besant Nagar',
    code: 'ALLDAY-BSN',
    status: 'ACTIVE',
    categories,
    menuCategories: categories,
    itemsCount: menuItems.length,
    createdAt: ISO(-100),
    updatedAt: ISO(-1),
  },
  {
    id: 'mnu_stub_0002',
    restaurantId: RESTAURANT_ID,
    branchId: BRANCH_ID,
    name: 'Sunday Sadhya (seasonal)',
    code: 'SADHYA',
    status: 'DRAFT',
    categories: [],
    menuCategories: [],
    itemsCount: 0,
    createdAt: ISO(-40),
    updatedAt: ISO(-3),
  },
];

const diningAreas = [
  { id: 'dna_stub_0001', restaurantId: RESTAURANT_ID, branchId: BRANCH_ID, name: 'Ground Floor', code: 'GF', status: 'ACTIVE', tablesCount: 8, createdAt: ISO(-300), updatedAt: ISO(-2) },
  { id: 'dna_stub_0002', restaurantId: RESTAURANT_ID, branchId: BRANCH_ID, name: 'Terrace (sea facing)', code: 'TER', status: 'ACTIVE', tablesCount: 6, createdAt: ISO(-300), updatedAt: ISO(-2) },
  { id: 'dna_stub_0003', restaurantId: RESTAURANT_ID, branchId: BRANCH_ID, name: 'Private Dining Room', code: 'PDR', status: 'ACTIVE', tablesCount: 2, createdAt: ISO(-120), updatedAt: ISO(-2) },
];

const TABLE_STATES = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'AVAILABLE', 'OCCUPIED', 'CLEANING', 'AVAILABLE', 'OCCUPIED'];

const tables = Array.from({ length: 16 }, (_, i) => ({
  id: `tbl_stub_${String(i + 1).padStart(4, '0')}`,
  restaurantId: RESTAURANT_ID,
  branchId: BRANCH_ID,
  diningAreaId: diningAreas[i % 3].id,
  diningAreaName: diningAreas[i % 3].name,
  diningArea: { id: diningAreas[i % 3].id, name: diningAreas[i % 3].name },
  name: `T${i + 1}`,
  code: `TBL${String(i + 1).padStart(3, '0')}`,
  capacity: [2, 4, 4, 6, 2, 8, 4, 4][i % 8],
  status: TABLE_STATES[i % TABLE_STATES.length],
  publicToken: i === 0 ? STUB.tableToken : `stubtoken00000000000000000${String(i + 1).padStart(4, '0')}`,
  qrCodeUrl: null,
  createdAt: ISO(-300),
  updatedAt: ISO(-1),
}));

const ORDER_STATUSES = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];

const orders = Array.from({ length: 14 }, (_, i) => {
  const picked = [menuItems[i % menuItems.length], menuItems[(i + 4) % menuItems.length], menuItems[(i + 7) % menuItems.length]];
  const items = picked.map((m, j) => ({
    id: `oit_stub_${i}_${j}`,
    orderId: `ord_stub_${String(i + 1).padStart(4, '0')}`,
    menuItemId: m.id,
    menuItemName: m.name,
    name: m.name,
    quantity: 1 + ((i + j) % 3),
    unitPrice: m.price,
    price: m.price,
    totalPrice: m.price * (1 + ((i + j) % 3)),
    notes: j === 1 ? 'No coconut oil, the guest is allergic. Please send this to the pass first.' : null,
    status: 'CONFIRMED',
  }));
  const subtotal = items.reduce((s, it) => s + it.totalPrice, 0);
  const taxAmount = Math.round(subtotal * 0.05);
  const discountAmount = i % 5 === 0 ? 100 : 0;
  const total = subtotal + taxAmount - discountAmount;
  return {
    id: `ord_stub_${String(i + 1).padStart(4, '0')}`,
    orderNumber: i === 0 ? STUB.orderNumber : `ORD-20260908-${String(1000 + i)}`,
    restaurantId: RESTAURANT_ID,
    branchId: BRANCH_ID,
    tableId: tables[i % tables.length].id,
    tableName: tables[i % tables.length].name,
    table: { id: tables[i % tables.length].id, name: tables[i % tables.length].name },
    diningAreaName: diningAreas[i % 3].name,
    type: i % 4 === 0 ? 'TAKEAWAY' : 'DINE_IN',
    orderType: i % 4 === 0 ? 'TAKEAWAY' : 'DINE_IN',
    status: ORDER_STATUSES[i % ORDER_STATUSES.length],
    paymentStatus: i % 3 === 0 ? 'PAID' : 'PENDING',
    paymentMethod: i % 3 === 0 ? 'UPI' : null,
    customerName: i % 2 ? 'Sundareshwaran Balasubramaniam' : 'Walk-in',
    customerPhone: i % 2 ? '+91 90031 44521' : null,
    items,
    orderItems: items,
    itemsCount: items.length,
    subtotal,
    taxAmount,
    discountAmount,
    extraCharges: [],
    totalAmount: total,
    total,
    grandTotal: total,
    notes: i === 3 ? 'Table is celebrating an anniversary - send the payasam with a candle.' : null,
    placedAt: ISO(0),
    createdAt: ISO(0),
    updatedAt: ISO(0),
  };
});

const users = [
  user,
  { id: 'usr_stub_0002', name: 'Muthukrishnan Anbazhagan', email: 'muthu.anbazhagan@thecoastalkitchen.co.in', phone: '+91 98410 77321', role: 'MANAGER', status: 'ACTIVE', createdAt: ISO(-300), updatedAt: ISO(-2) },
  { id: 'usr_stub_0003', name: 'Priyadharshini R', email: 'priya.r@thecoastalkitchen.co.in', phone: '+91 90807 21190', role: 'CASHIER', status: 'ACTIVE', createdAt: ISO(-200), updatedAt: ISO(-2) },
  { id: 'usr_stub_0004', name: 'Arulmozhi Varman', email: 'arul.varman@thecoastalkitchen.co.in', phone: '+91 90807 21191', role: 'WAITER', status: 'ACTIVE', createdAt: ISO(-150), updatedAt: ISO(-2) },
  { id: 'usr_stub_0005', name: 'Chef Ilamparithi Sundaram', email: 'chef.ilamparithi@thecoastalkitchen.co.in', phone: '+91 90807 21192', role: 'KITCHEN', status: 'ACTIVE', createdAt: ISO(-150), updatedAt: ISO(-2) },
  { id: 'usr_stub_0006', name: 'Nandhini Krishnamurthy', email: 'nandhini.k@thecoastalkitchen.co.in', phone: null, role: 'WAITER', status: 'SUSPENDED', createdAt: ISO(-90), updatedAt: ISO(-9) },
];

const HOURS = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'];

const timeSeries = Array.from({ length: 30 }, (_, i) => {
  const grossSales = 42000 + Math.round(Math.sin(i / 3) * 12000) + i * 260;
  const ordersCount = 58 + Math.round(Math.cos(i / 4) * 14);
  return {
    timestamp: ISO(i - 29),
    date: ISO(i - 29).slice(0, 10),
    label: `${((i % 30) + 1).toString().padStart(2, '0')} Aug`,
    grossSales,
    netSales: Math.round(grossSales * 0.94),
    revenue: grossSales,
    ordersCount,
    orders: ordersCount,
    completedOrders: ordersCount - (i % 4),
    averageOrderValue: Math.round(grossSales / ordersCount),
    taxAmount: Math.round(grossSales * 0.05),
    discountAmount: Math.round(grossSales * 0.02),
  };
});

const kpis = [
  { key: 'gross_sales', name: 'Gross sales', value: 1284600, unit: 'INR', periodLabel: 'Last 30 days', previousValue: 1104200, change: 180400, changePercentage: 16.3, trend: 'UP' },
  { key: 'orders', name: 'Orders', value: 1742, unit: 'COUNT', periodLabel: 'Last 30 days', previousValue: 1610, change: 132, changePercentage: 8.2, trend: 'UP' },
  { key: 'aov', name: 'Average order value', value: 737, unit: 'INR', periodLabel: 'Last 30 days', previousValue: 686, change: 51, changePercentage: 7.4, trend: 'UP' },
  { key: 'table_turn', name: 'Table turn time', value: 54, unit: 'MINUTES', periodLabel: 'Last 30 days', previousValue: 61, change: -7, changePercentage: -11.5, trend: 'DOWN' },
  { key: 'void_rate', name: 'Void rate', value: 1.8, unit: 'PERCENT', periodLabel: 'Last 30 days', previousValue: 2.6, change: -0.8, changePercentage: -30.8, trend: 'DOWN' },
  { key: 'repeat_rate', name: 'Repeat guest rate', value: 34.2, unit: 'PERCENT', periodLabel: 'Last 30 days', previousValue: 31.4, change: 2.8, changePercentage: 8.9, trend: 'UP' },
];

const menuPerformance = menuItems.map((m, i) => ({
  menuItemId: m.id,
  name: m.name,
  categoryName: m.categoryName,
  price: m.price,
  dietaryType: m.dietaryType,
  unitsSold: 420 - i * 26,
  totalRevenue: (420 - i * 26) * m.price,
  revenueContributionPercent: Math.max(1, 18 - i * 1.4),
  ordersCount: 380 - i * 24,
  classification: (['STAR', 'PLOWHORSE', 'PUZZLE', 'DOG'] as const)[i % 4],
}));

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const demandMatrix = DAY_NAMES.map((day, d) => ({
  day,
  dayOfWeek: d,
  label: day,
  hours: HOURS.map((h, i) => ({
    hour: Number(h),
    label: `${h}:00`,
    ordersCount: 4 + Math.round(Math.abs(Math.sin((i + d) / 2)) * 26),
    grossSales: 2400 + Math.round(Math.abs(Math.cos((i + d) / 3)) * 14000),
    intensity: Math.abs(Math.sin((i + d) / 2)),
    value: 4 + Math.round(Math.abs(Math.sin((i + d) / 2)) * 26),
  })),
}));

const forecastPoints = Array.from({ length: 14 }, (_, i) => ({
  date: ISO(i + 1).slice(0, 10),
  timestamp: ISO(i + 1),
  label: `${i + 9} Sep`,
  predictedSales: 46000 + Math.round(Math.sin(i / 2) * 9000),
  predictedOrders: 62 + Math.round(Math.cos(i / 2) * 11),
  lowerBound: 39000 + Math.round(Math.sin(i / 2) * 8000),
  upperBound: 53000 + Math.round(Math.sin(i / 2) * 10000),
  confidence: 0.82 - i * 0.01,
  actualSales: i < 4 ? 45200 + i * 900 : null,
}));

const NOTIFICATION_TITLES = [
  'Karimeen stock is below the reorder point',
  'Order ORD-20260908-1004 has been in PREPARING for 26 minutes',
  'A card payment on table T7 was declined',
  'Evening shift handover note from Muthukrishnan',
  'This week’s demand forecast is ready',
  'A guest review mentioned a long wait at the terrace',
];

const notifications = NOTIFICATION_TITLES.map((title, i) => ({
  id: `ntf_stub_${i + 1}`,
  type: ['LOW_STOCK', 'ORDER_DELAYED', 'PAYMENT_FAILED', 'SHIFT_HANDOVER', 'FORECAST_READY', 'REVIEW_FLAGGED'][i],
  title,
  message:
    'Opened from the notification tray. This text is long enough to test how the tray wraps a two-line notification on a narrow phone.',
  severity: ['WARNING', 'WARNING', 'ERROR', 'INFO', 'INFO', 'WARNING'][i],
  read: i > 2,
  isRead: i > 2,
  createdAt: ISO(0),
}));

/** Path (after `/api/proxy`) -> payload. First matching pattern wins. */
const ROUTES: Array<[RegExp, unknown]> = [
  [/^\/users\/me/, user],
  [/^\/users\/[^/?]+/, users[1]],
  [/^\/users/, { data: users, meta: { page: 1, limit: 20, total: users.length, totalPages: 1 } }],
  [/^\/tenants/, [tenant]],
  [/^\/restaurants\/[^/?]+/, restaurant],
  [/^\/restaurants/, [restaurant]],
  [/^\/branches\/[^/?]+/, branches[0]],
  [/^\/branches/, branches],
  [/^\/subscriptions\/my-subscription/, subscription],
  [
    /^\/subscriptions\/usage/,
    {
      planName: plan.name,
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      nextBillingDate: ISO(22),
      usage: {
        tables: { current: 16, limit: 60 },
        users: { current: 6, limit: 40 },
        branches: { current: 3, limit: 5 },
        menuItems: { current: 12, limit: 500 },
      },
    },
  ],
  [
    /^\/subscriptions\/plans/,
    [
      { ...plan, id: 'pln_starter', name: 'Starter', price: 1499, features: ['qr_ordering', 'analytics'], limits: { tables: 15, users: 8, branches: 1, menuItems: 120 } },
      plan,
      { ...plan, id: 'pln_pro', name: 'Pro', price: 9999, features: ['ai_copilot', 'analytics', 'forecasting', 'multi_branch', 'qr_ordering', 'api_access'], limits: { tables: 200, users: 150, branches: 25, menuItems: 2000 } },
    ],
  ],
  [/^\/subscriptions/, [subscription]],
  [/^\/menu-categories/, categories],
  [/^\/menu-item-variants/, []],
  [/^\/menu-item-addons/, []],
  [/^\/menu-items\/[^/?]+/, menuItems[0]],
  [/^\/menu-items/, menuItems],
  [/^\/menus\/[^/?]+/, menus[0]],
  [/^\/menus/, menus],
  [/^\/dining-areas\/[^/?]+/, diningAreas[0]],
  [/^\/dining-areas/, diningAreas],
  [/^\/tables\/[^/?]+\/qr/, { tableId: tables[0].id, publicToken: tables[0].publicToken, url: `/t/${tables[0].publicToken}`, qrCodeDataUrl: null }],
  [/^\/tables\/[^/?]+/, tables[0]],
  [/^\/tables/, tables],
  [/^\/orders\/[^/?]+/, orders[0]],
  [/^\/orders/, orders],
  [/^\/tax-rates/, [{ id: 'tax_gst5', name: 'GST 5%', rate: 5, isDefault: true, status: 'ACTIVE' }]],
  [/^\/payments\/settings/, { cashEnabled: true, cardEnabled: true, upiEnabled: true, upiVpa: 'coastalkitchen@hdfcbank', gateway: 'RAZORPAY', gatewayEnabled: false }],
  [/^\/payments/, []],
  [/^\/automations\/notifications\/unread-count/, { count: 3, unreadCount: 3 }],
  [/^\/automations\/notifications/, notifications],
  [/^\/automations/, { rules: [], jobs: [], enabled: true }],
  [
    /^\/dashboard\/overview/,
    {
      todaySales: 68420,
      todayOrders: 94,
      activeTables: 7,
      totalTables: 16,
      pendingOrders: 5,
      completedOrders: 82,
      averageOrderValue: 728,
      salesChangePercentage: 12.4,
      ordersChangePercentage: 6.1,
      lowStockCount: 2,
      staffOnShift: 9,
      revenueToday: 68420,
      revenueThisMonth: 1284600,
    },
  ],
  [/^\/dashboard\/analytics/, { timeSeries, series: timeSeries, topItems: menuPerformance.slice(0, 6), hourly: demandMatrix[0].hours }],
  [
    /^\/dashboard\/platform/,
    {
      totalRestaurants: 4,
      activeRestaurants: 4,
      totalUsers: 10,
      totalOrders: 434,
      mrr: 18496,
      arr: 221952,
      trialingCount: 1,
      churnRate: 2.1,
      recentSignups: users.slice(0, 4),
      restaurants: [],
    },
  ],
  [/^\/dashboard/, { todaySales: 68420, todayOrders: 94, activeTables: 7, totalTables: 16, timeSeries }],
  [/^\/analytics\/kpi/, { cards: kpis, kpis, periodLabel: 'Last 30 days', comparisonLabel: 'vs previous 30 days' }],
  [/^\/analytics\/time-series/, timeSeries],
  [
    /^\/analytics\/revenue/,
    {
      summary: { grossSales: 1284600, netSales: 1207524, taxAmount: 64230, discountAmount: 25692, ordersCount: 1742, averageOrderValue: 737 },
      timeSeries,
      byChannel: [
        { channel: 'DINE_IN', grossSales: 902000, ordersCount: 1180 },
        { channel: 'TAKEAWAY', grossSales: 246600, ordersCount: 402 },
        { channel: 'DELIVERY', grossSales: 136000, ordersCount: 160 },
      ],
      byPaymentMethod: [
        { method: 'UPI', amount: 704000 },
        { method: 'CARD', amount: 402600 },
        { method: 'CASH', amount: 178000 },
      ],
    },
  ],
  [
    /^\/analytics\/menu/,
    {
      items: menuPerformance,
      categories: categories.map((c, i) => ({ categoryId: c.id, name: c.name, unitsSold: 640 - i * 70, totalRevenue: (640 - i * 70) * 300, revenueContributionPercent: 22 - i * 2.4 })),
      classificationCounts: { STAR: 3, PLOWHORSE: 3, PUZZLE: 3, DOG: 3 },
    },
  ],
  [
    /^\/analytics\/(customer|cohort)/,
    {
      cohorts: Array.from({ length: 6 }, (_, i) => ({
        cohortLabel: `${['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][i]} 2026`,
        cohortSize: 320 - i * 24,
        retention: Array.from({ length: 6 }, (_, m) => (m > i ? null : Math.max(4, 100 - m * 18 - i * 2))),
      })),
      summary: { newGuests: 812, repeatGuests: 930, repeatRate: 34.2, averageVisitsPerGuest: 2.4 },
    },
  ],
  [
    /^\/analytics\/branch/,
    {
      branches: branches.map((b, i) => ({ branchId: b.id, name: b.name, grossSales: 740000 - i * 210000, ordersCount: 980 - i * 260, averageOrderValue: 740 - i * 20, tableTurnMinutes: 52 + i * 5, rank: i + 1 })),
      benchmark: { grossSales: 428200, ordersCount: 580, averageOrderValue: 737 },
    },
  ],
  [
    /^\/analytics\/staff/,
    { staff: users.slice(1, 5).map((u, i) => ({ userId: u.id, name: u.name, role: u.role, ordersHandled: 320 - i * 48, grossSales: 236000 - i * 34000, averageOrderValue: 737 - i * 12 })) },
  ],
  [/^\/analytics\/(demand|heatmap|operational)/, { matrix: demandMatrix, days: demandMatrix, peak: { day: 'Saturday', hour: 20, ordersCount: 34 } }],
  [/^\/analytics/, { cards: kpis, kpis, timeSeries, matrix: demandMatrix, items: menuPerformance }],
  [
    /^\/forecasts\/(overview|summary)/,
    { horizonDays: 14, expectedSales: 648000, expectedOrders: 892, confidence: 0.81, modelName: 'SARIMAX + holiday regressors', lastTrainedAt: ISO(-1), accuracyMape: 7.4, points: forecastPoints },
  ],
  [/^\/forecasts\/(trend|series)/, forecastPoints],
  [
    /^\/forecasts\/(menu|demand)/,
    menuItems.map((m, i) => ({ menuItemId: m.id, name: m.name, categoryName: m.categoryName, predictedUnits: 96 - i * 6, predictedRevenue: (96 - i * 6) * m.price, confidence: 0.86 - i * 0.02, trend: i % 3 === 0 ? 'UP' : i % 3 === 1 ? 'FLAT' : 'DOWN' })),
  ],
  [
    /^\/forecasts\/(peak|hours)/,
    HOURS.map((h, i) => ({ hour: Number(h), label: `${h}:00`, predictedOrders: 6 + Math.round(Math.abs(Math.sin(i / 2)) * 24), predictedCovers: 14 + Math.round(Math.abs(Math.sin(i / 2)) * 52), staffRecommended: 4 + (i % 4) })),
  ],
  [
    /^\/forecasts\/(model|comparison)/,
    { models: [{ name: 'SARIMAX', mape: 7.4, rmse: 4120, selected: true }, { name: 'Prophet', mape: 8.9, rmse: 4980, selected: false }, { name: 'Naive seasonal', mape: 14.2, rmse: 7640, selected: false }] },
  ],
  [
    /^\/forecasts\/(explain|driver)/,
    {
      drivers: [
        { name: 'Day of week', contribution: 0.34, direction: 'UP' },
        { name: 'Local festival calendar', contribution: 0.21, direction: 'UP' },
        { name: 'Rainfall forecast', contribution: 0.14, direction: 'DOWN' },
        { name: 'Trailing 4-week trend', contribution: 0.19, direction: 'UP' },
        { name: 'Promotions live', contribution: 0.12, direction: 'UP' },
      ],
      narrative: 'Saturday dinner carries the fortnight. Rain on the 11th and 12th is the main downside risk to the terrace covers.',
    },
  ],
  [
    /^\/forecasts\/(channel|meal-period)/,
    {
      periods: [
        { period: 'BREAKFAST', predictedOrders: 96, predictedSales: 42000 },
        { period: 'LUNCH', predictedOrders: 284, predictedSales: 198000 },
        { period: 'SNACKS', predictedOrders: 142, predictedSales: 62000 },
        { period: 'DINNER', predictedOrders: 370, predictedSales: 346000 },
      ],
      channels: [
        { channel: 'DINE_IN', predictedOrders: 620 },
        { channel: 'TAKEAWAY', predictedOrders: 190 },
        { channel: 'DELIVERY', predictedOrders: 82 },
      ],
    },
  ],
  [/^\/forecasts/, { points: forecastPoints, horizonDays: 14, confidence: 0.81 }],
  [
    /^\/reports\/[^/?]+/,
    {
      id: 'rpt_stub_0001',
      name: 'Weekly sales by branch',
      type: 'SALES',
      status: 'READY',
      schedule: 'WEEKLY',
      createdAt: ISO(-9),
      updatedAt: ISO(-2),
      columns: ['Branch', 'Orders', 'Gross sales', 'AOV'],
      rows: branches.map((b, i) => [b.name, 980 - i * 260, 740000 - i * 210000, 740 - i * 20]),
    },
  ],
  [
    /^\/reports/,
    Array.from({ length: 5 }, (_, i) => ({
      id: `rpt_stub_${i + 1}`,
      name: ['Weekly sales by branch', 'Menu engineering - last 30 days', 'Staff performance', 'Tax summary (GST)', 'Void and discount audit'][i],
      type: ['SALES', 'MENU', 'STAFF', 'TAX', 'AUDIT'][i],
      status: i === 4 ? 'RUNNING' : 'READY',
      schedule: i % 2 ? 'WEEKLY' : 'MONTHLY',
      createdAt: ISO(-30 + i * 4),
      updatedAt: ISO(-i),
    })),
  ],
  [
    /^\/inventory/,
    menuItems.slice(0, 8).map((m, i) => ({ id: `inv_stub_${i}`, menuItemId: m.id, name: m.name, unit: 'kg', onHand: 24 - i * 3, reorderPoint: 8, status: 24 - i * 3 < 8 ? 'LOW' : 'OK', updatedAt: ISO(0) })),
  ],
  [
    /^\/audit/,
    Array.from({ length: 8 }, (_, i) => ({
      id: `aud_stub_${i}`,
      action: ['LOGIN_SUCCESS', 'ORDER_VOIDED', 'MENU_ITEM_UPDATED', 'USER_INVITED', 'DISCOUNT_APPLIED', 'TABLE_MERGED', 'PLAN_CHANGED', 'PASSWORD_RESET'][i],
      actorEmail: users[i % users.length].email,
      resourceType: 'ORDER',
      resourceId: orders[i % orders.length].id,
      ipAddress: '106.51.24.118',
      createdAt: ISO(-i),
    })),
  ],
  [
    /^\/(auth\/)?sessions/,
    [
      { id: 'ses_stub_1', deviceName: 'Chrome on Windows', ipAddress: '106.51.24.118', current: true, isCurrent: true, lastActiveAt: ISO(0), createdAt: ISO(0), expiresAt: ISO(7) },
      { id: 'ses_stub_2', deviceName: 'Safari on iPhone', ipAddress: '106.51.24.202', current: false, isCurrent: false, lastActiveAt: ISO(-1), createdAt: ISO(-4), expiresAt: ISO(3) },
    ],
  ],
  [/^\/support/, []],
  [/^\/health/, { status: 'ok', timestamp: ISO(0) }],
  [
    /^\/(ai|copilot)/,
    { answer: 'Saturday dinner is your strongest service. Terrace covers fall about 18% on rainy evenings.', suggestions: [], pairings: [] },
  ],
  // Customer-facing QR endpoints.
  [
    /^\/public\/tables\/[^/]+\/session/,
    { sessionId: 'psn_stub_0001', tableId: tables[0].id, tableName: tables[0].name, restaurantName: restaurant.name, restaurantId: RESTAURANT_ID, branchId: BRANCH_ID, currency: 'INR', status: 'ACTIVE' },
  ],
  [
    /^\/public\/tables\/[^/]+\/cart/,
    {
      id: 'crt_stub_0001',
      items: menuItems.slice(0, 3).map((m, j) => ({ id: `cit_${j}`, menuItemId: m.id, name: m.name, menuItemName: m.name, quantity: j + 1, unitPrice: m.price, price: m.price, totalPrice: m.price * (j + 1), notes: null })),
      subtotal: 1420,
      taxAmount: 71,
      discountAmount: 0,
      totalAmount: 1491,
      total: 1491,
      itemsCount: 3,
    },
  ],
  [/^\/public\/tables\/[^/]+\/orders\/[^/?]+/, orders[0]],
  [/^\/public\/tables\/[^/]+\/orders/, orders.slice(0, 3)],
  [
    /^\/public\/tables\/[^/]+\/menu/,
    { menu: menus[0], categories, restaurantName: restaurant.name, tableName: tables[0].name, currency: 'INR' },
  ],
  [
    /^\/public\/tables\/[^/?]+/,
    { table: tables[0], tableName: tables[0].name, restaurant: { id: RESTAURANT_ID, name: restaurant.name, currency: 'INR' }, restaurantName: restaurant.name, menu: menus[0], categories, currency: 'INR', status: 'ACTIVE' },
  ],
  [/^\/public/, { restaurantName: restaurant.name, currency: 'INR', categories, menu: menus[0] }],
];

function payloadFor(path: string): unknown {
  for (const [pattern, payload] of ROUTES) {
    if (pattern.test(path)) return payload;
  }
  return null;
}

/** Paths the stub had no fixture for, so a spec can report the gap. */
export const stubMisses = new Set<string>();

/**
 * Installs the stub and a signed-in session.
 *
 * `page.addInitScript` runs before any app script, so the very first render is
 * already authenticated - no redirect-to-login flash to wait out and no
 * spinner frame in the screenshots.
 */
export async function stubSession(page: Page, options: { authenticated?: boolean } = {}): Promise<void> {
  const { authenticated = true } = options;

  if (authenticated) {
    await page.addInitScript(
      ([token, userJson, tenantJson, restaurantJson, branchJson]) => {
        localStorage.setItem('atlas_access_token', token as string);
        localStorage.setItem('atlas_auth_user', userJson as string);
        localStorage.setItem('atlas_current_tenant', tenantJson as string);
        localStorage.setItem('atlas_current_restaurant', restaurantJson as string);
        localStorage.setItem('atlas_current_branch', branchJson as string);
      },
      [
        // Shape only - the stub never verifies it, and nothing signs it.
        'stub.access.token',
        JSON.stringify(user),
        JSON.stringify(tenant),
        JSON.stringify(restaurant),
        JSON.stringify(branches[0]),
      ],
    );
  }

  // The consent banner is a fixed overlay; dismissing it up front keeps it out
  // of every screenshot and out of the overflow measurements.
  await page.addInitScript(() => {
    for (const key of ['atlas_cookie_consent', 'kafei_cookie_consent', 'cookie_consent', 'atlas_cookie_choice']) {
      localStorage.setItem(key, 'accepted');
    }
  });

  await page.route('**/api/proxy/**', async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/api\/proxy/, '') + (url.search || '');
    const method = route.request().method();

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    // A write is acknowledged rather than applied: these screens are being
    // measured, not driven, and an unhandled rejection would blank the page.
    if (method !== 'GET') {
      let echoed: Record<string, unknown> = {};
      try {
        echoed = JSON.parse(route.request().postData() || '{}');
      } catch {
        echoed = {};
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'stub_created', ...echoed } }),
      });
      return;
    }

    const payload = payloadFor(path);

    if (payload === null) {
      stubMisses.add(path.split('?')[0]);
      // Unknown GET: an empty list is the least destructive answer, and the
      // miss is recorded so the fixture can grow to cover the screen.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
      });
      return;
    }

    const isEnvelope =
      payload !== null && typeof payload === 'object' && !Array.isArray(payload) && 'data' in (payload as Record<string, unknown>);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(isEnvelope ? { success: true, ...(payload as Record<string, unknown>) } : { success: true, data: payload }),
    });
  });
}

export { user as stubUser, restaurant as stubRestaurant, tables as stubTables, orders as stubOrders, menus as stubMenus };
