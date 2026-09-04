import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const WHITELISTED_EMAILS = [
  'atlas@atlas.com',
  'rik@atlas.com',
  'sweta@atlas.com',
  'monir@atlas.com',
  'papa@atlas.com',
  'papa@papa.com',
  'maa@atlas.com',
  'bhai@atlas.com',
  'rikmuk@email.com',
];

async function main() {
  console.log('🚀 Starting Clean Selective Database Purge...\n');

  // Step 1: Update papa@papa.com to papa@atlas.com if papa@papa.com exists and papa@atlas.com does not
  const papaPapa = await prisma.user.findUnique({
    where: { email: 'papa@papa.com' },
  });
  const papaAtlas = await prisma.user.findUnique({
    where: { email: 'papa@atlas.com' },
  });

  if (papaPapa && !papaAtlas) {
    await prisma.user.update({
      where: { id: papaPapa.id },
      data: { email: 'papa@atlas.com' },
    });
    console.log('✅ Updated "papa@papa.com" -> "papa@atlas.com"');
  } else if (papaPapa && papaAtlas) {
    console.log(
      'ℹ️ Both papa@papa.com and papa@atlas.com exist; keeping both.',
    );
  }

  // Active whitelist now
  const activeWhitelist = [
    'atlas@atlas.com',
    'rik@atlas.com',
    'sweta@atlas.com',
    'monir@atlas.com',
    'papa@atlas.com',
    'maa@atlas.com',
    'bhai@atlas.com',
    'rikmuk@email.com',
  ];

  // Step 2: Delete transactional bloat across all tables
  console.log('\n--- 1. Purging Transactional & Operational Bloat ---');

  // Order cascade and relationships
  const delRefunds = await prisma.refund.deleteMany({});
  console.log(`- Deleted ${delRefunds.count} Refund records.`);

  const delPayments = await prisma.payment.deleteMany({});
  console.log(`- Deleted ${delPayments.count} Payment records.`);

  const delInvoices = await prisma.invoice.deleteMany({});
  console.log(`- Deleted ${delInvoices.count} Invoice records.`);

  const delCancelReqs = await prisma.cancellationRequest.deleteMany({});
  console.log(`- Deleted ${delCancelReqs.count} CancellationRequest records.`);

  const delExternalOrders = await prisma.externalOrder.deleteMany({});
  console.log(`- Deleted ${delExternalOrders.count} ExternalOrder records.`);

  const delOrderVariants = await prisma.orderItemVariant.deleteMany({});
  console.log(`- Deleted ${delOrderVariants.count} OrderItemVariant records.`);

  const delOrderAddons = await prisma.orderItemAddon.deleteMany({});
  console.log(`- Deleted ${delOrderAddons.count} OrderItemAddon records.`);

  const delOrderItems = await prisma.orderItem.deleteMany({});
  console.log(`- Deleted ${delOrderItems.count} OrderItem records.`);

  const delOrders = await prisma.order.deleteMany({});
  console.log(`- Deleted ${delOrders.count} Order records.`);

  // Customer Sessions & Carts
  const delCartVariants = await prisma.cartItemVariant.deleteMany({});
  console.log(`- Deleted ${delCartVariants.count} CartItemVariant records.`);

  const delCartAddons = await prisma.cartItemAddon.deleteMany({});
  console.log(`- Deleted ${delCartAddons.count} CartItemAddon records.`);

  const delCartItems = await prisma.cartItem.deleteMany({});
  console.log(`- Deleted ${delCartItems.count} CartItem records.`);

  const delCarts = await prisma.cart.deleteMany({});
  console.log(`- Deleted ${delCarts.count} Cart records.`);

  const delCustSessions = await prisma.customerSession.deleteMany({});
  console.log(`- Deleted ${delCustSessions.count} CustomerSession records.`);

  // Analytics, Forecasting, Aggregates
  const delDailySalesAggs = await prisma.dailySalesAggregate.deleteMany({});
  console.log(
    `- Deleted ${delDailySalesAggs.count} DailySalesAggregate records.`,
  );

  const delMenuItemDailyMetrics = await prisma.menuItemDailyMetrics.deleteMany(
    {},
  );
  console.log(
    `- Deleted ${delMenuItemDailyMetrics.count} MenuItemDailyMetrics records.`,
  );

  const delOperationalEvents = await prisma.operationalEvent.deleteMany({});
  console.log(
    `- Deleted ${delOperationalEvents.count} OperationalEvent records.`,
  );

  const delForecastPoints = await prisma.forecastPoint.deleteMany({});
  console.log(`- Deleted ${delForecastPoints.count} ForecastPoint records.`);

  const delForecasts = await prisma.forecast.deleteMany({});
  console.log(`- Deleted ${delForecasts.count} Forecast records.`);

  const delForecastAccuracies = await prisma.forecastAccuracy.deleteMany({});
  console.log(
    `- Deleted ${delForecastAccuracies.count} ForecastAccuracy records.`,
  );

  const delForecastRuns = await prisma.forecastRun.deleteMany({});
  console.log(`- Deleted ${delForecastRuns.count} ForecastRun records.`);

  const delIntelQueryAudits = await prisma.intelligenceQueryAudit.deleteMany(
    {},
  );
  console.log(
    `- Deleted ${delIntelQueryAudits.count} IntelligenceQueryAudit records.`,
  );

  // Inventory transaction logs
  const delStockLedgers = await prisma.stockLedger.deleteMany({});
  console.log(`- Deleted ${delStockLedgers.count} StockLedger records.`);

  const delBatchProductions = await prisma.batchProduction.deleteMany({});
  console.log(
    `- Deleted ${delBatchProductions.count} BatchProduction records.`,
  );

  // Logs, Tokens & Reports
  const delAuditLogs = await prisma.auditLog.deleteMany({});
  console.log(`- Deleted ${delAuditLogs.count} AuditLog records.`);

  const delAiUsages = await prisma.aiUsage.deleteMany({});
  console.log(`- Deleted ${delAiUsages.count} AiUsage records.`);

  const delSessions = await prisma.session.deleteMany({});
  console.log(
    `- Deleted ${delSessions.count} Session records (clean login reset).`,
  );

  const delReportExecs = await prisma.reportExecutionHistory.deleteMany({});
  console.log(
    `- Deleted ${delReportExecs.count} ReportExecutionHistory records.`,
  );

  const delReportSchedules = await prisma.reportSchedule.deleteMany({});
  console.log(`- Deleted ${delReportSchedules.count} ReportSchedule records.`);

  const delCustomReports = await prisma.customReport.deleteMany({});
  console.log(`- Deleted ${delCustomReports.count} CustomReport records.`);

  const delSavedReports = await prisma.savedReport.deleteMany({});
  console.log(`- Deleted ${delSavedReports.count} SavedReport records.`);

  const delNotifications = await prisma.notification.deleteMany({});
  console.log(`- Deleted ${delNotifications.count} Notification records.`);

  const delSupportTickets = await prisma.supportTicket.deleteMany({});
  console.log(`- Deleted ${delSupportTickets.count} SupportTicket records.`);

  const delAutoExecs = await prisma.automationExecution.deleteMany({});
  console.log(`- Deleted ${delAutoExecs.count} AutomationExecution records.`);

  const delAutoRules = await prisma.automationRule.deleteMany({});
  console.log(`- Deleted ${delAutoRules.count} AutomationRule records.`);

  const delCustomers = await prisma.customer.deleteMany({});
  console.log(`- Deleted ${delCustomers.count} Customer records.`);

  const delWebhooks = await prisma.webhookEvent.deleteMany({});
  console.log(`- Deleted ${delWebhooks.count} WebhookEvent records.`);

  // Step 3: Identify whitelisted user IDs and their associated tenant IDs
  console.log('\n--- 2. Resolving Whitelisted Users and Tenants ---');

  const whitelistedUsers = await prisma.user.findMany({
    where: {
      email: { in: activeWhitelist },
    },
    include: {
      memberships: true,
    },
  });

  console.log(`Found ${whitelistedUsers.length} whitelisted users:`);
  whitelistedUsers.forEach((u) =>
    console.log(`  * ${u.email} (${u.name}, ${u.role})`),
  );

  const whitelistedUserIds = whitelistedUsers.map((u) => u.id);
  const whitelistedTenantIds = Array.from(
    new Set(
      whitelistedUsers.flatMap((u) => u.memberships.map((m) => m.tenantId)),
    ),
  );

  console.log(`Associated Tenants to keep (${whitelistedTenantIds.length}):`);
  const keptTenants = await prisma.tenant.findMany({
    where: { id: { in: whitelistedTenantIds } },
    select: { id: true, name: true, slug: true },
  });
  keptTenants.forEach((t) => console.log(`  * ${t.name} (${t.slug})`));

  // Step 4: Delete non-whitelisted Tenants (and cascading restaurants/branches)
  console.log('\n--- 3. Deleting Non-Whitelisted Tenants ---');
  const deletedTenants = await prisma.tenant.deleteMany({
    where: {
      id: { notIn: whitelistedTenantIds },
    },
  });
  console.log(`- Deleted ${deletedTenants.count} non-whitelisted Tenant(s).`);

  // Step 5: Delete non-whitelisted Users
  console.log('\n--- 4. Deleting Non-Whitelisted Users ---');
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { notIn: whitelistedUserIds },
    },
  });
  console.log(`- Deleted ${deletedUsers.count} non-whitelisted User(s).`);

  // Step 6: Reset table statuses to ACTIVE
  console.log('\n--- 5. Resetting Tables & Normalizing Master Data ---');
  const resetTables = await prisma.table.updateMany({
    data: { status: 'ACTIVE' },
  });
  console.log(`- Reset ${resetTables.count} Table(s) to status ACTIVE.`);

  // Step 7: Final Verification Report
  console.log('\n========================================');
  console.log('🎉 PURGE COMPLETED - FINAL DATABASE AUDIT');
  console.log('========================================');

  const finalUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      memberships: {
        select: {
          role: true,
          tenant: { select: { name: true } },
        },
      },
    },
    orderBy: { email: 'asc' },
  });

  console.log(`\nRemaining Users (${finalUsers.length}):`);
  finalUsers.forEach((u, i) => {
    const tenantInfo = u.memberships.length
      ? u.memberships.map((m) => `${m.tenant.name} [${m.role}]`).join(', ')
      : 'No Tenant (Platform Admin)';
    console.log(
      `  ${i + 1}. [${u.email}] ${u.name} | Role: ${u.role} | ${tenantInfo}`,
    );
  });

  const finalTenants = await prisma.tenant.findMany({
    include: {
      restaurants: {
        include: {
          branches: true,
          menus: {
            include: {
              categories: {
                include: {
                  items: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  console.log(`\nRemaining Tenants & Restaurants (${finalTenants.length}):`);
  finalTenants.forEach((t) => {
    console.log(`  🏢 Tenant: ${t.name} (${t.slug})`);
    t.restaurants.forEach((r) => {
      const totalItems = r.menus.reduce(
        (acc, m) =>
          acc + m.categories.reduce((cAcc, c) => cAcc + c.items.length, 0),
        0,
      );
      console.log(
        `     🍽️ Restaurant: ${r.name} | Branches: ${r.branches.length} | Menus: ${r.menus.length} (${totalItems} items)`,
      );
    });
  });

  const finalCounts = {
    users: await prisma.user.count(),
    tenants: await prisma.tenant.count(),
    restaurants: await prisma.restaurant.count(),
    branches: await prisma.branch.count(),
    diningAreas: await prisma.diningArea.count(),
    tables: await prisma.table.count(),
    menus: await prisma.menu.count(),
    menuCategories: await prisma.menuCategory.count(),
    menuItems: await prisma.menuItem.count(),
    recipes: await prisma.recipe.count(),
    ingredients: await prisma.ingredient.count(),
    plans: await prisma.plan.count(),
    subscriptions: await prisma.subscription.count(),
    // Transactional tables (must be 0)
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    payments: await prisma.payment.count(),
    invoices: await prisma.invoice.count(),
    refunds: await prisma.refund.count(),
    cancellationRequests: await prisma.cancellationRequest.count(),
    customerSessions: await prisma.customerSession.count(),
    carts: await prisma.cart.count(),
    cartItems: await prisma.cartItem.count(),
    auditLogs: await prisma.auditLog.count(),
    sessions: await prisma.session.count(),
    aiUsages: await prisma.aiUsage.count(),
    dailySalesAggregates: await prisma.dailySalesAggregate.count(),
    forecasts: await prisma.forecast.count(),
  };

  console.log('\nFinal Table Counts:');
  console.log(JSON.stringify(finalCounts, null, 2));
}

main()
  .catch((e) => {
    console.error('❌ Error during purge:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
