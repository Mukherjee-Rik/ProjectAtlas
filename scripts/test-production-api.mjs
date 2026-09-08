import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const require = createRequire(import.meta.url);
const jwt = require('../apps/web/node_modules/jsonwebtoken');
const { PrismaClient } = require('../apps/api/dist/generated/prisma/client.js');
const { PrismaPg } = require('../apps/api/node_modules/@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function checkProduction() {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: '2fe8cdb4-2467-4cf8-92fe-f32bd8ce5340' },
  });

  const membership = await prisma.tenantMembership.findFirst({
    where: {
      tenantId: restaurant.tenantId,
      role: { in: ['OWNER', 'ADMIN', 'MANAGER'] },
    },
    include: { user: true },
  });

  const user = membership.user;
  const secret = process.env.JWT_SECRET || '1e6e098e1e7e31e0b992f04cadc90ee7be503b65a540823e936b78b2a72e51e7dab016fc509becbd52171bbeb4f426b92e1be1aaa7b193b6f1f68aaea5354744';

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: restaurant.tenantId,
    },
    secret,
    { expiresIn: '1h' }
  );

  const query = 'what can be the sales tomorow?';
  console.log('Testing Railway Production Backend:');
  console.log('Query:', query);

  const res = await fetch('https://projectatlas-production-0c80.up.railway.app/api/v1/ai/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-restaurant-id': restaurant.id,
      'x-tenant-id': restaurant.tenantId,
    },
    body: JSON.stringify({ query }),
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Data:', JSON.stringify(data, null, 2));
}

checkProduction()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
