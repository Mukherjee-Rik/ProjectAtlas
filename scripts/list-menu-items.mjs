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
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      menus: {
        include: {
          categories: {
            include: {
              items: {
                include: { taxRate: true },
              },
            },
          },
        },
      },
    },
  });

  const items = restaurant.menus.flatMap(m => m.categories.flatMap(c => c.items));
  console.log(`Found ${items.length} items for Cafe Rizz:`);
  items.forEach(i => {
    console.log(`- ${i.name.padEnd(35)} | Price: ₹${String(i.price).padStart(6)} | Tax: ${i.taxRate ? i.taxRate.value + '%' : 'None'}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
