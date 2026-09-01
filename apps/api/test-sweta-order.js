const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('./dist/generated/prisma/client');
require('dotenv').config();

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  const item = await prisma.menuItem.findFirst({
    where: { category: { menu: { restaurantId: '2fe8cdb4-2467-4cf8-92fe-f32bd8ce5340' } } },
    include: {
      category: true,
      variantGroups: { include: { variants: true } },
      addonGroups: { include: { addons: true } },
    }
  });

  console.log('Sample MenuItem:', item);

  const allItems = await prisma.menuItem.findMany({
    where: { category: { menu: { restaurantId: '2fe8cdb4-2467-4cf8-92fe-f32bd8ce5340' } } },
    select: {
      id: true,
      name: true,
      price: true,
      status: true,
      variantGroups: {
        select: {
          id: true,
          name: true,
          variants: { select: { id: true, name: true, price: true } }
        }
      },
      addonGroups: {
        select: {
          id: true,
          name: true,
          addons: { select: { id: true, name: true, price: true } }
        }
      }
    }
  });

  console.log('\nAll Menu Items with prices:');
  for (const it of allItems) {
    console.log(`- ${it.name} (ID: ${it.id}) => Price: Rs ${it.price}`);
    for (const vg of it.variantGroups) {
      console.log(`    Variant Group [${vg.name}]:`, vg.variants.map(v => `${v.name} (Rs ${v.price})`));
    }
    for (const ag of it.addonGroups) {
      console.log(`    Addon Group [${ag.name}]:`, ag.addons.map(a => `${a.name} (Rs ${a.price})`));
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
