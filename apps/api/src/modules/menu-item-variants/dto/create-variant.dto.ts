import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MenuItemVariantStatus } from '../../../generated/prisma/enums';

export class CreateVariantDto {
  @ApiProperty({ example: 'Large' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
  @ApiProperty({ example: 399 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
  @ApiPropertyOptional({ enum: MenuItemVariantStatus })
  @IsOptional()
  @IsEnum(MenuItemVariantStatus)
  status?: MenuItemVariantStatus;
}
