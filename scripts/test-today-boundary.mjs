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
  const restaurantId = '2fe8cdb4-2467-4cf8-92fe-f32bd8ce5340';

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  console.log('now:', now.toISOString());
  console.log('todayStart:', todayStart.toISOString());
  console.log('todayEnd:', todayEnd.toISOString());

  // 1. Query with lte: now
  const ordersNow = await prisma.order.findMany({
    where: {
      restaurantId,
      status: { notIn: ['CANCELLED'] },
      createdAt: { gte: todayStart, lte: now },
    },
  });
  console.log('Orders with lte: now ->', ordersNow.length);

  // 2. Query with lte: todayEnd
  const ordersEnd = await prisma.order.findMany({
    where: {
      restaurantId,
      status: { notIn: ['CANCELLED'] },
      createdAt: { gte: todayStart, lte: todayEnd },
    },
  });
  console.log('Orders with lte: todayEnd ->', ordersEnd.length);
  const total = ordersEnd.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  console.log('Total sales with lte: todayEnd -> ₹' + total);
}

main().catch(console.error).finally(() => prisma.$disconnect());
