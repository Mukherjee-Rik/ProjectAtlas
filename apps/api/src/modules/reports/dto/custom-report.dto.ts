import { IsOptional, IsString, IsArray, IsObject, IsEnum, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ReportFilterItemDto {
  @IsString()
  field: string;

  @IsString()
  operator: string; // 'EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IN', etc.

  value: any;
}

export class ReportSortItemDto {
  @IsString()
  field: string;

  @IsEnum(['ASC', 'DESC'])
  direction: 'ASC' | 'DESC';
}

export class ReportDateRangeDto {
  @IsString()
  preset: string; // 'TODAY', 'THIS_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'CUSTOM', etc.

  @IsOptional()
  @IsString()
  customFrom?: string;

  @IsOptional()
  @IsString()
  customTo?: string;
}

export class ReportVisualizationDto {
  @IsString()
  type: string; // 'KPI_CARD', 'TABLE', 'BAR_CHART', 'LINE_CHART', 'DONUT_CHART', 'AREA_CHART'

  @IsOptional()
  @IsString()
  title?: string;
}

export class ReportConfigurationDto {
  @IsArray()
  @IsString({ each: true })
  metrics: string[];

  @IsArray()
  @IsString({ each: true })
  dimensions: string[];

  @IsOptional()
  @IsArray()
  filters?: ReportFilterItemDto[];

  @IsObject()
  dateRange: ReportDateRangeDto;

  @IsOptional()
  @IsArray()
  sorting?: ReportSortItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;

  @IsObject()
  visualization: ReportVisualizationDto;
}

export class CreateCustomReportDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  dataSource: string; // 'SALES', 'ORDERS', 'MENU', 'CUSTOMERS', 'STAFF', 'BRANCHES', 'PAYMENTS'

  @IsObject()
  configuration: ReportConfigurationDto;

  @IsOptional()
  @IsString()
  visibility?: 'PRIVATE' | 'RESTAURANT' | 'BRANCH' = 'RESTAURANT';

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class UpdateCustomReportDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  configuration?: ReportConfigurationDto;

  @IsOptional()
  @IsString()
  visibility?: 'PRIVATE' | 'RESTAURANT' | 'BRANCH';

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class CreateReportScheduleDto {
  @IsString()
  name: string;

  @IsString()
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';

  @IsOptional()
  @IsString()
  cronExpression?: string;

  @IsOptional()
  @IsString()
  timeOfDay?: string = '09:00';

  @IsOptional()
  @IsNumber()
  dayOfWeek?: number;

  @IsOptional()
  @IsNumber()
  dayOfMonth?: number;

  @IsOptional()
  @IsString()
  timezone?: string = 'Asia/Kolkata';

  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @IsOptional()
  @IsString()
  deliveryFormat?: 'CSV' | 'JSON' | 'IN_APP' = 'CSV';

  @IsOptional()
  @IsBoolean()
  enabled?: boolean = true;
}
