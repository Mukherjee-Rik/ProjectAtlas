import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const require = createRequire(import.meta.url);
const { PrismaClient, Prisma } = require('../apps/api/dist/generated/prisma/client.js');
const { PrismaPg } = require('../apps/api/node_modules/@prisma/adapter-pg');
const { OrderStatus, PaymentStatus, PaymentMethod, OrderSource } = require('../apps/api/dist/generated/prisma/enums');
const crypto = require('node:crypto');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$connect();
  console.log('========================================================================');
  console.log('   SEEDING HISTORICAL ORDERS FOR CAFE RIZZ (SEPT 2 - SEPT 4, 2026)      ');
  console.log('========================================================================\n');

  const restaurantId = '2fe8cdb4-2467-4cf8-92fe-f32bd8ce5340'; // Cafe Rizz
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      tenant: true,
      branches: {
        include: {
          diningAreas: {
            include: { tables: true },
          },
        },
      },
      menus: {
        where: { status: 'ACTIVE' },
        include: {
          categories: {
            where: { status: 'ACTIVE' },
            include: {
              items: {
                where: { status: 'ACTIVE' },
                include: { taxRate: true },
              },
            },
          },
        },
      },
    },
  });

  if (!restaurant) throw new Error('Cafe Rizz not found!');

  const branch = restaurant.branches[0];
  const tables = branch.diningAreas.flatMap((d) => d.tables);
  const items = restaurant.menus.flatMap((m) => m.categories.flatMap((c) => c.items));

  const getItem = (name) => {
    const found = items.find((i) => i.name.toLowerCase().includes(name.toLowerCase()));
    if (!found) throw new Error(`Item "${name}" not found!`);
    return found;
  };

  // Pre-fetch commonly ordered items
  const chickenBiryani = getItem('Chicken Biryani');
  const muttonKosha = getItem('Mutton Kosha');
  const paneerButterMasala = getItem('Paneer Butter Masala');
  const chickenTikka = getItem('Chicken Tikka');
  const paneerTikka = getItem('Paneer Tikka');
  const butterNaan = getItem('Butter Naan');
  const tandooriRoti = getItem('Tandoori Roti');
  const jeeraRice = getItem('Jeera Rice');
  const vegFriedRice = getItem('Veg Fried Rice');
  const chilliChicken = getItem('Chilli Chicken');
  const dalTadka = getItem('Dal Tadka');
  const tomatoSoup = getItem('Tomato Soup');
  const greenSalad = getItem('Green Salad');
  const gulabJamun = getItem('Gulab Jamun');
  const chocolateBrownie = getItem('Chocolate Brownie');
  const mangoLassi = getItem('Mango Lassi');
  const filterCoffee = getItem('Filter Coffee');
  const freshLimeSoda = getItem('Fresh Lime Soda');

  // Days specification
  const days = [
    // ------------------------------------------------------------------------
    // WEDNESDAY, SEPT 2, 2026: 8 Orders | Total ~₹11,600 | AOV ~₹1,450
    // ------------------------------------------------------------------------
    {
      dateString: '2026-09-02',
      dateObj: new Date('2026-09-02T00:00:00.000Z'),
      orders: [
        // 1. Lunch 12:15 PM IST (06:45 UTC)
        {
          timeIso: '2026-09-02T06:45:00.000Z',
          tableIdx: 0,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 20.0,
          items: [
            { item: chickenBiryani, qty: 2 },
            { item: chickenTikka, qty: 2 },
            { item: dalTadka, qty: 1 },
            { item: tandooriRoti, qty: 4 },
            { item: freshLimeSoda, qty: 2 },
          ],
        },
        // 2. Lunch 12:50 PM IST (07:20 UTC)
        {
          timeIso: '2026-09-02T07:20:00.000Z',
          tableIdx: 1,
          source: OrderSource.WAITER,
          paymentMethod: PaymentMethod.CARD,
          discount: 15.0,
          items: [
            { item: muttonKosha, qty: 2 },
            { item: butterNaan, qty: 4 },
            { item: jeeraRice, qty: 1 },
            { item: mangoLassi, qty: 2 },
            { item: gulabJamun, qty: 2 },
          ],
        },
        // 3. Lunch 1:30 PM IST (08:00 UTC)
        {
          timeIso: '2026-09-02T08:00:00.000Z',
          tableIdx: 2,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 0.0,
          items: [
            { item: paneerButterMasala, qty: 2 },
            { item: dalTadka, qty: 1 },
            { item: butterNaan, qty: 4 },
            { item: vegFriedRice, qty: 2 },
            { item: greenSalad, qty: 1 },
          ],
        },
        // 4. Lunch 2:15 PM IST (08:45 UTC)
        {
          timeIso: '2026-09-02T08:45:00.000Z',
          tableIdx: 3,
          source: OrderSource.DIRECT,
          paymentMethod: PaymentMethod.CASH,
          discount: 10.0,
          items: [
            { item: chickenBiryani, qty: 2 },
            { item: chilliChicken, qty: 1 },
            { item: freshLimeSoda, qty: 2 },
            { item: chocolateBrownie, qty: 2 },
          ],
        },
        // 5. Dinner 7:15 PM IST (13:45 UTC)
        {
          timeIso: '2026-09-02T13:45:00.000Z',
          tableIdx: 0,
          source: OrderSource.WAITER,
          paymentMethod: PaymentMethod.CARD,
          discount: 25.0,
          items: [
            { item: muttonKosha, qty: 2 },
            { item: chickenTikka, qty: 2 },
            { item: tandooriRoti, qty: 6 },
            { item: tomatoSoup, qty: 2 },
          ],
        },
        // 6. Dinner 8:00 PM IST (14:30 UTC)
        {
          timeIso: '2026-09-02T14:30:00.000Z',
          tableIdx: 1,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 12.0,
          items: [
            { item: chickenBiryani, qty: 3 },
            { item: paneerTikka, qty: 1 },
            { item: mangoLassi, qty: 3 },
          ],
        },
        // 7. Dinner 8:45 PM IST (15:15 UTC)
        {
          timeIso: '2026-09-02T15:15:00.000Z',
          tableIdx: 2,
          source: OrderSource.WAITER,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 18.0,
          items: [
            { item: chilliChicken, qty: 2 },
            { item: vegFriedRice, qty: 2 },
            { item: chickenTikka, qty: 1 },
            { item: freshLimeSoda, qty: 2 },
            { item: chocolateBrownie, qty: 1 },
          ],
        },
        // 8. Dinner 9:30 PM IST (16:00 UTC)
        {
          timeIso: '2026-09-02T16:00:00.000Z',
          tableIdx: 3,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.CARD,
          discount: 10.0,
          items: [
            { item: muttonKosha, qty: 2 },
            { item: butterNaan, qty: 4 },
            { item: jeeraRice, qty: 2 },
            { item: gulabJamun, qty: 2 },
          ],
        },
      ],
    },

    // ------------------------------------------------------------------------
    // THURSDAY, SEPT 3, 2026: 10 Orders | Total ~₹14,800 | AOV ~₹1,480
    // ------------------------------------------------------------------------
    {
      dateString: '2026-09-03',
      dateObj: new Date('2026-09-03T00:00:00.000Z'),
      orders: [
        // 1. Lunch 12:05 PM IST (06:35 UTC)
        {
          timeIso: '2026-09-03T06:35:00.000Z',
          tableIdx: 0,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 15.0,
          items: [
            { item: chickenBiryani, qty: 2 },
            { item: chickenTikka, qty: 2 },
            { item: dalTadka, qty: 1 },
            { item: tandooriRoti, qty: 4 },
          ],
        },
        // 2. Lunch 12:40 PM IST (07:10 UTC)
        {
          timeIso: '2026-09-03T07:10:00.000Z',
          tableIdx: 1,
          source: OrderSource.WAITER,
          paymentMethod: PaymentMethod.CARD,
          discount: 20.0,
          items: [
            { item: muttonKosha, qty: 2 },
            { item: butterNaan, qty: 4 },
            { item: mangoLassi, qty: 2 },
            { item: greenSalad, qty: 1 },
            { item: gulabJamun, qty: 2 },
          ],
        },
        // 3. Lunch 1:15 PM IST (07:45 UTC)
        {
          timeIso: '2026-09-03T07:45:00.000Z',
          tableIdx: 2,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 0.0,
          items: [
            { item: paneerButterMasala, qty: 2 },
            { item: paneerTikka, qty: 1 },
            { item: butterNaan, qty: 4 },
            { item: jeeraRice, qty: 2 },
            { item: freshLimeSoda, qty: 2 },
          ],
        },
        // 4. Lunch 1:50 PM IST (08:20 UTC)
        {
          timeIso: '2026-09-03T08:20:00.000Z',
          tableIdx: 3,
          source: OrderSource.DIRECT,
          paymentMethod: PaymentMethod.CASH,
          discount: 10.0,
          items: [
            { item: chilliChicken, qty: 2 },
            { item: vegFriedRice, qty: 2 },
            { item: chocolateBrownie, qty: 2 },
          ],
        },
        // 5. Lunch 2:30 PM IST (09:00 UTC)
        {
          timeIso: '2026-09-03T09:00:00.000Z',
          tableIdx: 0,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 25.0,
          items: [
            { item: chickenBiryani, qty: 2 },
            { item: muttonKosha, qty: 1 },
            { item: tandooriRoti, qty: 4 },
            { item: mangoLassi, qty: 2 },
          ],
        },
        // 6. Dinner 7:10 PM IST (13:40 UTC)
        {
          timeIso: '2026-09-03T13:40:00.000Z',
          tableIdx: 1,
          source: OrderSource.WAITER,
          paymentMethod: PaymentMethod.CARD,
          discount: 12.0,
          items: [
            { item: chickenTikka, qty: 2 },
            { item: muttonKosha, qty: 2 },
            { item: butterNaan, qty: 4 },
            { item: tomatoSoup, qty: 2 },
          ],
        },
        // 7. Dinner 7:50 PM IST (14:20 UTC)
        {
          timeIso: '2026-09-03T14:20:00.000Z',
          tableIdx: 2,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 18.0,
          items: [
            { item: chickenBiryani, qty: 3 },
            { item: chilliChicken, qty: 1 },
            { item: freshLimeSoda, qty: 3 },
          ],
        },
        // 8. Dinner 8:30 PM IST (15:00 UTC)
        {
          timeIso: '2026-09-03T15:00:00.000Z',
          tableIdx: 3,
          source: OrderSource.WAITER,
          paymentMethod: PaymentMethod.CARD,
          discount: 15.0,
          items: [
            { item: paneerButterMasala, qty: 2 },
            { item: dalTadka, qty: 1 },
            { item: jeeraRice, qty: 2 },
            { item: butterNaan, qty: 4 },
            { item: gulabJamun, qty: 2 },
          ],
        },
        // 9. Dinner 9:10 PM IST (15:40 UTC)
        {
          timeIso: '2026-09-03T15:40:00.000Z',
          tableIdx: 0,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 0.0,
          items: [
            { item: chickenBiryani, qty: 2 },
            { item: chickenTikka, qty: 2 },
            { item: mangoLassi, qty: 2 },
            { item: chocolateBrownie, qty: 2 },
          ],
        },
        // 10. Dinner 9:50 PM IST (16:20 UTC)
        {
          timeIso: '2026-09-03T16:20:00.000Z',
          tableIdx: 1,
          source: OrderSource.WAITER,
          paymentMethod: PaymentMethod.CASH,
          discount: 14.0,
          items: [
            { item: muttonKosha, qty: 2 },
            { item: butterNaan, qty: 4 },
            { item: jeeraRice, qty: 1 },
            { item: freshLimeSoda, qty: 2 },
            { item: filterCoffee, qty: 2 },
          ],
        },
      ],
    },

    // ------------------------------------------------------------------------
    // FRIDAY, SEPT 4, 2026: 13 Orders | Total ~₹19,800 | AOV ~₹1,523
    // ------------------------------------------------------------------------
    {
      dateString: '2026-09-04',
      dateObj: new Date('2026-09-04T00:00:00.000Z'),
      orders: [
        // 1. Lunch 12:10 PM IST (06:40 UTC)
        {
          timeIso: '2026-09-04T06:40:00.000Z',
          tableIdx: 0,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 20.0,
          items: [
            { item: chickenBiryani, qty: 2 },
            { item: chickenTikka, qty: 2 },
            { item: freshLimeSoda, qty: 2 },
            { item: gulabJamun, qty: 2 },
          ],
        },
        // 2. Lunch 12:45 PM IST (07:15 UTC)
        {
          timeIso: '2026-09-04T07:15:00.000Z',
          tableIdx: 1,
          source: OrderSource.WAITER,
          paymentMethod: PaymentMethod.CARD,
          discount: 15.0,
          items: [
            { item: muttonKosha, qty: 2 },
            { item: butterNaan, qty: 4 },
            { item: jeeraRice, qty: 2 },
            { item: mangoLassi, qty: 2 },
          ],
        },
        // 3. Lunch 1:20 PM IST (07:50 UTC)
        {
          timeIso: '2026-09-04T07:50:00.000Z',
          tableIdx: 2,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 0.0,
          items: [
            { item: paneerButterMasala, qty: 2 },
            { item: paneerTikka, qty: 1 },
            { item: dalTadka, qty: 1 },
            { item: butterNaan, qty: 4 },
            { item: greenSalad, qty: 1 },
          ],
        },
        // 4. Lunch 1:55 PM IST (08:25 UTC)
        {
          timeIso: '2026-09-04T08:25:00.000Z',
          tableIdx: 3,
          source: OrderSource.DIRECT,
          paymentMethod: PaymentMethod.CASH,
          discount: 10.0,
          items: [
            { item: chilliChicken, qty: 2 },
            { item: vegFriedRice, qty: 2 },
            { item: chocolateBrownie, qty: 2 },
          ],
        },
        // 5. Lunch 2:35 PM IST (09:05 UTC)
        {
          timeIso: '2026-09-04T09:05:00.000Z',
          tableIdx: 0,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 25.0,
          items: [
            { item: chickenBiryani, qty: 2 },
            { item: muttonKosha, qty: 1 },
            { item: tandooriRoti, qty: 4 },
            { item: mangoLassi, qty: 2 },
          ],
        },
        // 6. Dinner 6:45 PM IST (13:15 UTC)
        {
          timeIso: '2026-09-04T13:15:00.000Z',
          tableIdx: 1,
          source: OrderSource.WAITER,
          paymentMethod: PaymentMethod.CARD,
          discount: 12.0,
          items: [
            { item: chickenTikka, qty: 2 },
            { item: muttonKosha, qty: 2 },
            { item: butterNaan, qty: 4 },
            { item: tomatoSoup, qty: 2 },
          ],
        },
        // 7. Dinner 7:15 PM IST (13:45 UTC)
        {
          timeIso: '2026-09-04T13:45:00.000Z',
          tableIdx: 2,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 18.0,
          items: [
            { item: chickenBiryani, qty: 3 },
            { item: chilliChicken, qty: 1 },
            { item: freshLimeSoda, qty: 3 },
          ],
        },
        // 8. Dinner 7:45 PM IST (14:15 UTC)
        {
          timeIso: '2026-09-04T14:15:00.000Z',
          tableIdx: 3,
          source: OrderSource.WAITER,
          paymentMethod: PaymentMethod.CARD,
          discount: 15.0,
          items: [
            { item: paneerButterMasala, qty: 2 },
            { item: dalTadka, qty: 1 },
            { item: jeeraRice, qty: 2 },
            { item: butterNaan, qty: 4 },
            { item: gulabJamun, qty: 2 },
          ],
        },
        // 9. Dinner 8:15 PM IST (14:45 UTC)
        {
          timeIso: '2026-09-04T14:45:00.000Z',
          tableIdx: 0,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 0.0,
          items: [
            { item: chickenBiryani, qty: 2 },
            { item: chickenTikka, qty: 2 },
            { item: mangoLassi, qty: 2 },
            { item: chocolateBrownie, qty: 2 },
          ],
        },
        // 10. Dinner 8:45 PM IST (15:15 UTC)
        {
          timeIso: '2026-09-04T15:15:00.000Z',
          tableIdx: 1,
          source: OrderSource.WAITER,
          paymentMethod: PaymentMethod.CASH,
          discount: 14.0,
          items: [
            { item: muttonKosha, qty: 2 },
            { item: butterNaan, qty: 4 },
            { item: jeeraRice, qty: 1 },
            { item: freshLimeSoda, qty: 2 },
            { item: filterCoffee, qty: 2 },
          ],
        },
        // 11. Dinner 9:15 PM IST (15:45 UTC)
        {
          timeIso: '2026-09-04T15:45:00.000Z',
          tableIdx: 2,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 22.0,
          items: [
            { item: chickenBiryani, qty: 2 },
            { item: chilliChicken, qty: 2 },
            { item: butterNaan, qty: 2 },
            { item: mangoLassi, qty: 2 },
          ],
        },
        // 12. Dinner 9:45 PM IST (16:15 UTC)
        {
          timeIso: '2026-09-04T16:15:00.000Z',
          tableIdx: 3,
          source: OrderSource.WAITER,
          paymentMethod: PaymentMethod.CARD,
          discount: 16.0,
          items: [
            { item: muttonKosha, qty: 2 },
            { item: chickenTikka, qty: 1 },
            { item: butterNaan, qty: 4 },
            { item: gulabJamun, qty: 2 },
          ],
        },
        // 13. Dinner 10:15 PM IST (16:45 UTC)
        {
          timeIso: '2026-09-04T16:45:00.000Z',
          tableIdx: 0,
          source: OrderSource.QR,
          paymentMethod: PaymentMethod.UPI_INTENT,
          discount: 10.0,
          items: [
            { item: chickenBiryani, qty: 2 },
            { item: paneerButterMasala, qty: 1 },
            { item: tandooriRoti, qty: 4 },
            { item: chocolateBrownie, qty: 2 },
          ],
        },
      ],
    },
  ];

  // Check current order count
  const orderCount = await prisma.order.count({
    where: { restaurantId: restaurant.id },
  });
  let nextSeq = orderCount + 1;

  let totalOrdersCreatedOverall = 0;
  let totalRevenueOverall = 0;

  for (const day of days) {
    console.log(`\n📅 Processing ${day.dateString}...`);
    const createdOrdersThisDay = [];
    const metricsAggregationThisDay = {};

    for (let i = 0; i < day.orders.length; i++) {
      const conf = day.orders[i];
      const table = tables[conf.tableIdx % tables.length];
      const orderDate = new Date(conf.timeIso);

      // Compute items
      let subtotalAcc = new Prisma.Decimal(0);
      let taxAcc = new Prisma.Decimal(0);
      const itemCreations = [];

      for (const { item, qty } of conf.items) {
        const unitPrice = new Prisma.Decimal(item.price);
        const lineTotal = unitPrice.mul(qty);
        subtotalAcc = subtotalAcc.add(lineTotal);

        let itemTax = new Prisma.Decimal(0);
        if (item.taxRate && item.taxRate.status === 'ACTIVE') {
          itemTax = lineTotal.mul(item.taxRate.value).div(100);
        }
        taxAcc = taxAcc.add(itemTax);

        itemCreations.push({
          menuItemId: item.id,
          name: item.name,
          quantity: qty,
          unitPrice,
          totalPrice: lineTotal,
          taxAmount: itemTax,
        });

        // Track metric
        if (!metricsAggregationThisDay[item.id]) {
          metricsAggregationThisDay[item.id] = { qty: 0, revenue: new Prisma.Decimal(0) };
        }
        metricsAggregationThisDay[item.id].qty += qty;
        metricsAggregationThisDay[item.id].revenue = metricsAggregationThisDay[item.id].revenue.add(lineTotal);
      }

      const discountAmount = new Prisma.Decimal(conf.discount.toFixed(2));
      const totalAmount = subtotalAcc.add(taxAcc).sub(discountAmount);

      // Unique orderNumber
      let orderNumber = `AT-${String(nextSeq).padStart(6, '0')}`;
      let existing = await prisma.order.findUnique({
        where: { restaurantId_orderNumber: { restaurantId: restaurant.id, orderNumber } },
      });
      while (existing) {
        nextSeq++;
        orderNumber = `AT-${String(nextSeq).padStart(6, '0')}`;
        existing = await prisma.order.findUnique({
          where: { restaurantId_orderNumber: { restaurantId: restaurant.id, orderNumber } },
        });
      }
      nextSeq++;

      // Create session
      const sessionToken = `cs_${crypto.randomUUID().replace(/-/g, '')}`;
      const session = await prisma.customerSession.create({
        data: {
          tableId: table.id,
          sessionToken,
          status: 'ENDED',
          startedAt: orderDate,
          endedAt: new Date(orderDate.getTime() + 45 * 60 * 1000),
        },
      });

      // Create Order
      const order = await prisma.order.create({
        data: {
          restaurantId: restaurant.id,
          branchId: branch.id,
          tableId: table.id,
          customerSessionId: session.id,
          orderNumber,
          status: OrderStatus.COMPLETED,
          source: conf.source,
          subtotal: subtotalAcc,
          taxAmount: taxAcc,
          discountAmount,
          totalAmount,
          createdAt: orderDate,
          updatedAt: new Date(orderDate.getTime() + 40 * 60 * 1000),
          items: {
            create: itemCreations,
          },
        },
        include: {
          items: true,
          table: true,
        },
      });

      // Create Payment
      await prisma.payment.create({
        data: {
          tenantId: restaurant.tenantId,
          restaurantId: restaurant.id,
          orderId: order.id,
          customerSessionId: session.id,
          amount: totalAmount,
          method: conf.paymentMethod,
          status: PaymentStatus.SUCCESS,
          transactionReference: `PAY-${orderNumber}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          paidAt: new Date(orderDate.getTime() + 35 * 60 * 1000),
          createdAt: new Date(orderDate.getTime() + 35 * 60 * 1000),
          updatedAt: new Date(orderDate.getTime() + 35 * 60 * 1000),
        },
      });

      // Create Invoice
      const invoiceNumber = `INV-${day.dateString.replace(/-/g, '')}-${String(i + 1).padStart(4, '0')}`;
      await prisma.invoice.create({
        data: {
          tenantId: restaurant.tenantId,
          branchId: branch.id,
          orderId: order.id,
          invoiceNumber,
          subtotal: subtotalAcc,
          cgstAmount: taxAcc.div(2),
          sgstAmount: taxAcc.div(2),
          discountAmount,
          finalTotal: totalAmount,
          isSettled: true,
          issuedAt: new Date(orderDate.getTime() + 35 * 60 * 1000),
          createdAt: new Date(orderDate.getTime() + 35 * 60 * 1000),
          updatedAt: new Date(orderDate.getTime() + 35 * 60 * 1000),
        },
      });

      createdOrdersThisDay.push(order);
      totalOrdersCreatedOverall++;
      totalRevenueOverall += Number(totalAmount);
      console.log(`  [✓] ${order.orderNumber} | ${conf.timeIso.slice(11, 16)} UTC | Table: ${table.name} | ₹${Number(totalAmount).toFixed(2)} | ${conf.paymentMethod}`);
    }

    // Daily Sales Aggregate calculation
    const sumGross = createdOrdersThisDay.reduce((acc, o) => acc + Number(o.totalAmount), 0);
    const sumNet = createdOrdersThisDay.reduce((acc, o) => acc + Number(o.subtotal), 0);
    const sumTax = createdOrdersThisDay.reduce((acc, o) => acc + Number(o.taxAmount), 0);
    const sumDisc = createdOrdersThisDay.reduce((acc, o) => acc + Number(o.discountAmount), 0);
    const calculatedAOV = sumGross / createdOrdersThisDay.length;

    await prisma.dailySalesAggregate.upsert({
      where: {
        restaurantId_branchId_date: {
          restaurantId: restaurant.id,
          branchId: branch.id,
          date: day.dateObj,
        },
      },
      update: {
        grossSales: new Prisma.Decimal(sumGross),
        netSales: new Prisma.Decimal(sumNet),
        taxAmount: new Prisma.Decimal(sumTax),
        discountAmount: new Prisma.Decimal(sumDisc),
        totalOrders: createdOrdersThisDay.length,
        completedOrders: createdOrdersThisDay.length,
        averageOrderValue: new Prisma.Decimal(calculatedAOV.toFixed(2)),
        dineInOrders: createdOrdersThisDay.length,
        takeoutOrders: 0,
        uniqueCustomers: createdOrdersThisDay.length,
        updatedAt: new Date(),
      },
      create: {
        tenantId: restaurant.tenantId,
        restaurantId: restaurant.id,
        branchId: branch.id,
        date: day.dateObj,
        grossSales: new Prisma.Decimal(sumGross),
        netSales: new Prisma.Decimal(sumNet),
        taxAmount: new Prisma.Decimal(sumTax),
        discountAmount: new Prisma.Decimal(sumDisc),
        totalOrders: createdOrdersThisDay.length,
        completedOrders: createdOrdersThisDay.length,
        averageOrderValue: new Prisma.Decimal(calculatedAOV.toFixed(2)),
        dineInOrders: createdOrdersThisDay.length,
        takeoutOrders: 0,
        uniqueCustomers: createdOrdersThisDay.length,
      },
    });

    // Upsert MenuItemDailyMetrics
    for (const [menuItemId, data] of Object.entries(metricsAggregationThisDay)) {
      await prisma.menuItemDailyMetrics.upsert({
        where: {
          restaurantId_branchId_menuItemId_date: {
            restaurantId: restaurant.id,
            branchId: branch.id,
            menuItemId,
            date: day.dateObj,
          },
        },
        update: {
          quantitySold: data.qty,
          grossRevenue: data.revenue,
          ordersCount: createdOrdersThisDay.filter((o) => o.items.some((it) => it.menuItemId === menuItemId)).length,
          updatedAt: new Date(),
        },
        create: {
          tenantId: restaurant.tenantId,
          restaurantId: restaurant.id,
          branchId: branch.id,
          menuItemId,
          date: day.dateObj,
          quantitySold: data.qty,
          grossRevenue: data.revenue,
          ordersCount: createdOrdersThisDay.filter((o) => o.items.some((it) => it.menuItemId === menuItemId)).length,
        },
      });
    }

    console.log(`  ⭐ ${day.dateString} Aggregate Saved: Orders=${createdOrdersThisDay.length}, Gross=₹${sumGross.toFixed(2)}, AOV=₹${calculatedAOV.toFixed(2)}`);
  }

  console.log('\n========================================================================');
  console.log('              ALL HISTORICAL ORDERS SEEDED SUCCESSFULLY!                 ');
  console.log('========================================================================');
  console.log(`Restaurant            : ${restaurant.name} (${restaurant.id})`);
  console.log(`Dates Covered         : Sept 2, Sept 3, Sept 4 (2026)`);
  console.log(`Total Orders Created  : ${totalOrdersCreatedOverall}`);
  console.log(`Total Revenue Added   : ₹${totalRevenueOverall.toFixed(2)}`);
  console.log('========================================================================\n');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Execution error:', err);
  process.exit(1);
});
