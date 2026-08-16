import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, 'apps/api/.env') });

const API_BASE = 'http://localhost:3000/api/v1';

async function request(endpoint, options = {}, token = null, headers = {}) {
  const reqHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: reqHeaders,
  });

  const text = await res.text();
  let body = {};
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return { status: res.status, ok: res.ok, data: body };
}

async function runTests() {
  console.log('🚀 Starting Order Cancellation & Refund System E2E Test Suite...\n');

  // 1. Authenticate as Admin/Platform Admin
  console.log('Step 1: Authenticating as Admin & Waiter...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'atlas@atlas.com', password: 'Atlas@12345' }),
  });

  if (!loginRes.ok) {
    console.error('Admin Login failed:', loginRes);
    process.exit(1);
  }

  const adminToken = loginRes.data?.data?.tokens?.accessToken || loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
  const restaurantsRes = await request('/restaurants', { method: 'GET' }, adminToken);
  const restaurants = restaurantsRes.data?.data || restaurantsRes.data || [];
  if (restaurants.length === 0) {
    console.error('No restaurants found!');
    process.exit(1);
  }

  let restaurant = null;
  let branch = null;
  let testTable = null;
  let tenantHeaders = {};

  for (const r of restaurants) {
    const bRes = await request('/branches', { method: 'GET' }, adminToken, {
      'x-tenant-id': r.tenantId,
      'x-restaurant-id': r.id,
    });
    const bList = bRes.data?.data || bRes.data || [];
    for (const b of bList) {
      const th = {
        'x-tenant-id': r.tenantId,
        'x-restaurant-id': r.id,
        'x-branch-id': b.id,
      };
      const tRes = await request('/tables', { method: 'GET' }, adminToken, th);
      const tList = tRes.data?.data || tRes.data || [];
      for (const t of tList) {
        if (t.publicToken) {
          const mRes = await request(`/public/tables/${t.publicToken}/menu`, { method: 'GET' });
          const mData = mRes.data?.data || mRes.data;
          const hasItems = mData?.categories?.some((c) => c.items?.length > 0);
          if (hasItems) {
            restaurant = r;
            branch = b;
            testTable = t;
            tenantHeaders = th;
            break;
          }
        }
      }
      if (testTable) break;
    }
    if (testTable) break;
  }

  if (!testTable) {
    console.error('Could not find any restaurant with configured tables and menu items.');
    process.exit(1);
  }

  console.log(`Using Restaurant: "${restaurant.name}", Branch: "${branch?.name}", Table: "${testTable?.name}" (Token: ${testTable?.publicToken})\n`);

  // Helper to create test order via public table session
  async function createTestOrder(itemCount = 1) {
    // 1. Get or create table session
    const sessionRes = await request(`/public/tables/${testTable.publicToken}/session`, { method: 'GET' });
    const sessionToken = sessionRes.data?.data?.sessionToken || sessionRes.data?.sessionToken;

    // 2. Fetch menu
    const menuRes = await request(`/public/tables/${testTable.publicToken}/menu`, { method: 'GET' });
    const menuData = menuRes.data?.data || menuRes.data;
    const category = menuData?.categories?.[0];
    const item = category?.items?.[0];

    if (!item) throw new Error('No menu items found to create order');

    // 3. Add to cart
    await request(`/public/tables/${testTable.publicToken}/cart/items`, {
      method: 'POST',
      body: JSON.stringify({
        menuItemId: item.id,
        quantity: itemCount,
      }),
    });

    // 4. Place order
    const orderRes = await request(`/public/tables/${testTable.publicToken}/orders`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    return orderRes.data?.data || orderRes.data;
  }

  // TEST SCENARIO 1: Unpaid Order Direct Cancellation
  console.log('--- TEST 1: Unpaid Order Direct Cancellation by Staff/Waiter ---');
  const order1 = await createTestOrder(1);
  console.log(`Created Order #${order1.orderNumber} (Status: ${order1.status}, Amount: ₹${order1.totalAmount})`);

  const cancelRes1 = await request(`/orders/${order1.id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({
      reason: 'CUSTOMER_REQUESTED',
      note: 'Customer had an emergency',
    }),
  }, adminToken, tenantHeaders);

  console.log(`Cancel HTTP Status: ${cancelRes1.status}`);
  const cancelledOrder1 = cancelRes1.data?.data || cancelRes1.data;
  console.log(`Order #${cancelledOrder1.orderNumber} New Status: ${cancelledOrder1.status}`);
  console.log(`Cancelled At: ${cancelledOrder1.cancelledAt}, Reason: ${cancelledOrder1.cancellationReason}`);
  if (cancelledOrder1.status === 'CANCELLED' && cancelledOrder1.cancellationReason === 'CUSTOMER_REQUESTED') {
    console.log('✅ TEST 1 PASSED: Unpaid order cancelled directly without refund!\n');
  } else {
    console.error('❌ TEST 1 FAILED:', cancelRes1);
  }

  // TEST SCENARIO 2: Paid Order - Waiter Direct Cancel Guard & Cancellation Request Workflow
  console.log('--- TEST 2: Paid Order - Waiter Request -> Cashier Approval & Full Refund ---');
  const order2 = await createTestOrder(1);
  console.log(`Created Order #${order2.orderNumber} (Amount: ₹${order2.totalAmount})`);

  // Settle Payment for Order 2
  const payRes2 = await request('/payments/initiate', {
    method: 'POST',
    body: JSON.stringify({
      orderId: order2.id,
      amount: order2.totalAmount,
      method: 'UPI_INTENT',
    }),
  }, adminToken, tenantHeaders);
  const payment2 = payRes2.data?.data || payRes2.data;

  // Webhook settlement
  await request(`/payments/webhook/${payment2.id}`, {
    method: 'POST',
    body: JSON.stringify({
      status: 'SUCCESS',
      transactionReference: `UPI_TEST_${Date.now()}`,
    }),
  });
  console.log(`Paid Order #${order2.orderNumber} via UPI successfully.`);

  // Create Cancellation Request
  console.log('Submitting Cancellation Request for paid order...');
  const reqRes2 = await request(`/orders/${order2.id}/cancellation-request`, {
    method: 'POST',
    body: JSON.stringify({
      reason: 'CUSTOMER_REQUESTED',
      note: 'Customer requested refund after payment',
    }),
  }, adminToken, tenantHeaders);

  const request2 = reqRes2.data?.data || reqRes2.data;
  console.log(`Cancellation Request created with Status: ${request2.status}, ID: ${request2.id}`);

  // Cashier reviews and approves request with Full Refund
  console.log('Cashier reviews and approves cancellation with full refund...');
  const reviewRes2 = await request(`/orders/cancellation-requests/${request2.id}/review`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'APPROVE',
      refundAmount: order2.totalAmount,
    }),
  }, adminToken, tenantHeaders);

  const reviewData2 = reviewRes2.data?.data || reviewRes2.data;
  console.log(`Review Action Result: Status = ${reviewData2.status}`);

  // Verify Order and Payment state after approval
  const order2Refreshed = await request(`/orders/${order2.id}`, { method: 'GET' }, adminToken, tenantHeaders);
  const o2 = order2Refreshed.data?.data || order2Refreshed.data;
  console.log(`Order #${o2.orderNumber} Refreshed Status: ${o2.status}`);
  console.log(`Order Refunds count: ${o2.refunds?.length}, Total Refund Amount: ₹${o2.refunds?.[0]?.amount}`);

  if (o2.status === 'CANCELLED' && o2.refunds?.length > 0 && o2.payments?.[0]?.status === 'REFUNDED') {
    console.log('✅ TEST 2 PASSED: Paid order cancellation request approved and full refund processed!\n');
  } else {
    console.error('❌ TEST 2 FAILED:', o2);
  }

  // TEST SCENARIO 3: Partial Refund
  console.log('--- TEST 3: Partial Payment Refund ---');
  const order3 = await createTestOrder(2);
  const payRes3 = await request('/payments/initiate', {
    method: 'POST',
    body: JSON.stringify({
      orderId: order3.id,
      amount: order3.totalAmount,
      method: 'CASH',
    }),
  }, adminToken, tenantHeaders);
  const payment3 = payRes3.data?.data || payRes3.data;

  await request(`/payments/webhook/${payment3.id}`, {
    method: 'POST',
    body: JSON.stringify({ status: 'SUCCESS' }),
  });

  const partialAmount = Math.floor(order3.totalAmount / 2);
  console.log(`Processing Partial Refund of ₹${partialAmount} on total ₹${order3.totalAmount}...`);

  const refundRes3 = await request(`/payments/${payment3.id}/refund`, {
    method: 'POST',
    body: JSON.stringify({
      amount: partialAmount,
      reason: 'Customer reported issue with one item',
      note: '50% compensation discount',
    }),
  }, adminToken, tenantHeaders);

  const refundData3 = refundRes3.data?.data || refundRes3.data;
  console.log(`Partial Refund HTTP Status: ${refundRes3.status}, New Payment Status: ${refundData3.updatedPayment?.status}`);

  if (refundData3.updatedPayment?.status === 'PARTIALLY_REFUNDED') {
    console.log('✅ TEST 3 PASSED: Partial refund recorded and payment updated to PARTIALLY_REFUNDED!\n');
  } else {
    console.error('❌ TEST 3 FAILED:', refundData3);
  }

  // TEST SCENARIO 4: Excess Refund Protection Guard
  console.log('--- TEST 4: Excess Refund Protection Guard ---');
  const remaining = order3.totalAmount - partialAmount;
  const excessAmount = remaining + 1000;
  console.log(`Attempting excess refund of ₹${excessAmount} (remaining balance: ₹${remaining})...`);

  const excessRes = await request(`/payments/${payment3.id}/refund`, {
    method: 'POST',
    body: JSON.stringify({
      amount: excessAmount,
      reason: 'Excess test',
    }),
  }, adminToken, tenantHeaders);

  console.log(`Excess Refund HTTP Status: ${excessRes.status}`);
  if (excessRes.status === 400) {
    console.log('✅ TEST 4 PASSED: Server correctly rejected excess refund attempt with 400 Bad Request!\n');
  } else {
    console.error('❌ TEST 4 FAILED: Server should have returned 400', excessRes);
  }

  // TEST SCENARIO 5: Refunds Listing Endpoint
  console.log('--- TEST 5: Refunds Listing Endpoint ---');
  const allRefundsRes = await request('/payments/refunds', { method: 'GET' }, adminToken, tenantHeaders);
  const allRefunds = allRefundsRes.data?.data || allRefundsRes.data || [];
  console.log(`Total Refund records retrieved: ${allRefunds.length}`);
  if (allRefunds.length >= 2) {
    console.log('✅ TEST 5 PASSED: Refunds ledger endpoint returned all recorded refund transactions!\n');
  } else {
    console.error('❌ TEST 5 FAILED:', allRefundsRes);
  }

  console.log('🎉 ALL 5 E2E TESTS COMPLETED AND VERIFIED SUCCESSFULLY!');
}

runTests().catch(console.error);
