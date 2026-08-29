import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';
import { UserRole, UserStatus } from './generated/prisma/enums';

const ADMIN_EMAIL = 'atlas@atlas.com';
const ADMIN_PASSWORD = 'Atlas@12345';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      name: 'Atlas Platform Admin',
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.PLATFORM_ADMIN,
      status: UserStatus.ACTIVE,
    },
    update: {
      passwordHash,
      role: UserRole.PLATFORM_ADMIN,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
    },
  });

  console.log(
    `Platform admin ready: ${user.email} | ${user.role} | ${user.status}`,
  );

  // Seed default SaaS plans
  const plans = [
    {
      name: 'Free',
      price: 0,
      currency: 'INR',
      billingCycle: 'MONTHLY' as any,
      trialDays: 14,
      description: 'Basic POS + QR menu',
      features: ['qr_menu', 'table_management'],
      limits: { maxTables: 10, maxStaff: 3, maxBranches: 1, maxMenus: 1 },
      status: 'ACTIVE' as any,
    },
    {
      name: 'Starter',
      price: 499,
      currency: 'INR',
      billingCycle: 'MONTHLY' as any,
      trialDays: 14,
      description: 'More tables + staff',
      features: ['qr_menu', 'table_management', 'orders', 'kitchen'],
      limits: { maxTables: 20, maxStaff: 5, maxBranches: 1, maxMenus: 2 },
      status: 'ACTIVE' as any,
    },
    {
      name: 'Growth',
      price: 999,
      currency: 'INR',
      billingCycle: 'MONTHLY' as any,
      trialDays: 14,
      description: 'Advanced features for single/multi restaurant',
      features: ['qr_menu', 'table_management', 'orders', 'kitchen', 'analytics'],
      limits: { maxTables: 100, maxStaff: 50, maxBranches: 5, maxMenus: 20 },
      status: 'ACTIVE' as any,
    },
    {
      name: 'Enterprise',
      price: 4999,
      currency: 'INR',
      billingCycle: 'YEARLY' as any,
      trialDays: 30,
      description: 'Starting from ₹4,999 / year for large restaurant chains',
      features: ['qr_menu', 'table_management', 'orders', 'kitchen', 'analytics', 'multi_branch', 'priority_support'],
      limits: { maxTables: -1, maxStaff: -1, maxBranches: -1, maxMenus: -1 },
      status: 'ACTIVE' as any,
    },
  ];

  for (const plan of plans) {
    const seededPlan = await prisma.plan.upsert({
      where: { name: plan.name },
      create: plan,
      update: plan,
    });
    console.log(`Plan seeded: ${seededPlan.name} | Price: ${seededPlan.price}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
