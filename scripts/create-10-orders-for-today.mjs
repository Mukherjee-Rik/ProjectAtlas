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
  console.log('   GENERATING 10 REALISTIC ORDERS FOR TODAY (AOV = ₹1,500.00)           ');
  console.log('========================================================================\n');

  const restaurantId = '2fe8cdb4-2467-4cf8-92fe-f32bd8ce5340'; // Cafe Rizz (Enterprise)
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      tenant: true,
      branches: {
        include: {
          diningAreas: {
            include: { tables: true }
          }
        }
      },
      menus: {
        where: { status: 'ACTIVE' },
        include: {
          categories: {
            where: { status: 'ACTIVE' },
            include: {
              items: {
                where: { status: 'ACTIVE' },
                include: { taxRate: true }
              }
            }
          }
        }
      }
    }
  });

  if (!restaurant) throw new Error('Restaurant not found!');

  const branch = restaurant.branches[0];
  const tables = branch.diningAreas.flatMap(d => d.tables);
  const items = restaurant.menus.flatMap(m => m.categories.flatMap(c => c.items));

  const getItem = (name) => {
    const found = items.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
    if (!found) throw new Error(`Item "${name}" not found!`);
    return found;
  };

  // 10 order compositions designed to hit EXACTLY ₹15,000.00 total across 10 orders (AOV = ₹1,500.00)
  const orderConfigs = [
    // 1. Lunch Rush 12:15 PM
    {
      timeIso: '2026-09-05T06:45:00.000Z', // 12:15 PM IST
      tableIdx: 0,
      source: OrderSource.QR,
      paymentMethod: PaymentMethod.UPI_INTENT,
      discount: 25.00, // Lunch special discount
      items: [
        { item: getItem('Chicken Biryani'), qty: 2 }, // 280*2 = 560 (tax 28)
        { item: getItem('Chicken Tikka'), qty: 2 },   // 260*2 = 520 (tax 26)
        { item: getItem('Dal Tadka'), qty: 1 },       // 170*1 = 170 (tax 8.5)
        { item: getItem('Tandoori Roti'), qty: 4 },   // 35*4 = 140 (tax 7)
        { item: getItem('Tomato Soup'), qty: 1 },     // 110*1 = 110 (tax 5.5)
      ], // Subtotal 1500, Tax 75, Disc 25 -> Total ₹1,550.00
    },
    // 2. Lunch Rush 12:45 PM
    {
      timeIso: '2026-09-05T07:15:00.000Z', // 12:45 PM IST
      tableIdx: 1,
      source: OrderSource.WAITER,
      paymentMethod: PaymentMethod.CARD,
      discount: 1.50, // Round-off
      items: [
        { item: getItem('Mutton Kosha'), qty: 2 },        // 360*2 = 720 (tax 36)
        { item: getItem('Paneer Butter Masala'), qty: 1 },// 240*1 = 240 (tax 12)
        { item: getItem('Jeera Rice'), qty: 2 },          // 120*2 = 240 (tax 12)
        { item: getItem('Tandoori Roti'), qty: 4 },       // 35*4 = 140 (tax 7)
        { item: getItem('Green Salad'), qty: 1 },         // 90*1 = 90 (tax 4.5)
      ], // Subtotal 1430, Tax 71.50, Disc 1.50 -> Total ₹1,500.00
    },
    // 3. Lunch Rush 1:15 PM
    {
      timeIso: '2026-09-05T07:45:00.000Z', // 1:15 PM IST
      tableIdx: 2,
      source: OrderSource.DIRECT,
      paymentMethod: PaymentMethod.CASH,
      discount: 0.00,
      items: [
        { item: getItem('Loaded Cheesy Chicken Quesadilla'), qty: 2 }, // 290*2 = 580 (tax 0)
        { item: getItem('Fish Finger'), qty: 2 },                      // 240*2 = 480 (tax 24)
        { item: getItem('Chicken Clear Soup'), qty: 1 },               // 150*1 = 150 (tax 7.5)
        { item: getItem('Veg Pakora'), qty: 2 },                       // 120*2 = 240 (tax 12)
      ], // Subtotal 1450, Tax 43.50, Disc 0 -> Total ₹1,493.50
    },
    // 4. Lunch Rush 1:45 PM
    {
      timeIso: '2026-09-05T08:15:00.000Z', // 1:45 PM IST
      tableIdx: 3,
      source: OrderSource.QR,
      paymentMethod: PaymentMethod.UPI_INTENT,
      discount: 0.00,
      items: [
        { item: getItem('Mutton Kosha'), qty: 2 },    // 360*2 = 720 (tax 36)
        { item: getItem('Chicken Biryani'), qty: 2 }, // 280*2 = 560 (tax 28)
        { item: getItem('Jeera Rice'), qty: 1 },      // 120*1 = 120 (tax 6)
        { item: getItem('Tomato Soup'), qty: 1 },     // 110*1 = 110 (tax 5.5)
      ], // Subtotal 1510, Tax 75.50, Disc 0 -> Total ₹1,585.50
    },
    // 5. Late Lunch 2:15 PM
    {
      timeIso: '2026-09-05T08:45:00.000Z', // 2:15 PM IST
      tableIdx: 4,
      source: OrderSource.WAITER,
      paymentMethod: PaymentMethod.RAZORPAY,
      discount: 0.00,
      items: [
        { item: getItem('Chicken Curry'), qty: 2 },        // 260*2 = 520 (tax 26)
        { item: getItem('Hara Bhara Kebab'), qty: 2 },     // 160*2 = 320 (tax 16)
        { item: getItem('Dal Tadka'), qty: 1 },            // 170*1 = 170 (tax 8.5)
        { item: getItem('Jeera Rice'), qty: 2 },           // 120*2 = 240 (tax 12)
        { item: getItem('Tandoori Roti'), qty: 2 },        // 35*2 = 70 (tax 3.5)
      ], // Subtotal 1320, Tax 66, Disc 0 -> Total ₹1,386.00
    },
    // 6. Dinner Opening 6:30 PM
    {
      timeIso: '2026-09-05T13:00:00.000Z', // 6:30 PM IST
      tableIdx: 5,
      source: OrderSource.QR,
      paymentMethod: PaymentMethod.UPI_INTENT,
      discount: 1.50,
      items: [
        { item: getItem('Chicken Biryani'), qty: 3 }, // 280*3 = 840 (tax 42)
        { item: getItem('Chicken Tikka'), qty: 1 },   // 260*1 = 260 (tax 13)
        { item: getItem('Fish Finger'), qty: 1 },     // 240*1 = 240 (tax 12)
        { item: getItem('Green Salad'), qty: 1 },     // 90*1 = 90 (tax 4.5)
      ], // Subtotal 1430, Tax 71.50, Disc 1.50 -> Total ₹1,500.00
    },
    // 7. Dinner Peak 7:15 PM
    {
      timeIso: '2026-09-05T13:45:00.000Z', // 7:15 PM IST
      tableIdx: 6,
      source: OrderSource.WAITER,
      paymentMethod: PaymentMethod.CARD,
      discount: 0.00,
      items: [
        { item: getItem('Paneer Butter Masala'), qty: 2 }, // 240*2 = 480 (tax 24)
        { item: getItem('Veg Biryani'), qty: 2 },          // 220*2 = 440 (tax 22)
        { item: getItem('Paneer Tikka'), qty: 1 },         // 220*1 = 220 (tax 11)
        { item: getItem('Jeera Rice'), qty: 2 },           // 120*2 = 240 (tax 12)
      ], // Subtotal 1380, Tax 69, Disc 0 -> Total ₹1,449.00
    },
    // 8. Dinner Peak 8:00 PM
    {
      timeIso: '2026-09-05T14:30:00.000Z', // 8:00 PM IST
      tableIdx: 0,
      source: OrderSource.QR,
      paymentMethod: PaymentMethod.UPI_INTENT,
      discount: 0.00,
      items: [
        { item: getItem('Mutton Kosha'), qty: 2 },   // 360*2 = 720 (tax 36)
        { item: getItem('Dry Chicken'), qty: 1 },     // 299*1 = 299 (tax 0)
        { item: getItem('Chicken Tikka'), qty: 1 },   // 260*1 = 260 (tax 13)
        { item: getItem('Fish Finger'), qty: 1 },     // 240*1 = 240 (tax 12)
      ], // Subtotal 1519, Tax 61, Disc 0 -> Total ₹1,580.00
    },
    // 9. Dinner 8:45 PM
    {
      timeIso: '2026-09-05T15:15:00.000Z', // 8:45 PM IST
      tableIdx: 1,
      source: OrderSource.DIRECT,
      paymentMethod: PaymentMethod.CASH,
      discount: 0.00,
      items: [
        { item: getItem('Fish Curry'), qty: 2 },          // 280*2 = 560 (tax 28)
        { item: getItem('Paneer Tikka'), qty: 1 },        // 220*1 = 220 (tax 11)
        { item: getItem('Dal Tadka'), qty: 1 },           // 170*1 = 170 (tax 8.5)
        { item: getItem('Jeera Rice'), qty: 2 },          // 120*2 = 240 (tax 12)
        { item: getItem('Hot & Sour Soup'), qty: 1 },     // 130*1 = 130 (tax 6.5)
      ], // Subtotal 1320, Tax 66, Disc 0 -> Total ₹1,386.00
    },
    // 10. Late Dinner 9:30 PM
    // Current subtotal before discount: 1539, tax: 47.50 -> 1586.50
    // We set discount = 18.00 so total = 1568.50 - 18.00 = wait, let's balance remaining sum to 15,000.00!
    {
      timeIso: '2026-09-05T16:00:00.000Z', // 9:30 PM IST
      tableIdx: 2,
      source: OrderSource.WAITER,
      paymentMethod: PaymentMethod.UPI_INTENT,
      discount: 18.00, // Promotional code
      items: [
        { item: getItem('Chicken Biryani'), qty: 2 },                 // 280*2 = 560 (tax 28)
        { item: getItem('Loaded Cheesy Chicken Quesadilla'), qty: 1 }, // 290*1 = 290 (tax 0)
        { item: getItem('Dry Chicken'), qty: 1 },                     // 299*1 = 299 (tax 0)
        { item: getItem('Chicken Tikka'), qty: 1 },                   // 260*1 = 260 (tax 13)
        { item: getItem('Hot & Sour Soup'), qty: 1 },                 // 130*1 = 130 (tax 6.5)
      ], // Subtotal 1539, Tax 47.50, Disc 18.00 -> Total will be calculated to ensure sum = 15,000.00
    },
  ];

  // Fine-tune Order 10 discount so total is EXACTLY 15,000.00
  let sumFirst9 = 0;
  for (let i = 0; i < 9; i++) {
    const c = orderConfigs[i];
    let sub = 0;
    let tax = 0;
    c.items.forEach(({ item, qty }) => {
      const line = Number(item.price) * qty;
      const t = item.taxRate ? (line * Number(item.taxRate.value)) / 100 : 0;
      sub += line;
      tax += t;
    });
    sumFirst9 += (sub + tax - c.discount);
  }

  const targetForOrder10 = 15000.00 - sumFirst9;
  let o10Sub = 0;
  let o10Tax = 0;
  orderConfigs[9].items.forEach(({ item, qty }) => {
    const line = Number(item.price) * qty;
    const t = item.taxRate ? (line * Number(item.taxRate.value)) / 100 : 0;
    o10Sub += line;
    o10Tax += t;
  });
  orderConfigs[9].discount = (o10Sub + o10Tax) - targetForOrder10;

  console.log(`Calculated exact target for Order 10: ₹${targetForOrder10.toFixed(2)} (Discount adjusted to ₹${orderConfigs[9].discount.toFixed(2)})`);

  // Get current order count sequence
  const orderCount = await prisma.order.count({
    where: { restaurantId: restaurant.id },
  });

  let nextSeq = orderCount + 1;
  const createdOrders = [];
  const metricsAggregation = {};

  for (let i = 0; i < orderConfigs.length; i++) {
    const conf = orderConfigs[i];
    const table = tables[conf.tableIdx % tables.length];
    const orderDate = new Date(conf.timeIso);

    // Compute lines
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
      if (!metricsAggregation[item.id]) {
        metricsAggregation[item.id] = { qty: 0, revenue: new Prisma.Decimal(0) };
      }
      metricsAggregation[item.id].qty += qty;
      metricsAggregation[item.id].revenue = metricsAggregation[item.id].revenue.add(lineTotal);
    }

    const discountAmount = new Prisma.Decimal(conf.discount.toFixed(2));
    const totalAmount = subtotalAcc.add(taxAcc).sub(discountAmount);

    // Determine unique orderNumber
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
    const payment = await prisma.payment.create({
      data: {
        tenantId: restaurant.tenantId,
        restaurantId: restaurant.id,
        orderId: order.id,
        customerSessionId: session.id,
        amount: totalAmount,
        method: conf.paymentMethod,
        status: PaymentStatus.SUCCESS,
        transactionReference: `PAY-${orderNumber}-${Date.now().toString().slice(-6)}`,
        paidAt: new Date(orderDate.getTime() + 35 * 60 * 1000),
        createdAt: new Date(orderDate.getTime() + 35 * 60 * 1000),
        updatedAt: new Date(orderDate.getTime() + 35 * 60 * 1000),
      },
    });

    // Create Invoice
    const invoiceNumber = `INV-20260905-${String(i + 1).padStart(4, '0')}`;
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

    createdOrders.push(order);
    console.log(`[✓] Created Order #${i + 1}: ${order.orderNumber} | Table: ${table.name} | Source: ${conf.source.padEnd(6)} | ₹${Number(totalAmount).toFixed(2)} | Method: ${conf.paymentMethod}`);
  }

  // Update DailySalesAggregate for 2026-09-05
  const todayDate = new Date('2026-09-05T00:00:00.000Z');
  const sumGross = createdOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
  const sumNet = createdOrders.reduce((acc, o) => acc + Number(o.subtotal), 0);
  const sumTax = createdOrders.reduce((acc, o) => acc + Number(o.taxAmount), 0);
  const sumDisc = createdOrders.reduce((acc, o) => acc + Number(o.discountAmount), 0);
  const calculatedAOV = sumGross / createdOrders.length;

  await prisma.dailySalesAggregate.upsert({
    where: {
      restaurantId_branchId_date: {
        restaurantId: restaurant.id,
        branchId: branch.id,
        date: todayDate,
      },
    },
    update: {
      grossSales: new Prisma.Decimal(sumGross),
      netSales: new Prisma.Decimal(sumNet),
      taxAmount: new Prisma.Decimal(sumTax),
      discountAmount: new Prisma.Decimal(sumDisc),
      totalOrders: createdOrders.length,
      completedOrders: createdOrders.length,
      averageOrderValue: new Prisma.Decimal(calculatedAOV),
      dineInOrders: createdOrders.length,
      takeoutOrders: 0,
    },
    create: {
      tenantId: restaurant.tenantId,
      restaurantId: restaurant.id,
      branchId: branch.id,
      date: todayDate,
      grossSales: new Prisma.Decimal(sumGross),
      netSales: new Prisma.Decimal(sumNet),
      taxAmount: new Prisma.Decimal(sumTax),
      discountAmount: new Prisma.Decimal(sumDisc),
      totalOrders: createdOrders.length,
      completedOrders: createdOrders.length,
      averageOrderValue: new Prisma.Decimal(calculatedAOV),
      dineInOrders: createdOrders.length,
      takeoutOrders: 0,
      uniqueCustomers: 10,
    },
  });

  // Update MenuItemDailyMetrics for 2026-09-05
  for (const [menuItemId, data] of Object.entries(metricsAggregation)) {
    await prisma.menuItemDailyMetrics.upsert({
      where: {
        restaurantId_branchId_menuItemId_date: {
          restaurantId: restaurant.id,
          branchId: branch.id,
          menuItemId,
          date: todayDate,
        },
      },
      update: {
        quantitySold: data.qty,
        grossRevenue: data.revenue,
        ordersCount: createdOrders.filter(o => o.items.some(it => it.menuItemId === menuItemId)).length,
      },
      create: {
        tenantId: restaurant.tenantId,
        restaurantId: restaurant.id,
        branchId: branch.id,
        menuItemId,
        date: todayDate,
        quantitySold: data.qty,
        grossRevenue: data.revenue,
        ordersCount: createdOrders.filter(o => o.items.some(it => it.menuItemId === menuItemId)).length,
      },
    });
  }

  console.log('\n========================================================================');
  console.log('              SUMMARY OF 10 ORDERS CREATED FOR TODAY                    ');
  console.log('========================================================================');
  console.log(`Restaurant            : ${restaurant.name} (${restaurant.id})`);
  console.log(`Date                  : 2026-09-05 (Today)`);
  console.log(`Total Orders Created  : ${createdOrders.length}`);
  console.log(`Total Revenue (Gross) : ₹${sumGross.toFixed(2)}`);
  console.log(`Net Subtotal          : ₹${sumNet.toFixed(2)}`);
  console.log(`Total Tax (GST 5%)    : ₹${sumTax.toFixed(2)}`);
  console.log(`Total Discounts       : ₹${sumDisc.toFixed(2)}`);
  console.log(`Average Order Value   : ₹${calculatedAOV.toFixed(2)} (Target: ₹1,500.00)`);
  console.log('========================================================================\n');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
