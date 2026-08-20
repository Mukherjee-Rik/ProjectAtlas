import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { BranchAccessGuard } from '../auth/guards/branch-access.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { ForecastingEngineService } from './services/forecasting-engine.service';
import { MenuDemandForecasterService } from './services/menu-demand-forecaster.service';
import { MealPeriodChannelForecasterService } from './services/meal-period-channel-forecaster.service';
import { ForecastExplainabilityService } from './services/forecast-explainability.service';
import { ModelSelectionService } from './services/model-selection.service';
import { ForecastAccuracyService } from './services/forecast-accuracy.service';
import { ForecastAiGatewayService } from './services/forecast-ai-gateway.service';
import { ForecastJobService } from './services/forecast-job.service';
import { ForecastQueryDto, GenerateForecastDto, ForecastAiQueryDto } from './dto/forecast-query.dto';
import { MODEL_REGISTRY } from './constants/forecast-models.constants';

@ApiTags('Sales & Demand Forecasting (V2.5)')
@ApiBearerAuth('access-token')
@Controller({ path: 'forecasts', version: '1' })
@UseGuards(
  JwtAuthGuard,
  TenantAccessGuard,
  RestaurantAccessGuard,
  BranchAccessGuard,
  SubscriptionGuard,
)
export class ForecastsController {
  constructor(
    private readonly forecastingEngine: ForecastingEngineService,
    private readonly menuDemandForecaster: MenuDemandForecasterService,
    private readonly mealChannelForecaster: MealPeriodChannelForecasterService,
    private readonly explainabilityService: ForecastExplainabilityService,
    private readonly modelSelectionService: ModelSelectionService,
    private readonly accuracyService: ForecastAccuracyService,
    private readonly aiGatewayService: ForecastAiGatewayService,
    private readonly jobService: ForecastJobService,
  ) {}

  @Get('sales')
  @ApiOperation({ summary: 'Get multi-horizon sales and revenue forecast' })
  async getSalesForecast(
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-branch-id') headerBranchId: string | undefined,
    @Query() query: ForecastQueryDto,
  ) {
    const branchId = query.branchId || headerBranchId;
    const horizonDays = query.horizon === '90D' ? 90 : query.horizon === '30D' ? 30 : query.horizon === '14D' ? 14 : query.horizon === '48H' ? 2 : query.horizon === '24H' ? 1 : 7;
    return this.forecastingEngine.generateSalesForecast(restaurantId, branchId, horizonDays);
  }

  @Get('meal-channels')
  @ApiOperation({ summary: 'Get breakdown by meal period (Lunch/Dinner) and channel (Dine-in/Delivery)' })
  async getMealAndChannels(
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-branch-id') headerBranchId: string | undefined,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId = queryBranchId || headerBranchId;
    const salesForecast = await this.forecastingEngine.generateSalesForecast(restaurantId, branchId, 1);
    return this.mealChannelForecaster.forecastMealPeriodsAndChannels(
      restaurantId,
      salesForecast.summary.tomorrowSales,
      salesForecast.summary.tomorrowOrders,
      branchId,
    );
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Get 7x24 Day x Hour operational demand intensity heatmap' })
  async getDemandHeatmap(
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-branch-id') headerBranchId: string | undefined,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId = queryBranchId || headerBranchId;
    return this.mealChannelForecaster.generateDemandHeatmap(restaurantId, branchId);
  }

  @Get('explain')
  @ApiOperation({ summary: 'Explain why a forecast differs from recent baseline' })
  async explainForecast(
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-branch-id') headerBranchId: string | undefined,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId = queryBranchId || headerBranchId;
    const salesForecast = await this.forecastingEngine.generateSalesForecast(restaurantId, branchId, 1);
    return this.explainabilityService.explainForecast(restaurantId, salesForecast.summary.tomorrowSales, branchId);
  }

  @Get('demand')
  @ApiOperation({ summary: 'Get item-level menu demand and portion predictions' })
  async getMenuDemand(
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-branch-id') headerBranchId: string | undefined,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId = queryBranchId || headerBranchId;
    return this.menuDemandForecaster.forecastMenuDemand(restaurantId, branchId);
  }

  @Get('accuracy')
  @ApiOperation({ summary: 'Get forecast accuracy metrics (WAPE, MAE, RMSE, Forecast vs Actuals)' })
  async getAccuracy(
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-branch-id') headerBranchId: string | undefined,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId = queryBranchId || headerBranchId;
    return this.accuracyService.getAccuracySummary(restaurantId, branchId);
  }

  @Get('models')
  @ApiOperation({ summary: 'List registered forecasting models' })
  listModels() {
    return Object.values(MODEL_REGISTRY);
  }

  @Get('models/benchmark')
  @ApiOperation({ summary: 'Benchmark candidate models to designate champion' })
  async benchmarkModels(
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-branch-id') headerBranchId: string | undefined,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId = queryBranchId || headerBranchId;
    return this.modelSelectionService.benchmarkModels(restaurantId, branchId);
  }

  @Post('ai/query')
  @ApiOperation({ summary: 'Natural-language conversational forecast query gateway' })
  async answerAiQuery(
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-branch-id') headerBranchId: string | undefined,
    @Body() body: ForecastAiQueryDto,
  ) {
    const branchId = body.branchId || headerBranchId;
    return this.aiGatewayService.answerQuery(restaurantId, body.question, branchId);
  }

  @Get('runs')
  @ApiOperation({ summary: 'List forecast execution runs history' })
  async listRuns(@Headers('x-restaurant-id') restaurantId: string) {
    return this.jobService.listRuns(restaurantId);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Trigger an asynchronous forecast calculation cycle' })
  async triggerForecast(
    @Headers('x-restaurant-id') restaurantId: string,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-branch-id') headerBranchId: string | undefined,
    @Body() dto: GenerateForecastDto,
  ) {
    const branchId = dto.branchId || headerBranchId;
    return this.jobService.runForecastCycle(
      restaurantId,
      tenantId,
      branchId,
      dto.horizon || '7D',
      dto.modelVersion || 'seasonal-dow-v1',
    );
  }
}
