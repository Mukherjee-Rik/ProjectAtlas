import { Module, Global } from '@nestjs/common';
import { ProviderAAdapter } from './adapters/provider-a/provider-a.adapter';
import { ProviderBAdapter } from './adapters/provider-b/provider-b.adapter';
import { DeliveryEventsService } from './services/delivery-events.service';
import { DeliveryProviderFactory } from './services/delivery-provider.factory';
import { DeliveryService } from './services/delivery.service';
import { DeliveryWebhookController } from './webhooks/delivery-webhook.controller';
import { AuditModule } from '../audit/audit.module';

@Global()
@Module({
  imports: [AuditModule],
  controllers: [DeliveryWebhookController],
  providers: [
    ProviderAAdapter,
    ProviderBAdapter,
    DeliveryEventsService,
    DeliveryProviderFactory,
    DeliveryService,
  ],
  exports: [DeliveryService, DeliveryEventsService],
})
export class DeliveryModule {}
