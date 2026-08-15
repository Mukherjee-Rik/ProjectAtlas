import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });
  console.log('Connecting to database...');
  await prisma.$connect();

  console.log('Seeding and updating plans with limits...');

  // 1. Free Plan
  await prisma.plan.upsert({
    where: { name: 'Free' },
    update: {
      price: 0,
      limits: {
        maxBranches: 1,
        maxStaff: 2,
        maxTables: 5,
        maxMenus: 2,
      },
    },
    create: {
      name: 'Free',
      price: 0,
      currency: 'INR',
      billingCycle: 'MONTHLY',
      trialDays: 0,
      description: 'Basic POS for single location',
      features: ['qr-menu', 'tables'],
      limits: {
        maxBranches: 1,
        maxStaff: 2,
        maxTables: 5,
        maxMenus: 2,
      },
      status: 'ACTIVE',
    },
  });

  // 2. Starter Plan
  await prisma.plan.upsert({
    where: { name: 'Starter' },
    update: {
      price: 499,
      limits: {
        maxBranches: 1,
        maxStaff: 5,
        maxTables: 20,
        maxMenus: 5,
      },
    },
    create: {
      name: 'Starter',
      price: 499,
      currency: 'INR',
      billingCycle: 'MONTHLY',
      trialDays: 14,
      description: 'More tables + staff for small cafes',
      features: ['qr-menu', 'tables', 'orders', 'kitchen'],
      limits: {
        maxBranches: 1,
        maxStaff: 5,
        maxTables: 20,
        maxMenus: 5,
      },
      status: 'ACTIVE',
    },
  });

  // 3. Growth / Professional Plan
  const professionalPlan = await prisma.plan.findFirst({
    where: { name: 'Professional' }
  });
  if (professionalPlan) {
    console.log('Renaming Professional plan to Growth...');
    await prisma.plan.update({
      where: { id: professionalPlan.id },
      data: {
        name: 'Growth',
        price: 999,
        limits: {
          maxBranches: 5,
          maxStaff: 50,
          maxTables: 100,
          maxMenus: 20,
        },
      }
    });
  } else {
    await prisma.plan.upsert({
      where: { name: 'Growth' },
      update: {
        price: 999,
        limits: {
          maxBranches: 5,
          maxStaff: 50,
          maxTables: 100,
          maxMenus: 20,
        },
      },
      create: {
        name: 'Growth',
        price: 999,
        currency: 'INR',
        billingCycle: 'MONTHLY',
        trialDays: 14,
        description: 'Multi-branch operations with higher staff cap',
        features: ['qr-menu', 'tables', 'orders', 'kitchen', 'analytics'],
        limits: {
          maxBranches: 5,
          maxStaff: 50,
          maxTables: 100,
          maxMenus: 20,
        },
        status: 'ACTIVE',
      },
    });
  }

  // 4. Enterprise Plan
  await prisma.plan.upsert({
    where: { name: 'Enterprise' },
    update: {
      price: 4999,
      limits: {
        maxBranches: -1,
        maxStaff: -1,
        maxTables: -1,
        maxMenus: -1,
      },
    },
    create: {
      name: 'Enterprise',
      price: 4999,
      currency: 'INR',
      billingCycle: 'MONTHLY',
      trialDays: 14,
      description: 'Unlimited branches, staff and dedicated support',
      features: ['qr-menu', 'tables', 'orders', 'kitchen', 'analytics', 'multi-branch'],
      limits: {
        maxBranches: -1,
        maxStaff: -1,
        maxTables: -1,
        maxMenus: -1,
      },
      status: 'ACTIVE',
    },
  });

  console.log('Seeding plans with exact limits completed successfully!');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
