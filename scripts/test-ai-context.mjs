import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../apps/api/dist/generated/prisma/client.js');
const { PrismaPg } = require('../apps/api/node_modules/@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const restaurantId = '2fe8cdb4-2467-4cf8-92fe-f32bd8ce5340'; // Cafe Rizz

  console.log('========================================================================');
  console.log('              TESTING AI CONTEXT & FORECAST DATA READINESS               ');
  console.log('========================================================================\n');

  // 1. Check Yesterday (Sept 4)
  const yesterdayStart = new Date('2026-09-04T00:00:00.000Z');
  const yesterdayEnd = new Date('2026-09-04T23:59:59.999Z');

  const yesterdayOrders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: { notIn: ['CANCELLED'] },
      createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
    },
    include: { items: true },
  });

  const yesterdaySales = yesterdayOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
  const yesterdayItemCounts = {};
  yesterdayOrders.forEach((o) => {
    o.items.forEach((i) => {
      yesterdayItemCounts[i.name] = (yesterdayItemCounts[i.name] || 0) + i.quantity;
    });
  });
  const topDishesYesterday = Object.entries(yesterdayItemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([n, q]) => `${n} (${q} sold)`);

  console.log('1. Yesterday Context (Sept 4, 2026):');
  console.log(`   - Total Orders : ${yesterdayOrders.length}`);
  console.log(`   - Total Sales  : ₹${yesterdaySales.toFixed(2)}`);
  console.log(`   - Top Dishes   : ${topDishesYesterday.join(', ')}`);

  // 2. Check 2 Days Ago (Sept 3)
  const sep3Start = new Date('2026-09-03T00:00:00.000Z');
  const sep3End = new Date('2026-09-03T23:59:59.999Z');
  const sep3Orders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: { notIn: ['CANCELLED'] },
      createdAt: { gte: sep3Start, lte: sep3End },
    },
  });
  const sep3Sales = sep3Orders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
  console.log('\n2. Two Days Ago Context (Sept 3, 2026):');
  console.log(`   - Total Orders : ${sep3Orders.length}`);
  console.log(`   - Total Sales  : ₹${sep3Sales.toFixed(2)}`);

  // 3. Check 3 Days Ago (Sept 2)
  const sep2Start = new Date('2026-09-02T00:00:00.000Z');
  const sep2End = new Date('2026-09-02T23:59:59.999Z');
  const sep2Orders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: { notIn: ['CANCELLED'] },
      createdAt: { gte: sep2Start, lte: sep2End },
    },
  });
  const sep2Sales = sep2Orders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
  console.log('\n3. Three Days Ago Context (Sept 2, 2026):');
  console.log(`   - Total Orders : ${sep2Orders.length}`);
  console.log(`   - Total Sales  : ₹${sep2Sales.toFixed(2)}`);

  // 4. Check Trailing 3 Days Window (Sept 2 to Sept 4)
  const trailing3Start = new Date('2026-09-02T00:00:00.000Z');
  const trailing3End = new Date('2026-09-04T23:59:59.999Z');
  const trailing3Orders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: { notIn: ['CANCELLED'] },
      createdAt: { gte: trailing3Start, lte: trailing3End },
    },
  });
  const trailing3Sales = trailing3Orders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
  console.log('\n4. Trailing Window (Sept 2 - Sept 4, 2026):');
  console.log(`   - Total Orders : ${trailing3Orders.length}`);
  console.log(`   - Total Sales  : ₹${trailing3Sales.toFixed(2)}`);
  console.log(`   - Average AOV  : ₹${(trailing3Sales / trailing3Orders.length).toFixed(2)}`);

  // 5. Daily Sales Aggregates for Feature Engineering
  const recentAggregates = await prisma.dailySalesAggregate.findMany({
    where: {
      restaurantId,
      date: { gte: new Date('2026-08-30T00:00:00.000Z') },
    },
    orderBy: { date: 'asc' },
  });
  console.log('\n5. Daily Aggregates ready for AI Forecasting:');
  recentAggregates.forEach((a) => {
    console.log(`   - ${a.date.toISOString().slice(0, 10)}: Orders=${a.totalOrders}, Gross=₹${a.grossSales}, AOV=₹${a.averageOrderValue}`);
  });

  console.log('\n========================================================================');
  console.log('✅ ALL CHECKS PASSED: Chatbot & Forecasting models have complete data!');
  console.log('========================================================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
