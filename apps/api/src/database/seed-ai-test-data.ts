import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { OrderStatus, PaymentMethod, PaymentStatus, OrderSource } from '../generated/prisma/enums';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedOrdersForRestaurant(
  restaurant: any,
  daysBack: number,
) {
  console.log(`\n📦 Generating realistic orders (last ${daysBack} days including Today) for: ${restaurant.name} (${restaurant.slug})`);

  const branch = restaurant.branches[0];
  if (!branch) {
    console.log(`⚠️ No branch found for ${restaurant.name}, skipping`);
    return;
  }

  const tables: any[] = branch.diningAreas.flatMap((da: any) => da.tables);
  const menuItems: any[] = restaurant.menus.flatMap((m: any) =>
    m.categories.flatMap((c: any) => c.items),
  );

  if (menuItems.length === 0) {
    console.log(`⚠️ No menu items found for ${restaurant.name}, skipping`);
    return;
  }

  // Create a pool of customer sessions to simulate repeat customers
  const customerSessionIds: string[] = [];
  const totalCustomerSessions = 15;

  for (let i = 0; i < totalCustomerSessions; i++) {
    const table: any = tables.length > 0 ? sample(tables) : null;
    if (table) {
      const session = await prisma.customerSession.create({
        data: {
          tableId: table.id,
          sessionToken: `sess_${restaurant.slug}_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}`,
          status: 'ENDED',
          startedAt: new Date(Date.now() - randomBetween(1, daysBack) * 86400000),
          endedAt: new Date(),
        },
      });
      customerSessionIds.push(session.id);
    }
  }

  const paymentMethods = [
    PaymentMethod.UPI_INTENT,
    PaymentMethod.CASH,
    PaymentMethod.CARD,
    PaymentMethod.RAZORPAY,
  ];

  const cancellationReasons = [
    'Customer changed mind',
    'Order placed by mistake',
    'Customer had to leave urgently',
    'Kitchen delay requested cancellation',
  ];

  let orderIndex = 1;

  for (let d = 0; d <= daysBack; d++) {
    // Orders per day: Today gets 6-8 orders; recent days get 4-7; older days get 3-5
    const isWeekend = (new Date(Date.now() - d * 86400000).getDay() === 0 || new Date(Date.now() - d * 86400000).getDay() === 6);
    let dailyCount = isWeekend ? randomBetween(5, 8) : randomBetween(3, 6);
    if (d === 0) dailyCount = randomBetween(6, 9); // Today

    for (let o = 0; o < dailyCount; o++) {
      const baseDate = new Date(Date.now() - d * 86400000);
      // Peak hour distribution: Lunch (12:30 - 15:00) or Dinner (19:00 - 22:30)
      const isDinner = Math.random() > 0.4;
      const hour = isDinner ? randomBetween(19, 22) : randomBetween(12, 14);
      const minute = randomBetween(5, 55);
      baseDate.setHours(hour, minute, randomBetween(0, 59), 0);

      const table: any = tables.length > 0 ? sample(tables) : null;
      const customerSessionId = customerSessionIds.length > 0 ? sample(customerSessionIds) : null;

      // Status
      let status: OrderStatus = OrderStatus.COMPLETED;
      let isCancelled = false;
      let cancellationReason: string | undefined = undefined;

      if (d === 0) {
        // Today has some active orders and mostly completed
        const rand = Math.random();
        if (rand < 0.15) status = OrderStatus.PREPARING;
        else if (rand < 0.3) status = OrderStatus.CONFIRMED;
        else if (rand < 0.4) status = OrderStatus.READY;
        else if (rand < 0.5) status = OrderStatus.SERVED;
        else status = OrderStatus.COMPLETED;
      } else {
        // Past days: ~92% completed, ~8% cancelled
        if (Math.random() < 0.08) {
          status = OrderStatus.CANCELLED;
          isCancelled = true;
          cancellationReason = sample(cancellationReasons);
        } else {
          status = OrderStatus.COMPLETED;
        }
      }

      // Pick 1 to 4 items
      const numItems = randomBetween(1, Math.min(4, menuItems.length));
      const chosenItems: any[] = [];
      const usedItemIds = new Set<string>();

      for (let k = 0; k < numItems; k++) {
        const item: any = sample(menuItems);
        if (!usedItemIds.has(item.id)) {
          usedItemIds.add(item.id);
          const qty = randomBetween(1, 3);
          chosenItems.push({
            menuItemId: item.id,
            name: item.name,
            unitPrice: Number(item.price),
            quantity: qty,
            totalPrice: Number(item.price) * qty,
            taxAmount: Math.round(Number(item.price) * qty * 0.05 * 100) / 100, // 5% GST
          });
        }
      }

      if (chosenItems.length === 0) continue;

      const subtotal = chosenItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
      const discountAmount = Math.random() < 0.15 ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
      const totalAmount = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;

      const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const orderNumber = `ORD-${restaurant.slug.substring(0, 3).toUpperCase()}-${String(orderIndex).padStart(4, '0')}-${randSuffix}`;
      orderIndex++;

      const createdOrder = await prisma.order.create({
        data: {
          restaurantId: restaurant.id,
          branchId: branch.id,
          tableId: table ? table.id : null,
          customerSessionId: customerSessionId,
          orderNumber,
          status,
          source: OrderSource.DIRECT,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          cancelledAt: isCancelled ? baseDate : null,
          cancellationReason: isCancelled ? cancellationReason : null,
          createdAt: baseDate,
          updatedAt: baseDate,
          items: {
            create: chosenItems.map((ci) => ({
              menuItemId: ci.menuItemId,
              name: ci.name,
              quantity: ci.quantity,
              unitPrice: ci.unitPrice,
              totalPrice: ci.totalPrice,
              taxAmount: ci.taxAmount,
            })),
          },
        },
      });

      // If completed, create payment and invoice
      if (status === OrderStatus.COMPLETED) {
        const method = sample(paymentMethods);
        await prisma.payment.create({
          data: {
            tenantId: restaurant.tenantId,
            restaurantId: restaurant.id,
            orderId: createdOrder.id,
            amount: totalAmount,
            method,
            status: PaymentStatus.SUCCESS,
            transactionReference: `TXN-${restaurant.slug.toUpperCase()}-${Date.now()}-${randomBetween(1000, 9999)}-${randSuffix}`,
            paidAt: baseDate,
            createdAt: baseDate,
            updatedAt: baseDate,
          },
        });

        const halfTax = Math.round((taxAmount / 2) * 100) / 100;
        await prisma.invoice.create({
          data: {
            tenantId: restaurant.tenantId,
            branchId: branch.id,
            orderId: createdOrder.id,
            invoiceNumber: `INV-${restaurant.slug.substring(0, 3).toUpperCase()}-${String(orderIndex).padStart(4, '0')}-${randSuffix}`,
            subtotal,
            cgstAmount: halfTax,
            sgstAmount: halfTax,
            discountAmount,
            finalTotal: totalAmount,
            isSettled: true,
            issuedAt: baseDate,
            createdAt: baseDate,
            updatedAt: baseDate,
          },
        });
      }
    }
  }

  console.log(`✅ Seeded ${orderIndex - 1} orders for ${restaurant.name}`);
}

