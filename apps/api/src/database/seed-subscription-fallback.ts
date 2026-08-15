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

  const restaurants = await prisma.restaurant.findMany();
  console.log(`Found ${restaurants.length} restaurants to check.`);

  // Find or create default plans
  let plan = await prisma.plan.findFirst({
    where: { name: { contains: 'Professional', mode: 'insensitive' } }
  });
  if (!plan) {
    plan = await prisma.plan.findFirst();
  }
  if (!plan) {
    throw new Error('No plans found in the database. Please run ensures:platform-admin or seeds first.');
  }

  for (const rest of restaurants) {
    const sub = await prisma.subscription.findFirst({
      where: { restaurantId: rest.id }
    });

    if (!sub) {
      console.log(`Creating TRIALING subscription for restaurant: ${rest.name}...`);
      const now = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(now.getDate() + 14);

      await prisma.subscription.create({
        data: {
          restaurantId: rest.id,
          planId: plan.id,
          status: 'TRIALING',
          billingCycle: plan.billingCycle,
          trialStart: now,
          trialEnd: trialEnd,
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
        }
      });
      console.log(`Successfully created subscription for: ${rest.name}`);
    } else {
      console.log(`Restaurant ${rest.name} already has a subscription. Status: ${sub.status}`);
      if (sub.status !== 'ACTIVE' && sub.status !== 'TRIALING') {
        console.log(`Re-activating subscription for ${rest.name} to ACTIVE...`);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'ACTIVE' }
        });
      }
    }
  }

  console.log('All restaurant subscriptions checked & updated!');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
