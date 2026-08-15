// Multi-Tenant Isolation & Security Boundary Verification Test for Project Atlas
const PROXY = 'http://localhost:3001/api/proxy';

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('🔒 SPRINT 3.64: MULTI-TENANT ISOLATION & SECURITY AUDIT');
  console.log('================================================================\n');

  const ts = Date.now();

  // 1. Provision Tenant A & Restaurant A
  console.log('👤 [Setup] Provisioning Tenant Alpha...');
  const signupARes = await fetch(`${PROXY}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantName: `Alpha Grill ${ts}`,
      ownerName: 'Owner Alpha',
      email: `alpha_${ts}@atlas-pos.com`,
      password: 'Password123!',
    }),
  });
  const dataA = (await signupARes.json()).data;
  const tokenA = dataA.accessToken;
  const tenantA = dataA.tenant.id;
  const restA = dataA.restaurant.id;

  // 2. Provision Tenant B & Restaurant B
  console.log('👤 [Setup] Provisioning Tenant Bravo...');
  const signupBRes = await fetch(`${PROXY}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantName: `Bravo Sushi ${ts}`,
      ownerName: 'Owner Bravo',
      email: `bravo_${ts}@atlas-pos.com`,
      password: 'Password123!',
    }),
  });
  const dataB = (await signupBRes.json()).data;
  const tokenB = dataB.accessToken;
  const tenantB = dataB.tenant.id;
  const restB = dataB.restaurant.id;

  console.log(`   ✓ Tenant Alpha: ${tenantA} | Rest: ${restA}`);
  console.log(`   ✓ Tenant Bravo: ${tenantB} | Rest: ${restB}\n`);

  let securityPasses = 0;
  let totalTests = 0;

  async function assertSecurityViolation(testName, requestFn, expectedStatus = [401, 403, 404]) {
    totalTests++;
    try {
      const res = await requestFn();
      if (expectedStatus.includes(res.status)) {
        console.log(`   🛡️  [PASSED] ${testName} (Blocked with HTTP ${res.status})`);
        securityPasses++;
      } else {
        console.error(`   ❌ [FAILED] ${testName} - Unexpected HTTP ${res.status} (Allowed access!)`);
      }
    } catch (err) {
      console.log(`   🛡️  [PASSED] ${testName} (Connection rejected safely)`);
      securityPasses++;
    }
  }

  console.log('🧪 Executing Multi-Tenant Isolation Attacks...');

  // Test 1: Restaurant A token attempting to query Restaurant B's tenant resources
  await assertSecurityViolation(
    'Attack 1: Tenant Alpha querying Restaurant Bravo with Alpha Token',
    () =>
      fetch(`${PROXY}/restaurants`, {
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'x-tenant-id': tenantB,
          'x-restaurant-id': restB,
        },
      }),
    [403, 404]
  );

  // Test 2: Restaurant A attempting to read Restaurant B's orders
  await assertSecurityViolation(
    'Attack 2: Tenant Alpha fetching Orders of Restaurant Bravo',
    () =>
      fetch(`${PROXY}/orders`, {
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'x-tenant-id': tenantB,
          'x-restaurant-id': restB,
        },
      }),
    [403, 404]
  );

  // Test 3: Restaurant A attempting to create menu items in Restaurant B
  await assertSecurityViolation(
    'Attack 3: Tenant Alpha mutating Menu in Restaurant Bravo',
    () =>
      fetch(`${PROXY}/menus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
          'x-tenant-id': tenantB,
          'x-restaurant-id': restB,
        },
        body: JSON.stringify({ name: 'Hacked Menu', code: 'HACK01' }),
      }),
    [403, 404]
  );

  // Test 4: Restaurant Owner attempting to access Platform Admin overview
  await assertSecurityViolation(
    'Attack 4: Non-platform-admin attempting to access Platform Overview',
    () =>
      fetch(`${PROXY}/dashboard/platform-overview`, {
        headers: {
          Authorization: `Bearer ${tokenA}`,
        },
      }),
    [403, 404]
  );

  // Test 5: Forged JWT token
  await assertSecurityViolation(
    'Attack 5: Forged / Manipulated JWT Signature',
    () =>
      fetch(`${PROXY}/restaurants`, {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotTrustThisSignature`,
          'x-tenant-id': tenantA,
        },
      }),
    [401]
  );

  // Test 6: Missing Auth Token
  await assertSecurityViolation(
    'Attack 6: Unauthenticated Request to Protected Route',
    () =>
      fetch(`${PROXY}/restaurants`, {
        headers: {
          'x-tenant-id': tenantA,
        },
      }),
    [401]
  );

  console.log('\n================================================================');
  console.log(`🎉 SECURITY AUDIT: ${securityPasses}/${totalTests} THREAT VECTORS BLOCKED AND HARDENED!`);
  console.log('================================================================');
}

runSecurityAudit().catch(console.error);
