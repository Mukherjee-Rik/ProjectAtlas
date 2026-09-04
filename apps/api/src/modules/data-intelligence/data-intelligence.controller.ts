import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { BranchAccessGuard } from '../auth/guards/branch-access.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { OperationalEventService } from './services/operational-event.service';
import { DataAggregationEngineService } from './services/data-aggregation-engine.service';
import { DataQualityService } from './services/data-quality.service';
import { AiDataGatewayService } from './services/ai-data-gateway.service';
import {
  OperationalEventsQueryDto,
  AiGatewayQueryDto,
} from './dto/intelligence-query.dto';

@ApiTags('Data Intelligence Layer')
@ApiBearerAuth('access-token')
@Controller({ path: 'data-intelligence', version: '1' })
@UseGuards(
  JwtAuthGuard,
  TenantAccessGuard,
  RestaurantAccessGuard,
  BranchAccessGuard,
  SubscriptionGuard,
)
export class DataIntelligenceController {
  constructor(
    private readonly eventService: OperationalEventService,
    private readonly aggregationService: DataAggregationEngineService,
    private readonly qualityService: DataQualityService,
    private readonly aiGateway: AiDataGatewayService,
  ) {}

  @Get('events')
  @ApiOperation({
    summary: 'Query operational event stream with tenant isolation',
  })
  async getEvents(
    @Headers('x-restaurant-id') restaurantId: string,
    @Query() query: OperationalEventsQueryDto,
  ) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.eventService.queryEvents(restaurantId, {
      branchId: query.branchId,
      eventType: query.eventType,
      entityId: query.entityId,
      startDate,
      endDate,
      limit: query.limit,
    });
  }

  @Post('backfill')
  @ApiOperation({
    summary: 'Trigger historical data backfill routine for daily rollups',
  })
  async runBackfill(@Headers('x-restaurant-id') restaurantId: string) {
    return this.aggregationService.backfillHistoricalData(restaurantId);
  }

  @Get('quality-audit')
  @ApiOperation({
    summary: 'Run data quality, reconciliation and anomaly detection audit',
  })
  async runQualityAudit(@Headers('x-restaurant-id') restaurantId: string) {
    return this.qualityService.runAudit(restaurantId);
  }

  @Post('ai-gateway/query')
  @ApiOperation({ summary: 'Controlled AI data gateway access point' })
  async queryAiGateway(
    @Req() req: any,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body() body: AiGatewayQueryDto,
  ) {
    return this.aiGateway.executeQuery(
      {
        tenantId: req.tenant?.id ?? tenantId,
        restaurantId: req.restaurant?.id ?? restaurantId,
        branchId: req.branch?.id ?? branchId,
        actorUserId: req.user?.id,
        userRole: req.user?.role,
      },
      body.queryType,
      body.parameters,
    );
  }
}
