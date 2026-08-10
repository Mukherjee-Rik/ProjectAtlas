import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUrl, IsUUID, Matches, Max, Min, MaxLength, MinLength } from 'class-validator';
import { MenuItemStatus, DietaryType, FoodType } from '../../../generated/prisma/enums';

export class CreateMenuItemDto {
  @ApiProperty() @IsUUID() categoryId: string;
  @ApiProperty({ example: 'Margherita Pizza' }) @IsString() @MinLength(2) @MaxLength(100) name: string;
  @ApiProperty({ example: 'MARGHERITA' }) @IsString() @MinLength(2) @MaxLength(50) @Matches(/^[A-Za-z0-9-]+$/, { message: 'Code can only contain alphanumeric characters and hyphens' }) code: string;
  @ApiPropertyOptional({ example: 'Classic tomato, mozzarella and basil' }) @IsOptional() @IsString() @MaxLength(500) description?: string;
  @ApiPropertyOptional({ example: 'https://cdn.example.com/menu/margherita.webp' }) @IsOptional() @IsUrl() imageUrl?: string;
  @ApiProperty({ example: 299.0 }) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price: number;
  @ApiPropertyOptional({ enum: DietaryType }) @IsOptional() @IsEnum(DietaryType) dietaryType?: DietaryType;
  @ApiPropertyOptional({ enum: FoodType }) @IsOptional() @IsEnum(FoodType) foodType?: FoodType;
  @ApiPropertyOptional({ example: 15 }) @IsOptional() @IsInt() @Min(0) @Max(1440) preparationTimeMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() taxRateId?: string;
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @IsInt() @Min(0) position?: number;
  @ApiPropertyOptional({ enum: MenuItemStatus }) @IsOptional() @IsEnum(MenuItemStatus) status?: MenuItemStatus;
}
