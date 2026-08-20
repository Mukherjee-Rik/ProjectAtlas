import { PrismaClient } from './apps/api/src/generated/prisma';

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      memberships: {
        select: {
          id: true,
          role: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              restaurants: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  branches: { select: { id: true, name: true, code: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  console.log('=== ALL USERS & MEMBERSHIPS ===');
  console.log(JSON.stringify(users, null, 2));

  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
      tenantId: true,
      tenant: { select: { name: true } },
      branches: { select: { id: true, name: true } },
    },
  });
  console.log('=== ALL RESTAURANTS ===');
  console.log(JSON.stringify(restaurants, null, 2));

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
