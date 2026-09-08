const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient, Prisma } = require('./dist/generated/prisma/client');
const { OrderStatus } = require('./dist/generated/prisma/enums');
const crypto = require('node:crypto');
require('dotenv').config();

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  console.log('================================================================');
  console.log('   ORDER PLACEMENT: 10 TABLES IN SWETA R RESTAURANT (AOV: 1500) ');
  console.log('================================================================\n');

  // 1. Locate Restaurant, Tenant, Branch & Dining Area
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { name: { contains: 'sweta', mode: 'insensitive' } },
        { tenant: { name: { contains: 'sweta', mode: 'insensitive' } } }
      ]
    },
    include: {
      tenant: true,
      branches: {
        include: {
          diningAreas: {
            include: {
              tables: {
                orderBy: { name: 'asc' }
              }
            }
          }
        }
      }
    }
  });

  if (!restaurant) {
    throw new Error('Restaurant "Sweta R Restaurant" not found!');
  }

  const branch = restaurant.branches[0];
  const diningArea = branch.diningAreas[0];

  console.log(`[1] Restaurant Information:`);
  console.log(`    Tenant Name   : "${restaurant.tenant.name}" (${restaurant.tenant.id})`);
  console.log(`    Restaurant    : "${restaurant.name}" (${restaurant.id})`);
  console.log(`    Branch        : "${branch.name}" (${branch.id})`);
  console.log(`    Dining Area   : "${diningArea.name}" (${diningArea.id})\n`);

  // 2. Ensure 10 tables exist in the dining area
  let existingTables = await prisma.table.findMany({
    where: { diningAreaId: diningArea.id },
    orderBy: { name: 'asc' }
  });

  console.log(`[2] Existing tables count in Dining Area: ${existingTables.length}`);

  while (existingTables.length < 10) {
    const nextNum = existingTables.length + 1;
    const padNum = String(nextNum).padStart(2, '0');
    const newTable = await prisma.table.create({
      data: {
        diningAreaId: diningArea.id,
        name: `Table ${nextNum}`,
        code: `T${padNum}`,
        capacity: 4,
        status: 'ACTIVE',
        publicToken: `tbl_${crypto.randomUUID().replace(/-/g, '')}`,
      }
    });
    console.log(`    + Created new table: "${newTable.name}" (Code: ${newTable.code}, ID: ${newTable.id})`);
    existingTables.push(newTable);
  }

  const targetTables = existingTables.slice(0, 10);
  console.log(`\n    Selected 10 target tables for orders:`);
  targetTables.forEach((t, i) => {
    console.log(`      ${i + 1}. ${t.name.padEnd(10)} | Code: ${t.code.padEnd(5)} | ID: ${t.id}`);
  });

  // 3. Load Active Menu Items
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
    }
  });

  console.log(`\n[3] Loaded ${menuItems.length} active menu items for "${restaurant.name}".`);

  const getItem = (name) => {
    const item = menuItems.find(i => i.name.toLowerCase().trim() === name.toLowerCase().trim() || i.name.toLowerCase().includes(name.toLowerCase()));
    if (!item) throw new Error(`Menu item "${name}" not found!`);
    return item;
  };

  // 4. Define 10 distinct, delicious meal baskets totaling exactly Rs 15,000 (AOV = 1500)
  const baskets = [
    {
      tableName: 'Table 1',
      items: [
        { item: getItem('Mutton Kosha'), qty: 2 },        // 2 x 360 = 720
        { item: getItem('Butter Naan'), qty: 4 },         // 4 x 60  = 240
        { item: getItem('Chicken Biryani'), qty: 1 },     // 1 x 280 = 280
        { item: getItem('Mango Lassi'), qty: 1 },         // 1 x 110 = 110
        { item: getItem('Chocolate Brownie'), qty: 1 },   // 1 x 150 = 150
      ], // Subtotal: 1,500
    },
    {
      tableName: 'Table 2',
      items: [
        { item: getItem('Chicken Tikka'), qty: 2 },                      // 2 x 260 = 520
        { item: getItem('Loaded Cheesy Chicken Quesadilla'), qty: 1 },   // 1 x 290 = 290
        { item: getItem('Chicken Fried Rice'), qty: 2 },                 // 2 x 220 = 440
        { item: getItem('Hot & Sour Soup'), qty: 1 },                    // 1 x 130 = 130
        { item: getItem('Filter Coffee'), qty: 1 },                      // 1 x 70  = 70
        { item: getItem('Mineral Water'), qty: 1 },                      // 1 x 30  = 30
      ], // Subtotal: 1,480
    },
    {
      tableName: 'Table 3',
      items: [
        { item: getItem('Paneer Butter Masala'), qty: 2 }, // 2 x 240 = 480
        { item: getItem('Dal Tadka'), qty: 1 },            // 1 x 170 = 170
        { item: getItem('Jeera Rice'), qty: 2 },           // 2 x 120 = 240
        { item: getItem('Butter Naan'), qty: 5 },          // 5 x 60  = 300
        { item: getItem('Paneer Tikka'), qty: 1 },         // 1 x 220 = 220
        { item: getItem('Mango Lassi'), qty: 1 },          // 1 x 110 = 110
      ], // Subtotal: 1,520
    },
    {
      tableName: 'Table 4',
      items: [
        { item: getItem('Fish Finger'), qty: 2 },         // 2 x 240 = 480
        { item: getItem('Fish Curry'), qty: 2 },          // 2 x 280 = 560
        { item: getItem('Jeera Rice'), qty: 2 },          // 2 x 120 = 240
        { item: getItem('Chocolate Brownie'), qty: 1 },   // 1 x 150 = 150
        { item: getItem('Fresh Lime Soda'), qty: 1 },     // 1 x 80  = 80
      ], // Subtotal: 1,510
    },
    {
      tableName: 'Table 5',
      items: [
        { item: getItem('Chilli Chicken'), qty: 2 },      // 2 x 260 = 520
        { item: getItem('Veg Fried Rice'), qty: 2 },      // 2 x 180 = 360
        { item: getItem('White Sauce Pasta'), qty: 1 },   // 1 x 240 = 240
        { item: getItem('Hara Bhara Kebab'), qty: 1 },    // 1 x 160 = 160
        { item: getItem('Chocolate Brownie'), qty: 1 },   // 1 x 150 = 150
        { item: getItem('Mineral Water'), qty: 2 },       // 2 x 30  = 60
      ], // Subtotal: 1,490
    },
    {
      tableName: 'Table 6',
      items: [
        { item: getItem('Chicken Biryani'), qty: 3 },     // 3 x 280 = 840
        { item: getItem('Chicken Tikka'), qty: 1 },       // 1 x 260 = 260
        { item: getItem('Rasmalai'), qty: 2 },            // 2 x 120 = 240
        { item: getItem('Mango Lassi'), qty: 1 },         // 1 x 110 = 110
        { item: getItem('Ice Cream'), qty: 1 },           // 1 x 100 = 100
      ], // Subtotal: 1,550
    },
    {
      tableName: 'Table 7',
      items: [
        { item: getItem('Mutton Kosha'), qty: 1 },        // 1 x 360 = 360
        { item: getItem('Chicken Curry'), qty: 2 },       // 2 x 260 = 520
        { item: getItem('Butter Naan'), qty: 4 },         // 4 x 60  = 240
        { item: getItem('Jeera Rice'), qty: 1 },          // 1 x 120 = 120
        { item: getItem('Gulab Jamun'), qty: 2 },         // 2 x 90  = 180
        { item: getItem('Mineral Water'), qty: 1 },       // 1 x 30  = 30
      ], // Subtotal: 1,450
    },
    {
      tableName: 'Table 8',
      items: [
        { item: getItem('Loaded Cheesy Chicken Quesadilla'), qty: 2 }, // 2 x 290 = 580
        { item: getItem('White Sauce Pasta'), qty: 2 },                // 2 x 240 = 480
        { item: getItem('Hot & Sour Soup'), qty: 2 },                 // 2 x 130 = 260
        { item: getItem('Chocolate Brownie'), qty: 1 },                // 1 x 150 = 150
        { item: getItem('Butter Naan'), qty: 1 },                      // 1 x 60  = 60
      ], // Subtotal: 1,530
    },
    {
      tableName: 'Table 9',
      items: [
        { item: getItem('Veg Biryani'), qty: 2 },          // 2 x 220 = 440
        { item: getItem('Paneer Butter Masala'), qty: 2 }, // 2 x 240 = 480
        { item: getItem('Butter Naan'), qty: 4 },          // 4 x 60  = 240
        { item: getItem('Veg Pakora'), qty: 1 },           // 1 x 120 = 120
        { item: getItem('Rasmalai'), qty: 1 },             // 1 x 120 = 120
        { item: getItem('Filter Coffee'), qty: 1 },        // 1 x 70  = 70
      ], // Subtotal: 1,470
    },
    {
      tableName: 'Table 10',
      items: [
        { item: getItem('Chicken Tikka'), qty: 2 },        // 2 x 260 = 520
        { item: getItem('Chilli Paneer'), qty: 1 },        // 1 x 220 = 220
        { item: getItem('Chicken Fried Rice'), qty: 2 },   // 2 x 220 = 440
        { item: getItem('Tomato Soup'), qty: 2 },          // 2 x 110 = 220
        { item: getItem('Ice Cream'), qty: 1 },            // 1 x 100 = 100
      ], // Subtotal: 1,500
    },
  ];

  console.log('\n[4] Placing Orders for 10 Tables...');
  const placedOrders = [];

  for (let idx = 0; idx < 10; idx++) {
    const table = targetTables[idx];
    const basket = baskets[idx];

    // Create session
    const sessionToken = `cs_${crypto.randomUUID().replace(/-/g, '')}`;
    const session = await prisma.customerSession.create({
      data: {
        tableId: table.id,
        sessionToken,
        status: 'ACTIVE',
      }
    });

    // Create cart
    const cart = await prisma.cart.create({
      data: {
        customerSessionId: session.id,
        items: {
          create: basket.items.map(bi => ({
            menuItemId: bi.item.id,
            quantity: bi.qty,
            unitPrice: new Prisma.Decimal(bi.item.price),
            totalPrice: new Prisma.Decimal(bi.item.price * bi.qty),
          }))
        }
      },
      include: { items: true }
    });

    // Execute Order creation in transaction
    const order = await prisma.$transaction(async (tx) => {
      let subtotalAcc = new Prisma.Decimal(0);
      let taxAcc = new Prisma.Decimal(0);
      const itemCreations = [];

      for (const cartItem of cart.items) {
        const menuItem = await tx.menuItem.findFirst({
          where: { id: cartItem.menuItemId },
          include: { taxRate: true }
        });

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
        where: { restaurantId: restaurant.id }
      });

      let nextSeq = orderCount + 1;
      let orderNumber = `AT-${String(nextSeq).padStart(6, '0')}`;

      let existingOrder = await tx.order.findUnique({
        where: {
          restaurantId_orderNumber: {
            restaurantId: restaurant.id,
            orderNumber,
          }
        },
        select: { id: true }
      });

      while (existingOrder) {
        nextSeq++;
        orderNumber = `AT-${String(nextSeq).padStart(6, '0')}`;
        existingOrder = await tx.order.findUnique({
          where: {
            restaurantId_orderNumber: {
              restaurantId: restaurant.id,
              orderNumber,
            }
          },
          select: { id: true }
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
            }))
          }
        },
        include: {
          items: true,
          table: true,
        }
      });

      // Update table status to occupied / active
      await tx.table.update({
        where: { id: table.id },
        data: { status: 'ACTIVE' }
      });

      return createdOrder;
    });

    placedOrders.push({
      table: table.name,
      code: table.code,
      orderNumber: order.orderNumber,
      orderId: order.id,
      items: basket.items.map(bi => `${bi.item.name} (x${bi.qty}) @ Rs ${bi.item.price}`).join(', '),
      subtotal: Number(order.subtotal),
      tax: Number(order.taxAmount),
      total: Number(order.totalAmount),
    });

    console.log(`    ✅ Order #${idx + 1} Placed | ${table.name.padEnd(8)} (Code: ${table.code}) | Order: ${order.orderNumber} | Total: Rs ${order.totalAmount}`);
  }

  // 5. Verification & Summary Output
  console.log('\n================================================================');
  console.log('                 10 ORDERS PLACED SUMMARY TABLE                 ');
  console.log('================================================================');
  console.log(' Table    | Code | Order No.  | Items Summary                       | Subtotal | Total');
  console.log('--------------------------------------------------------------------------------------');
  
  let grandSubtotal = 0;
  let grandTotal = 0;

  for (const o of placedOrders) {
    grandSubtotal += o.subtotal;
    grandTotal += o.total;
    console.log(` ${o.table.padEnd(8)} | ${o.code.padEnd(4)} | ${o.orderNumber.padEnd(10)} | ${o.items.padEnd(35).substring(0, 35)} | Rs ${o.subtotal.toString().padStart(6)} | Rs ${o.total.toString().padStart(6)}`);
  }

  const calculatedAov = grandTotal / placedOrders.length;

  console.log('--------------------------------------------------------------------------------------');
  console.log(` Total Orders Placed   : ${placedOrders.length}`);
  console.log(` Grand Subtotal Sum    : Rs ${grandSubtotal.toFixed(2)}`);
  console.log(` Grand Total Sum       : Rs ${grandTotal.toFixed(2)}`);
  console.log(` Exact AOV (Average)   : Rs ${calculatedAov.toFixed(2)}`);
  console.log('================================================================\n');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
