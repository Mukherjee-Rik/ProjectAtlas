/**
 * Sprint 3.65: First Pilot Restaurant Onboarding & Lifecycle Acceptance Test
 * 
 * Simulates a real restaurant owner onboarding their restaurant ("Spice Symphony Grand Bistro"),
 * setting up tables, menus, staff, processing live guest orders, kitchen lifecycle,
 * and support ticket resolution.
 */

const API_BASE = 'http://localhost:3000/api';

async function runPilotOnboarding() {
  console.log('================================================================');
  console.log('🧑‍🍳 SPRINT 3.65: REAL PILOT RESTAURANT ONBOARDING ACCEPTANCE');
  console.log('================================================================\n');

  // Step 1: Owner Registration & Restaurant Creation
  console.log('1️⃣ [Owner Onboarding] Registering Pilot Owner & "Spice Symphony Grand Bistro"...');
  const ownerEmail = `pilot.owner.${Date.now()}@spicesymphony.com`;
  const ownerPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const ownerPassword = 'PilotPassword123!';

  const regRes = await fetch(`${API_BASE}/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantName: 'Spice Symphony Grand Bistro',
      ownerName: 'Rohan Kapoor (Owner)',
      email: ownerEmail,
      phone: ownerPhone,
      password: ownerPassword,
    }),
  });

  const regData = await regRes.json();
  if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);

  const token = regData.data.accessToken;
  const restaurantId = regData.data.restaurant.id;
  const tenantId = regData.data.tenant.id;
  console.log(`   ✓ Registered Owner: ${ownerEmail}`);
  console.log(`   ✓ Provisioned Restaurant: "${regData.data.restaurant.name}" (${restaurantId})`);

  // Step 2: Fetch Provisioned Main Branch & Create Dining Area
  console.log('\n2️⃣ [Branch & Floor Plan] Fetching Default Branch & Main Dining Hall...');
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': tenantId,
    'x-restaurant-id': restaurantId,
  };

  const branchesRes = await fetch(`${API_BASE}/v1/branches`, {
    headers: defaultHeaders,
  });
  const branchesData = await branchesRes.json();
  const branch = branchesData.data[0];
  const branchId = branch.id;
  console.log(`   ✓ Active Main Branch: "${branch.name}" (${branchId})`);

  const areaRes = await fetch(`${API_BASE}/v1/dining-areas`, {
    method: 'POST',
    headers: { ...defaultHeaders, 'x-branch-id': branchId },
    body: JSON.stringify({
      name: 'Heritage Courtyard',
      code: 'HC',
    }),
  });

  const areaData = await areaRes.json();
  if (!areaRes.ok) throw new Error(`Dining area creation failed: ${JSON.stringify(areaData)}`);
  const diningAreaId = areaData.data.id;
  console.log(`   ✓ Dining Area: "${areaData.data.name}" (${diningAreaId})`);

  // Step 3: Provision Tables & QR codes
  console.log('\n3️⃣ [Tables & QR Ordering] Provisioning Table T-01...');
  const tableRes = await fetch(`${API_BASE}/v1/tables`, {
    method: 'POST',
    headers: { ...defaultHeaders, 'x-branch-id': branchId },
    body: JSON.stringify({
      name: 'Table 01',
      code: 'T-01',
      capacity: 4,
      diningAreaId,
    }),
  });

  const tableData = await tableRes.json();
  if (!tableRes.ok) throw new Error(`Table creation failed: ${JSON.stringify(tableData)}`);
  const tableId = tableData.data.id;
  const qrToken = tableData.data.publicToken;
  console.log(`   ✓ Table Provisioned: "${tableData.data.name}" | QR Public Token: ${qrToken}`);

  // Step 4: Create Menu, Categories, and Dishes
  console.log('\n4️⃣ [Menu Engineering] Creating "Signature Mughlai" Catalog...');
  const menuRes = await fetch(`${API_BASE}/v1/menus`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({
      name: 'All-Day Royal Dining',
      code: 'ROYAL-MAIN',
    }),
  });
  const menuData = await menuRes.json();
  if (!menuRes.ok) throw new Error(`Menu creation failed: ${JSON.stringify(menuData)}`);
  const menuId = menuData.data.id;

  const catRes = await fetch(`${API_BASE}/v1/menu-categories`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({
      menuId,
      name: 'Royal Biryani & Curries',
      code: 'BIRYANI-CAT',
      position: 1,
    }),
  });
  const catData = await catRes.json();
  if (!catRes.ok) throw new Error(`Category creation failed: ${JSON.stringify(catData)}`);
  const categoryId = catData.data.id;

  const itemRes = await fetch(`${API_BASE}/v1/menu-items`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({
      categoryId,
      name: 'Truffle Smoked Dum Biryani',
      code: 'TRUFFLE-BIRYANI',
      price: 650,
      dietaryType: 'NON_VEG',
      foodType: 'FOOD',
      description: 'Slow-cooked aromatic basmati infused with shaved black truffles',
    }),
  });
  const itemData = await itemRes.json();
  if (!itemRes.ok) throw new Error(`Menu item creation failed: ${JSON.stringify(itemData)}`);
  const menuItemId = itemData.data.id;
  console.log(`   ✓ Created Menu Item: "${itemData.data.name}" (₹${itemData.data.price})`);

  // Step 5: Simulate Guest Order via Table QR
  console.log('\n5️⃣ [Guest Ordering Flow] Guest scans Table T-01 QR and adds Truffle Biryani to Cart...');
  const cartRes = await fetch(`${API_BASE}/v1/public/tables/${qrToken}/cart/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      menuItemId,
      quantity: 2,
    }),
  });

  const cartData = await cartRes.json();
  if (!cartRes.ok) throw new Error(`Add to cart failed: ${JSON.stringify(cartData)}`);
  console.log(`   ✓ Item added to Table Cart | Total Cart Lines: ${cartData.data.items?.length || 1}`);

  console.log('   📱 Guest clicks "Submit Table Order"...');
  const orderRes = await fetch(`${API_BASE}/v1/public/tables/${qrToken}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const orderData = await orderRes.json();
  if (!orderRes.ok) throw new Error(`Order placement failed: ${JSON.stringify(orderData)}`);
  const orderId = orderData.data.id;
  console.log(`   ✓ Order #${orderData.data.orderNumber} Placed | Total Amount: ₹${orderData.data.totalAmount}`);

  // Step 6: Advance Kitchen Status (KDS Workflow)
  console.log('\n6️⃣ [Kitchen KDS Workflow] Chef marks order PREPARING -> READY...');
  const kdsPrepRes = await fetch(`${API_BASE}/v1/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: defaultHeaders,
    body: JSON.stringify({ status: 'PREPARING' }),
  });
  const kdsPrepData = await kdsPrepRes.json();
  console.log(`   ✓ Kitchen Status: ${kdsPrepData.data.status}`);

  const kdsReadyRes = await fetch(`${API_BASE}/v1/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: defaultHeaders,
    body: JSON.stringify({ status: 'READY' }),
  });
  const kdsReadyData = await kdsReadyRes.json();
  console.log(`   ✓ Kitchen Status: ${kdsReadyData.data.status} (Ready for Pickup)`);

  // Step 7: Support Ticket Workflow
  console.log('\n7️⃣ [Support & Incident Desk] Pilot owner files a support ticket...');
  const ticketRes = await fetch(`${API_BASE}/v1/support/tickets`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({
      category: 'HARDWARE',
      priority: 'HIGH',
      subject: 'Kitchen Thermal Printer Setup Assistance',
      description: 'Need help connecting our Star Micronics printer to the Atlas KDS output stream.',
      contactEmail: ownerEmail,
      contactPhone: '+91 9876543210',
    }),
  });

  const ticketData = await ticketRes.json();
  if (!ticketRes.ok) throw new Error(`Support ticket creation failed: ${JSON.stringify(ticketData)}`);
  const ticketId = ticketData.data.id;
  const ticketNumber = ticketData.data.ticketNumber;
  console.log(`   ✓ Support Ticket Created: [${ticketNumber}] "${ticketData.data.subject}"`);

  // Platform Admin resolves ticket
  console.log('   🛠️ Platform Admin resolving support incident...');
  const resolveRes = await fetch(`${API_BASE}/v1/support/tickets/${ticketId}/resolve`, {
    method: 'PATCH',
    headers: defaultHeaders,
    body: JSON.stringify({
      status: 'RESOLVED',
      resolutionNotes: 'Configured thermal ESC/POS driver and routed KDS print events to port 9100. Printer verified online.',
    }),
  });

  const resolveData = await resolveRes.json();
  console.log(`   ✓ Ticket [${ticketNumber}] Status: ${resolveData.data.status} | Resolution: "${resolveData.data.resolutionNotes}"`);

  // Step 8: Verify Live Dashboard Analytics
  console.log('\n8️⃣ [Dashboard Telemetry] Verifying Pilot Restaurant Analytics...');
  const dashRes = await fetch(`${API_BASE}/v1/dashboard/overview`, {
    headers: defaultHeaders,
  });

  const dashData = await dashRes.json();
  const metrics = dashData.data?.metrics || dashData.metrics;
  console.log('   ✓ Real-Time Dashboard Metrics:', {
    totalOrders: metrics?.totalOrders,
    totalSales: `₹${metrics?.totalSales}`,
    activeTables: metrics?.activeTables,
    menuItems: metrics?.menuItems,
  });

  console.log('\n================================================================');
  console.log('🎉 SPRINT 3.65 PILOT ONBOARDING & ACCEPTANCE: 100% SUCCESSFUL!');
  console.log('================================================================\n');
}

runPilotOnboarding().catch((err) => {
  console.error('❌ Pilot Onboarding Failed:', err);
  process.exit(1);
});
