const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../apps/api/dist/generated/prisma/client');
require('dotenv').config({ path: 'apps/api/.env' });

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  const restaurants = await prisma.restaurant.findMany({
    where: {
      name: { contains: 'sweta', mode: 'insensitive' },
    },
    include: {
      tenant: true,
      branches: {
        include: {
          tables: true,
        },
      },
      menus: {
        include: {
          categories: {
            include: {
              items: {
                include: {
                  variants: true,
                  addons: true,
                },
              },
            },
          },
        },
      },
      taxRates: true,
    },
  });

  console.log('Found Restaurants:', JSON.stringify(restaurants, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
