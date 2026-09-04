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
import { MenuItemAddonStatus } from '../../../generated/prisma/enums';

export class CreateAddonDto {
  @ApiProperty({ example: 'Extra Cheese' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
  @ApiProperty({ example: 50 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
  @ApiPropertyOptional({ enum: MenuItemAddonStatus })
  @IsOptional()
  @IsEnum(MenuItemAddonStatus)
  status?: MenuItemAddonStatus;
}
