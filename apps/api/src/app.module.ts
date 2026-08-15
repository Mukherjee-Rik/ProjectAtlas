import crypto from 'node:crypto';
import { IncomingMessage } from 'node:http';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { configuration, envValidationSchema } from './config/index';
import { PrismaModule } from './database/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { TenantMembershipsModule } from './modules/tenant-memberships/tenant-memberships.module';
import { BranchesModule } from './modules/branches/branches.module';
import { DiningAreasModule } from './modules/dining-areas/dining-areas.module';
import { TablesModule } from './modules/tables/tables.module';
import { PublicTablesModule } from './modules/public-tables/public-tables.module';
import { MenusModule } from './modules/menus/menus.module';
import { MenuCategoriesModule } from './modules/menu-categories/menu-categories.module';
import { MenuItemsModule } from './modules/menu-items/menu-items.module';
import { TaxRatesModule } from './modules/tax-rates/tax-rates.module';
import { MenuItemVariantsModule } from './modules/menu-item-variants/menu-item-variants.module';
import { MenuItemAddonsModule } from './modules/menu-item-addons/menu-item-addons.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { TableCallsModule } from './modules/table-calls/table-calls.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AuditModule } from './modules/audit/audit.module';
import { SearchModule } from './modules/search/search.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { AiModule } from './modules/ai/ai.module';
import { AutomationModule } from './modules/automation/automation.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { SupportModule } from './modules/support/support.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { MetricsMiddleware } from './common/metrics/metrics.middleware';
import { MetricsService } from './common/metrics/metrics.service';
import { QueueService } from './common/queue/queue.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validationSchema: envValidationSchema, cache: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }]),
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req: IncomingMessage) => (req.headers['x-request-id'] as string) ?? crypto.randomUUID(),
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } } : undefined,
      },
    }),
    PrismaModule, HealthModule, MonitoringModule, UsersModule, AuthModule, DashboardModule,
    TenantsModule, RestaurantsModule, TenantMembershipsModule,
    BranchesModule, DiningAreasModule, TablesModule, PublicTablesModule,
    MenusModule, MenuCategoriesModule, MenuItemsModule,
    TaxRatesModule, MenuItemVariantsModule, MenuItemAddonsModule,
    CartModule, OrdersModule, PaymentsModule, InventoryModule,
    SubscriptionsModule, TableCallsModule, AuditModule, SearchModule,
    DeliveryModule, AiModule, AutomationModule, SupportModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    MetricsService,
    QueueService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, RequestIdMiddleware, MetricsMiddleware)
      .forRoutes('*');
  }
}
