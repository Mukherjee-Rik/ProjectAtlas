import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

export class AnalyticsFilterDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  menuItemId?: string;

  @IsOptional()
  @IsString()
  orderType?: string; // 'DINE_IN', 'TAKEOUT', 'QR', 'WAITER', 'POS'

  @IsOptional()
  @IsString()
  paymentMethod?: string; // 'CASH', 'CARD', 'UPI_INTENT', 'RAZORPAY', 'STRIPE'

  @IsOptional()
  @IsString()
  staffId?: string;

  @IsOptional()
  @IsString()
  customerSegment?: string;
}

export class PeriodComparisonDto extends AnalyticsFilterDto {
  @IsOptional()
  @IsString()
  comparisonPeriod?: 'PREVIOUS_PERIOD' | 'PREVIOUS_YEAR' | 'SAME_DAY_LAST_WEEK' | 'CUSTOM' = 'PREVIOUS_PERIOD';

  @IsOptional()
  @IsDateString()
  previousFrom?: string;

  @IsOptional()
  @IsDateString()
  previousTo?: string;
}

export class DrillDownQueryDto extends AnalyticsFilterDto {
  @IsString()
  dimension: 'BRANCH' | 'CATEGORY' | 'MENU_ITEM' | 'ORDER';

  @IsOptional()
  @IsString()
  targetId?: string;
}

export class CreateSavedReportDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  reportType: string;

  filters: Record<string, any>;
}
