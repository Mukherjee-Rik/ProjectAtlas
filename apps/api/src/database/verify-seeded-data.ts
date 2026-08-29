import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    include: {
      orders: {
        include: {
          items: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  console.log('========================================');
  console.log('📊 AI READY DATA OVERVIEW');
  console.log('========================================');

  for (const r of restaurants) {
    const validOrders = r.orders.filter((o) => o.status !== 'CANCELLED');
    const cancelledOrders = r.orders.filter((o) => o.status === 'CANCELLED');
    const totalSales = validOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const itemCounts: Record<string, number> = {};
    validOrders.forEach((o) => {
      o.items.forEach((i) => {
        itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
      });
    });

    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => `${name} (${count} sold)`);

    console.log(`\n🍽️ Restaurant: ${r.name}`);
    console.log(`   - Total Orders: ${r.orders.length}`);
    console.log(`   - Total Revenue: ₹${Math.round(totalSales).toLocaleString('en-IN')}`);
    console.log(`   - Cancelled Orders: ${cancelledOrders.length}`);
    console.log(`   - Top Selling Dishes: ${topItems.join(', ')}`);
    if (r.orders.length > 0) {
      console.log(`   - Date Span: ${r.orders[0].createdAt.toLocaleDateString()} to ${r.orders[r.orders.length - 1].createdAt.toLocaleDateString()}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
