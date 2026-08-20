import { IsOptional, IsString, IsEnum } from 'class-validator';

export class ForecastQueryDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsEnum(['24H', '48H', '7D', '14D', '30D', '90D'])
  horizon?: '24H' | '48H' | '7D' | '14D' | '30D' | '90D' = '7D';

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  mealPeriod?: string;

  @IsOptional()
  @IsString()
  metric?: string;
}

export class GenerateForecastDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsEnum(['7D', '14D', '30D'])
  horizon?: '7D' | '14D' | '30D' = '7D';

  @IsOptional()
  @IsString()
  modelVersion?: string = 'seasonal-dow-v1';
}

export class ForecastAiQueryDto {
  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}
