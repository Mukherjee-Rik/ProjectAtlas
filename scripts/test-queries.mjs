import { createRequire } from 'node:module';
import dotenv from 'dotenv';
dotenv.config({ path: './apps/api/.env' });
const require = createRequire(import.meta.url);
const jwt = require('../apps/web/node_modules/jsonwebtoken');
const { PrismaClient } = require('../apps/api/dist/generated/prisma/client.js');
const { PrismaPg } = require('../apps/api/node_modules/@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function run() {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: '2fe8cdb4-2467-4cf8-92fe-f32bd8ce5340' },
  });
  const membership = await prisma.tenantMembership.findFirst({
    where: { tenantId: restaurant.tenantId, role: { in: ['OWNER', 'ADMIN', 'MANAGER'] } },
    include: { user: true },
  });
  const token = jwt.sign(
    { sub: membership.user.id, email: membership.user.email, role: membership.user.role, tenantId: restaurant.tenantId },
    process.env.JWT_SECRET || '1e6e098e1e7e31e0b992f04cadc90ee7be503b65a540823e936b78b2a72e51e7dab016fc509becbd52171bbeb4f426b92e1be1aaa7b193b6f1f68aaea5354744',
    { expiresIn: '1h' }
  );

  for (const query of ['predict tomorrow sales', 'sales forecast for tomorrow', 'what can be the sales tomorow?']) {
    const res = await fetch('https://projectatlas-production-0c80.up.railway.app/api/v1/ai/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'x-restaurant-id': restaurant.id,
        'x-tenant-id': restaurant.tenantId,
      },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    console.log('--- Query:', query, '---');
    console.log('Status:', res.status);
    console.log('dateRange:', data.data?.dateRange);
    console.log('text:', data.data?.text);
  }
}

run().catch(console.error).finally(() => prisma['$disconnect']());