async function main() {
  console.log('🚀 Seeding Comprehensive AI Test Orders (Past 30 Days + Today + Yesterday)...\n');

  // Clear existing orders to avoid overlap
  await prisma.refund.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.cancellationRequest.deleteMany({});
  await prisma.orderItemVariant.deleteMany({});
  await prisma.orderItemAddon.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItemVariant.deleteMany({});
  await prisma.cartItemAddon.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.customerSession.deleteMany({});

  const restaurants = await prisma.restaurant.findMany({
    include: {
      branches: {
        include: {
          diningAreas: {
            include: { tables: true },
          },
        },
      },
      menus: {
        include: {
          categories: {
            include: { items: true },
          },
        },
      },
    },
  });

  for (const restaurant of restaurants) {
    if (restaurant.slug === 'sweta-r-restaurant') {
      // Sweta R Restaurant (Cafe Rizz) gets 30 days of orders
      await seedOrdersForRestaurant(restaurant, 30);
    } else if (restaurant.slug === 'monir-er-ghorer-khaon') {
      // Monir er Ghorer Khaon gets 20 days of orders
      await seedOrdersForRestaurant(restaurant, 20);
    } else if (restaurant.slug === 'rik-er-khaon') {
      // Rik er khaon gets 20 days of orders
      await seedOrdersForRestaurant(restaurant, 20);
    }
  }

  // Summary counts
  const totalOrders = await prisma.order.count();
  const totalOrderItems = await prisma.orderItem.count();
  const totalPayments = await prisma.payment.count();
  const totalInvoices = await prisma.invoice.count();
  const totalCustomerSessions = await prisma.customerSession.count();

  console.log('\n========================================');
  console.log('🎉 AI TEST DATA SEEDING COMPLETE!');
  console.log('========================================');
  console.log(`Total Orders: ${totalOrders}`);
  console.log(`Total Order Items: ${totalOrderItems}`);
  console.log(`Total Payments: ${totalPayments}`);
  console.log(`Total Invoices: ${totalInvoices}`);
  console.log(`Total Customer Sessions: ${totalCustomerSessions}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding AI test data:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
