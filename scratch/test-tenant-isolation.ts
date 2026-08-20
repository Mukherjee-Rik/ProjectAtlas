async function test() {
  const loginRes = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@atlas.com',
      password: 'Atlas@12345',
    }),
  });

  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  console.log('Logged-in User:', loginData?.data?.user?.name, loginData?.data?.user?.email);
  console.log('Tenant:', loginData?.data?.memberships?.[0]?.tenant?.name);

  const token = loginData?.data?.accessToken;
  const dashRes = await fetch('http://localhost:4000/api/v1/dashboard/overview', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const dashData = await dashRes.json();
  console.log('\n=== DASHBOARD OVERVIEW FOR test@atlas.com ===');
  console.log('Metrics:', dashData?.data?.metrics);
  console.log('Recent Orders:', dashData?.data?.recentOrders);
  console.log('Restaurant Staff:', dashData?.data?.restaurantStaff);
}

test().catch(console.error);
