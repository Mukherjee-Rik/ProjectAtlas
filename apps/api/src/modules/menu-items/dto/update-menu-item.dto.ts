import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  MenuItemStatus,
  DietaryType,
  FoodType,
} from '../../../generated/prisma/enums';

export class UpdateMenuItemDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'Code can only contain alphanumeric characters and hyphens',
  })
  code?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() imageUrl?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;
  @ApiPropertyOptional({ enum: DietaryType })
  @IsOptional()
  @IsEnum(DietaryType)
  dietaryType?: DietaryType;
  @ApiPropertyOptional({ enum: FoodType })
  @IsOptional()
  @IsEnum(FoodType)
  foodType?: FoodType;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  preparationTimeMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() taxRateId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) position?: number;
  @ApiPropertyOptional({ enum: MenuItemStatus })
  @IsOptional()
  @IsEnum(MenuItemStatus)
  status?: MenuItemStatus;
}
