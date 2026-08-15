import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../apps/api/dist/generated/prisma/client.js');
const { PrismaPg } = require('../apps/api/node_modules/@prisma/adapter-pg');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/atlas?schema=public',
});
const prisma = new PrismaClient({ adapter });

async function seedPlans() {
  console.log('--- UPDATING SUBSCRIPTION PLANS WITH AI_COPILOT GATING ---');

  // 1. Free Plan (No AI Copilot)
  await prisma.plan.upsert({
    where: { name: 'Free' },
    update: {
      price: 0,
      description: 'Basic QR menu and table ordering for single location',
      features: ['qr-menu', 'tables'],
      limits: { maxBranches: 1, maxStaff: 2, maxTables: 5, maxMenus: 2 },
    },
    create: {
      name: 'Free',
      price: 0,
      currency: 'INR',
      billingCycle: 'MONTHLY',
      trialDays: 0,
      description: 'Basic QR menu and table ordering for single location',
      features: ['qr-menu', 'tables'],
      limits: { maxBranches: 1, maxStaff: 2, maxTables: 5, maxMenus: 2 },
      status: 'ACTIVE',
    },
  });

  // 2. Starter Plan (No AI Copilot)
  await prisma.plan.upsert({
    where: { name: 'Starter' },
    update: {
      price: 499,
      description: 'Essential KDS and order management for small cafes',
      features: ['qr-menu', 'tables', 'orders', 'kitchen'],
      limits: { maxBranches: 1, maxStaff: 5, maxTables: 20, maxMenus: 5 },
    },
    create: {
      name: 'Starter',
      price: 499,
      currency: 'INR',
      billingCycle: 'MONTHLY',
      trialDays: 14,
      description: 'Essential KDS and order management for small cafes',
      features: ['qr-menu', 'tables', 'orders', 'kitchen'],
      limits: { maxBranches: 1, maxStaff: 5, maxTables: 20, maxMenus: 5 },
      status: 'ACTIVE',
    },
  });

  // 3. Growth Plan (INCLUDES AI COPILOT & AUTOMATIONS)
  await prisma.plan.upsert({
    where: { name: 'Growth' },
    update: {
      price: 999,
      description: 'Multi-branch operations with AI Restaurant Copilot & Automated Intelligence',
      features: ['qr-menu', 'tables', 'orders', 'kitchen', 'analytics', 'ai_copilot', 'automations'],
      limits: { maxBranches: 5, maxStaff: 50, maxTables: 100, maxMenus: 20 },
    },
    create: {
      name: 'Growth',
      price: 999,
      currency: 'INR',
      billingCycle: 'MONTHLY',
      trialDays: 14,
      description: 'Multi-branch operations with AI Restaurant Copilot & Automated Intelligence',
      features: ['qr-menu', 'tables', 'orders', 'kitchen', 'analytics', 'ai_copilot', 'automations'],
      limits: { maxBranches: 5, maxStaff: 50, maxTables: 100, maxMenus: 20 },
      status: 'ACTIVE',
    },
  });

  // 4. Enterprise Plan (INCLUDES AI COPILOT & ALL FEATURES)
  await prisma.plan.upsert({
    where: { name: 'Enterprise' },
    update: {
      price: 4999,
      description: 'Unlimited branches, full AI intelligence suite, dedicated SLA & support',
      features: ['qr-menu', 'tables', 'orders', 'kitchen', 'analytics', 'multi-branch', 'ai_copilot', 'automations'],
      limits: { maxBranches: -1, maxStaff: -1, maxTables: -1, maxMenus: -1 },
    },
    create: {
      name: 'Enterprise',
      price: 4999,
      currency: 'INR',
      billingCycle: 'MONTHLY',
      trialDays: 14,
      description: 'Unlimited branches, full AI intelligence suite, dedicated SLA & support',
      features: ['qr-menu', 'tables', 'orders', 'kitchen', 'analytics', 'multi-branch', 'ai_copilot', 'automations'],
      limits: { maxBranches: -1, maxStaff: -1, maxTables: -1, maxMenus: -1 },
      status: 'ACTIVE',
    },
  });

  const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' } });
  console.log('✅ Updated Plans:');
  console.table(plans.map(p => ({
    name: p.name,
    price: `₹${p.price}`,
    features: JSON.stringify(p.features),
  })));

  await prisma.$disconnect();
}

seedPlans().catch(console.error);
