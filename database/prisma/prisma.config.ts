import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, env } from 'prisma/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../../apps/api/.env'),
});

let dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
if (dbUrl.includes(':6543')) {
  dbUrl = dbUrl.replace(':6543', ':5432').replace('pgbouncer=true', 'pgbouncer=false');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
  },

  datasource: {
    url: dbUrl,
  },
});
