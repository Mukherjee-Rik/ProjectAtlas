import { IsOptional, IsString, IsDateString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CANONICAL_TIME_INTERVALS, type CanonicalTimeInterval } from '../constants/canonical-metrics.constants';

export class IntelligenceDateFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class TimeSeriesQueryDto extends IntelligenceDateFilterDto {
  @IsOptional()
  @IsEnum(CANONICAL_TIME_INTERVALS)
  interval?: CanonicalTimeInterval = 'DAILY';
}

export class OperationalEventsQueryDto extends IntelligenceDateFilterDto {
  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}

export class AiGatewayQueryDto {
  @IsString()
  queryType: string;

  @IsOptional()
  parameters?: Record<string, any>;
}
