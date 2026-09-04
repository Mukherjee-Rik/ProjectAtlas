import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({
      connectionString,
      // Keep a connection pool configured for cloud Postgres & PgBouncer
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idleTimeoutMillis: 15_000,
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
      statement_timeout: Number(
        process.env.DATABASE_STATEMENT_TIMEOUT_MS ?? 15_000,
      ),
    });

    pool.on('error', (err) => {
      // Supabase / PgBouncer can drop idle sockets. Logging prevents unhandled errors and lets pg-pool create new clients on next query.
      console.warn(
        '[PrismaService] Idle database connection dropped by server:',
        err.message,
      );
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
    });

    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      this.logger.error(
        '❌ DATABASE_URL environment variable is missing or empty!',
      );
      return;
    }

    // Mask database password in logs for security
    const maskedUrl = process.env.DATABASE_URL.replace(/:([^@/]+)@/, ':****@');
    this.logger.log(`🔄 Connecting to database: ${maskedUrl}`);

    try {
      // Connect with a 7-second timeout so the server doesn't hang indefinitely during cold starts
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  'Connection timeout after 7000ms. Check DATABASE_URL accessibility and PostgreSQL service state.',
                ),
              ),
            7000,
          ),
        ),
      ]);
      this.logger.log('✅ Database connected successfully');
    } catch (error: any) {
      this.logger.error(
        `⚠️ Failed to connect to database during startup: ${error.message}`,
        error.stack,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      await this.pool.end();
    } catch {
      // ignore disconnect error on exit
    }
  }
}
