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

  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      createdAt: {
        gte: new Date('2026-09-01T00:00:00.000Z'),
      },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      status: true,
      createdAt: true,
    },
  });

  console.log(`\nFound ${orders.length} orders since Sept 1 for Cafe Rizz:`);
  const grouped = {};
  orders.forEach(o => {
    const d = o.createdAt.toISOString().slice(0, 10);
    if (!grouped[d]) grouped[d] = { count: 0, totalRevenue: 0 };
    grouped[d].count++;
    grouped[d].totalRevenue += Number(o.totalAmount);
  });
  console.table(grouped);

  const aggregates = await prisma.dailySalesAggregate.findMany({
    where: {
      restaurantId,
      date: {
        gte: new Date('2026-09-01T00:00:00.000Z'),
      },
    },
    orderBy: { date: 'asc' },
  });

  console.log(`\nDailySalesAggregates since Sept 1: ${aggregates.length}`);
  aggregates.forEach(a => {
    console.log(`${a.date.toISOString().slice(0, 10)}: grossSales=${a.grossSales}, netSales=${a.netSales}, orders=${a.totalOrders}, aov=${a.averageOrderValue}`);
  });

  // Also check last order number to know where to sequence order numbers
  const lastOrder = await prisma.order.findFirst({
    where: { restaurantId },
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true, createdAt: true },
  });
  console.log(`\nLast order recorded:`, lastOrder);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
