const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('./dist/generated/prisma/client');
require('dotenv').config();

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { name: { contains: 'sweta', mode: 'insensitive' } },
        { tenant: { name: { contains: 'sweta', mode: 'insensitive' } } }
      ]
    },
    include: {
      tenant: true,
      branches: {
        include: {
          diningAreas: {
            include: {
              tables: {
                orderBy: { name: 'asc' }
              }
            }
          }
        }
      },
      menus: {
        include: {
          categories: {
            include: {
              items: {
                where: { status: 'ACTIVE' }
              }
            }
          }
        }
      }
    }
  });

  if (!restaurant) {
    console.log('No restaurant found matching sweta');
    return;
  }

  console.log(`Restaurant: ${restaurant.name} (${restaurant.id})`);
  console.log(`Tenant: ${restaurant.tenant.name} (${restaurant.tenant.id})`);
  
  for (const b of restaurant.branches) {
    console.log(`\nBranch: ${b.name} (${b.id})`);
    for (const da of b.diningAreas) {
      console.log(`  Dining Area: ${da.name} (${da.id}) - Tables: ${da.tables.length}`);
      da.tables.forEach(t => {
        console.log(`    Table Name: "${t.name}" | Code: ${t.code} | Status: ${t.status} | ID: ${t.id} | Token: ${t.publicToken}`);
      });
    }
  }

  console.log('\nMenu items count:');
  const allItems = [];
  for (const m of restaurant.menus) {
    console.log(`Menu: ${m.name} (${m.status})`);
    for (const c of m.categories) {
      console.log(`  Category: ${c.name} (${c.items.length} active items)`);
      c.items.forEach(i => {
        allItems.push(i);
        console.log(`    - ${i.name.padEnd(35)} : Rs ${i.price}`);
      });
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
