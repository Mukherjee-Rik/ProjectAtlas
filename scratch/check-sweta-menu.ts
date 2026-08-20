import { PrismaClient } from './apps/api/src/generated/prisma';
const prisma = new PrismaClient();

async function run() {
  const sweta = await prisma.restaurant.findFirst({
    where: { name: { contains: 'Sweta', mode: 'insensitive' } },
    include: {
      menus: {
        include: {
          categories: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  });

  console.log('Sweta Restaurant Menus:');
  console.log(JSON.stringify(sweta?.menus, null, 2));

  await prisma.$disconnect();
}

run();
