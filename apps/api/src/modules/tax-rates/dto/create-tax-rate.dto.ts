import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { TaxType, TaxRateStatus } from '../../../generated/prisma/enums';

export class CreateTaxRateDto {
  @ApiProperty({ example: 'GST 5%' })
  @IsString() @MinLength(2) @MaxLength(100)
  name: string;

  @ApiProperty({ enum: TaxType, example: TaxType.PERCENTAGE })
  @IsEnum(TaxType)
  type: TaxType;

  @ApiProperty({ example: 5.0 })
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  value: number;

  @ApiPropertyOptional({ enum: TaxRateStatus })
  @IsOptional() @IsEnum(TaxRateStatus)
  status?: TaxRateStatus;
}
