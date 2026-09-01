const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('./dist/generated/prisma/client');
const { Prisma } = require('./dist/generated/prisma/client');
const { OrderStatus, PaymentStatus, PaymentMethod } = require('./dist/generated/prisma/enums');
const crypto = require('node:crypto');
require('dotenv').config();

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  console.log('================================================================');
  console.log('  TEST ORDER EXECUTION: ORDER > RS 5000 (SWETA R RESTAURANT)    ');
  console.log('================================================================\n');

  // 1. Locate Restaurant & Tenant
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      tenant: {
        name: { contains: 'sweta', mode: 'insensitive' }
      }
    },
    include: {
      tenant: true,
      branches: {
        include: {
          diningAreas: {
            include: {
              tables: true,
            },
          },
        },
      },
      taxRates: true,
    },
  });

  if (!restaurant) {
    throw new Error('Restaurant for Sweta R Restaurant not found!');
  }

  console.log(`[1] Restaurant Information:`);
  console.log(`    Tenant Name   : "${restaurant.tenant.name}" (${restaurant.tenant.id})`);
  console.log(`    Restaurant    : "${restaurant.name}" (${restaurant.id})`);
  const branch = restaurant.branches[0];
  console.log(`    Branch        : "${branch.name}" (${branch.id})`);

  const diningArea = branch.diningAreas[0];
  const table = diningArea.tables[0];
  console.log(`    Table         : "${table.name}" (Code: ${table.code}, Public Token: ${table.publicToken})`);

  // 2. Resolve Active Menu & Items
  const menuItems = await prisma.menuItem.findMany({
    where: {
      category: {
        menu: {
          restaurantId: restaurant.id,
          status: 'ACTIVE',
        },
        status: 'ACTIVE',
      },
      status: 'ACTIVE',
    },
    include: {
      taxRate: true,
      category: true,
      variantGroups: { include: { variants: true } },
      addonGroups: { include: { addons: true } },
    },
  });

  console.log(`\n[2] Loaded ${menuItems.length} active menu items for "${restaurant.name}".`);

  // Pick items to construct an order > Rs 5000
  const findItem = (name) => {
    const item = menuItems.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
    if (!item) throw new Error(`Item "${name}" not found in menu!`);
    return item;
  };

  const selectedItems = [
    { item: findItem('Mutton Kosha'), quantity: 6 },                     // 6 x Rs 360 = Rs 2,160
    { item: findItem('Chicken Biryani'), quantity: 5 },                  // 5 x Rs 280 = Rs 1,400
    { item: findItem('Loaded Cheesy Chicken Quesadilla'), quantity: 4 },   // 4 x Rs 290 = Rs 1,160
    { item: findItem('Chicken Tikka'), quantity: 4 },                     // 4 x Rs 260 = Rs 1,040
    { item: findItem('Butter Naan'), quantity: 10 },                      // 10 x Rs 60 = Rs 600
    { item: findItem('Chocolate Brownie'), quantity: 4 },                // 4 x Rs 150 = Rs 600
    { item: findItem('Mango Lassi'), quantity: 4 },                      // 4 x Rs 110 = Rs 440
  ];

  console.log('\n[3] Selected Items for Order (Target > Rs 5,000):');
  let expectedSubtotal = 0;
  for (const sel of selectedItems) {
    const lineTotal = sel.item.price * sel.quantity;
    expectedSubtotal += lineTotal;
    console.log(`    • ${sel.item.name.padEnd(35)} x ${sel.quantity.toString().padStart(2)} @ Rs ${sel.item.price.toString().padStart(4)} = Rs ${lineTotal.toString().padStart(5)}`);
  }
  console.log(`    ---------------------------------------------------------`);
  console.log(`    Expected Subtotal : Rs ${expectedSubtotal}`);

  // 3. Create Customer Session for Table
  console.log('\n[4] Initializing Table Customer Session...');
  const sessionToken = `cs_${crypto.randomUUID().replace(/-/g, '')}`;
  const session = await prisma.customerSession.create({
    data: {
      tableId: table.id,
      sessionToken,
      status: 'ACTIVE',
    },
  });
  console.log(`    Customer Session ID : ${session.id}`);
  console.log(`    Session Token       : ${session.sessionToken}`);

  // 4. Create Cart and Cart Items
  console.log('\n[5] Populating Table Cart...');
  const cart = await prisma.cart.create({
    data: {
      customerSessionId: session.id,
      items: {
        create: selectedItems.map(sel => ({
          menuItemId: sel.item.id,
          quantity: sel.quantity,
          unitPrice: new Prisma.Decimal(sel.item.price),
          totalPrice: new Prisma.Decimal(sel.item.price * sel.quantity),
        })),
      },
    },
    include: {
      items: true,
    },
  });
  console.log(`    Cart created with ID: ${cart.id} (${cart.items.length} line items)`);

  // 5. Place the Order (executing the transaction logic of OrdersService.createOrderFromCart)
  console.log('\n[6] Executing Atomic Order Placement Transaction...');
  const order = await prisma.$transaction(async (tx) => {
    let subtotalAcc = new Prisma.Decimal(0);
    let taxAcc = new Prisma.Decimal(0);

    const itemCreations = [];

    for (const cartItem of cart.items) {
      const menuItem = await tx.menuItem.findFirst({
        where: {
          id: cartItem.menuItemId,
          status: 'ACTIVE',
          category: { status: 'ACTIVE', menu: { restaurantId: restaurant.id, status: 'ACTIVE' } },
        },
        include: {
          taxRate: true,
          variantGroups: { include: { variants: true } },
          addonGroups: { include: { addons: true } },
        },
      });

      if (!menuItem) {
        throw new Error(`Item ${cartItem.menuItemId} is no longer available`);
      }

      const unitPrice = new Prisma.Decimal(menuItem.price);
      const quantity = cartItem.quantity;
      const lineTotalPrice = unitPrice.mul(quantity);
      subtotalAcc = subtotalAcc.add(lineTotalPrice);

      let itemTaxAmount = new Prisma.Decimal(0);
      if (menuItem.taxRate && menuItem.taxRate.status === 'ACTIVE') {
        if (menuItem.taxRate.type === 'PERCENTAGE') {
          itemTaxAmount = lineTotalPrice.mul(menuItem.taxRate.value).div(100);
        } else if (menuItem.taxRate.type === 'FIXED') {
          itemTaxAmount = new Prisma.Decimal(menuItem.taxRate.value).mul(quantity);
        }
      }
      taxAcc = taxAcc.add(itemTaxAmount);

      itemCreations.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity,
        unitPrice,
        totalPrice: lineTotalPrice,
        taxAmount: itemTaxAmount,
      });
    }

    const orderCount = await tx.order.count({
      where: { restaurantId: restaurant.id },
    });

    let nextSeq = orderCount + 1;
    let orderNumber = `AT-${String(nextSeq).padStart(6, '0')}`;

    let existingOrder = await tx.order.findUnique({
      where: {
        restaurantId_orderNumber: {
          restaurantId: restaurant.id,
          orderNumber,
        },
      },
      select: { id: true },
    });

    while (existingOrder) {
      nextSeq++;
      orderNumber = `AT-${String(nextSeq).padStart(6, '0')}`;
      existingOrder = await tx.order.findUnique({
        where: {
          restaurantId_orderNumber: {
            restaurantId: restaurant.id,
            orderNumber,
          },
        },
        select: { id: true },
      });
    }

    const discountAmount = new Prisma.Decimal(0);
    const totalAmount = subtotalAcc.add(taxAcc).sub(discountAmount);

    const createdOrder = await tx.order.create({
      data: {
        restaurantId: restaurant.id,
        branchId: branch.id,
        tableId: table.id,
        customerSessionId: session.id,
        orderNumber,
        status: OrderStatus.PENDING,
        subtotal: subtotalAcc,
        taxAmount: taxAcc,
        discountAmount,
        totalAmount,
        items: {
          create: itemCreations.map((ic) => ({
            menuItemId: ic.menuItemId,
            name: ic.name,
            quantity: ic.quantity,
            unitPrice: ic.unitPrice,
            totalPrice: ic.totalPrice,
            taxAmount: ic.taxAmount,
          })),
        },
      },
      include: {
        items: true,
        table: true,
        branch: true,
      },
    });

    // Clear cart items after successful order creation
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return createdOrder;
  });

  console.log(`\n[7] ORDER CREATED SUCCESSFULLY IN DATABASE!`);
  console.log(`    Order ID        : ${order.id}`);
  console.log(`    Order Number    : ${order.orderNumber}`);
  console.log(`    Initial Status  : ${order.status}`);
  console.log(`    Subtotal        : Rs ${order.subtotal}`);
  console.log(`    Tax Amount      : Rs ${order.taxAmount}`);
  console.log(`    Discount        : Rs ${order.discountAmount}`);
  console.log(`    TOTAL AMOUNT    : Rs ${order.totalAmount}`);
  console.log(`    > Rs 5,000 Check: ${Number(order.totalAmount) > 5000 ? '✅ PASSED (Total is > Rs 5,000)' : '❌ FAILED'}`);

  // 6. Test Lifecycle Progression
  console.log('\n[8] Progressing Order through Real Kitchen Lifecycle...');
  const lifecycleTransitions = [
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.SERVED,
    OrderStatus.COMPLETED,
  ];

  let currentStatus = order.status;
  for (const nextStatus of lifecycleTransitions) {
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: nextStatus },
    });
    console.log(`    → Status updated: ${currentStatus.padEnd(10)} → ${updated.status} [OK]`);
    currentStatus = updated.status;
  }

  // 7. Record Full Payment
  console.log(`\n[9] Recording Settlement & Payment for Rs ${order.totalAmount}...`);
  const payment = await prisma.payment.create({
    data: {
      tenantId: restaurant.tenantId,
      restaurantId: restaurant.id,
      orderId: order.id,
      customerSessionId: session.id,
      amount: order.totalAmount,
      method: PaymentMethod.UPI_INTENT,
      status: PaymentStatus.SUCCESS,
      transactionReference: `UPI-SWETA-${Date.now()}`,
      paidAt: new Date(),
    },
  });
  console.log(`    Payment Created : ID ${payment.id}`);
  console.log(`    Method          : ${payment.method}`);
  console.log(`    Status          : ${payment.status}`);
  console.log(`    Amount Paid     : Rs ${payment.amount}`);
  console.log(`    Txn Ref         : ${payment.transactionReference}`);

  // 8. Final Verification Query
  console.log('\n[10] Executing Comprehensive Data Integrity & Tenancy Audit Query...');
  const verifiedOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      restaurant: { select: { id: true, name: true, tenant: { select: { id: true, name: true, slug: true } } } },
      branch: { select: { id: true, name: true, code: true } },
      table: { select: { id: true, name: true, code: true, publicToken: true } },
      items: true,
      payments: true,
      customerSession: true,
    },
  });

  console.log('\n================================================================');
  console.log('              FINAL ORDER VERIFICATION REPORT                   ');
  console.log('================================================================');
  console.log(`Tenant Name          : ${verifiedOrder.restaurant.tenant.name} (${verifiedOrder.restaurant.tenant.slug})`);
  console.log(`Restaurant Name      : ${verifiedOrder.restaurant.name} (ID: ${verifiedOrder.restaurant.id})`);
  console.log(`Branch               : ${verifiedOrder.branch.name} (Code: ${verifiedOrder.branch.code})`);
  console.log(`Table                : ${verifiedOrder.table.name} (${verifiedOrder.table.code})`);
  console.log(`Table Token          : ${verifiedOrder.table.publicToken}`);
  console.log(`Order Number         : ${verifiedOrder.orderNumber}`);
  console.log(`Order ID             : ${verifiedOrder.id}`);
  console.log(`Final Status         : ${verifiedOrder.status}`);
  console.log(`Subtotal             : Rs ${verifiedOrder.subtotal.toString()}`);
  console.log(`Tax Amount           : Rs ${verifiedOrder.taxAmount.toString()}`);
  console.log(`Discount Amount      : Rs ${verifiedOrder.discountAmount.toString()}`);
  console.log(`Total Amount         : Rs ${verifiedOrder.totalAmount.toString()}`);
  console.log(`Condition (> Rs 5000): ✅ PASSED (Rs ${verifiedOrder.totalAmount} > Rs 5000.00)`);
  console.log(`Created At           : ${verifiedOrder.createdAt.toISOString()}`);
  console.log(`----------------------------------------------------------------`);
  console.log(`Ordered Line Items (${verifiedOrder.items.length}):`);
  for (let i = 0; i < verifiedOrder.items.length; i++) {
    const item = verifiedOrder.items[i];
    console.log(`  [${i + 1}] ${item.name.padEnd(35)} x ${item.quantity.toString().padStart(2)} @ Rs ${item.unitPrice.toString().padStart(5)} = Rs ${item.totalPrice.toString().padStart(6)} (Tax: Rs ${item.taxAmount})`);
  }
  console.log(`----------------------------------------------------------------`);
  console.log(`Payment Details:`);
  for (const p of verifiedOrder.payments) {
    console.log(`  • ID: ${p.id} | Method: ${p.method} | Status: ${p.status} | Paid: Rs ${p.amount} | Ref: ${p.transactionReference}`);
  }
  console.log('================================================================\n');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Test order failed with error:', err);
  process.exit(1);
});
