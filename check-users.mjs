import { PrismaClient } from './apps/api/src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      memberships: {
        select: {
          role: true,
          tenant: { select: { name: true } },
        },
      },
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  console.log('--- RECENT USERS IN DATABASE ---');
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

checkUsers().catch(console.error);
