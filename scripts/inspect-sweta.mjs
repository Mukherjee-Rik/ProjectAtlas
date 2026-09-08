import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('./apps/api/src/generated/prisma');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Searching for Sweta restaurant...');
  const restaurants = await prisma.restaurant.findMany({
    where: {
      name: {
        contains: 'sweta',
        mode: 'insensitive'
      }
    },
    include: {
      branches: {
        include: {
          tables: true,
          diningAreas: true
        }
      },
      menus: {
        include: {
          categories: {
            include: {
              items: true
            }
          }
        }
      }
    }
  });

  if (restaurants.length > 0) {
    console.log('FOUND RESTAURANT:');
    for (const r of restaurants) {
      console.log(`ID: ${r.id}, Name: ${r.name}`);
      for (const b of r.branches) {
        console.log(`  Branch: ${b.name} (ID: ${b.id}), Tables: ${b.tables.length}`);
        b.tables.forEach(t => console.log(`    Table ${t.number} (ID: ${t.id}, Status: ${t.status}, Capacity: ${t.capacity})`));
      }
      for (const m of r.menus) {
        console.log(`  Menu: ${m.name} (ID: ${m.id})`);
        for (const c of m.categories) {
          console.log(`    Category: ${c.name} (${c.items.length} items)`);
          c.items.forEach(i => console.log(`      Item: ${i.name} (ID: ${i.id}, Price: ${i.price})`));
        }
      }
    }
  } else {
    console.log('No restaurant matched "sweta". Listing all restaurants:');
    const all = await prisma.restaurant.findMany({
      select: { id: true, name: true, createdAt: true }
    });
    console.log(all);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
