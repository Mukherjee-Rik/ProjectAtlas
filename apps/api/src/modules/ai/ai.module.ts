import { Module, Global } from '@nestjs/common';
import { AiProviderService } from './services/ai-provider.service';
import { AiContextService } from './services/ai-context.service';
import { AiService } from './services/ai.service';
import { AiController } from './ai.controller';
import { AuditModule } from '../audit/audit.module';

@Global()
@Module({
  imports: [AuditModule],
  controllers: [AiController],
  providers: [
    AiProviderService,
    AiContextService,
    AiService,
  ],
  exports: [AiService, AiContextService],
})
export class AiModule {}
