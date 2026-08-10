import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

import { MenuCategoryStatus } from '../../../generated/prisma/enums';

export class CreateMenuCategoryDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the target menu',
  })
  @IsUUID()
  menuId: string;

  @ApiProperty({
    example: 'Pizzas',
    description: 'Name of the category',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'PIZZAS',
    description: 'Unique category code within this menu',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'Code can only contain alphanumeric characters and hyphens',
  })
  code: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display order position',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({
    enum: MenuCategoryStatus,
    example: MenuCategoryStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(MenuCategoryStatus)
  status?: MenuCategoryStatus;
}
