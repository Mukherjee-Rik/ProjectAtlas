import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../apps/api/dist/generated/prisma/client.js');
const { PrismaPg } = require('../apps/api/node_modules/@prisma/adapter-pg');
const { detectIntent, extractDateRange } = require('../apps/api/dist/modules/ai/utils/nlp-matcher.js');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Replicate AiContextService & AiService logic in test runner
async function testQueries() {
  const restaurantId = '2fe8cdb4-2467-4cf8-92fe-f32bd8ce5340'; // Cafe Rizz

  const queries = [
    "what were today's sales?",
    "what can be the sales of tomorow?",
    "what was the sales yesterday?",
    "what are our top selling dishes?",
  ];

  console.log('========================================================================');
  console.log('                 VERIFYING KAFEI AI ASSISTANT QUERIES                   ');
  console.log('========================================================================\n');

  for (const q of queries) {
    console.log(`\n💬 User Question: "${q}"`);
    const { intent } = detectIntent(q);
    const { startDate, endDate, label } = extractDateRange(q);
    console.log(`   - Detected Intent: ${intent}`);
    console.log(`   - Date Window: ${label} (${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)})`);

    // Fetch orders in window
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: { notIn: ['CANCELLED'] },
        createdAt: { gte: startDate, lte: endDate },
      },
      include: { items: true },
    });

    const totalSales = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    console.log(`   - Direct Orders Found in Window: ${orders.length}`);
    console.log(`   - Direct Revenue in Window: ₹${totalSales.toFixed(2)}`);

    if (intent === 'FORECAST' || startDate.getTime() > Date.now()) {
      // Forecast extrapolation from trailing orders
      const trailingStart = new Date(Date.now() - 14 * 86400000);
      const recentOrders = await prisma.order.findMany({
        where: {
          restaurantId,
          status: { notIn: ['CANCELLED'] },
          createdAt: { gte: trailingStart },
        },
      });

      const daySet = new Set(recentOrders.map((o) => o.createdAt.toISOString().slice(0, 10)));
      const daysCount = Math.max(daySet.size, 1);
      const trailingTotal = recentOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const dailyAvgSales = Math.round(trailingTotal / daysCount);
      const dailyAvgOrders = Math.round(recentOrders.length / daysCount);

      const targetDow = startDate.getDay();
      const isWeekend = targetDow === 0 || targetDow === 6;
      const dowMultiplier = isWeekend ? 1.15 : 1.0;

      const predictedSales = Math.round(dailyAvgSales * dowMultiplier);
      const predictedOrders = Math.round(dailyAvgOrders * dowMultiplier);

      console.log(`   ⭐ FORECAST GENERATED FOR ${label}:`);
      console.log(`      • Projected Sales: ₹${predictedSales.toLocaleString('en-IN')}`);
      console.log(`      • Projected Orders: ${predictedOrders}`);
      console.log(`      • Expected Range: ₹${Math.round(predictedSales * 0.85).toLocaleString('en-IN')} – ₹${Math.round(predictedSales * 1.15).toLocaleString('en-IN')}`);
    }
  }

  console.log('\n========================================================================\n');
}

testQueries()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
