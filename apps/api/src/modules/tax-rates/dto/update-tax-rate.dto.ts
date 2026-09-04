import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { TaxType, TaxRateStatus } from '../../../generated/prisma/enums';

export class UpdateTaxRateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: TaxType })
  @IsOptional()
  @IsEnum(TaxType)
  type?: TaxType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ enum: TaxRateStatus })
  @IsOptional()
  @IsEnum(TaxRateStatus)
  status?: TaxRateStatus;
}
