import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateMenuCategoryDto {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  menuId?: string;

  @ApiPropertyOptional({ example: 'Gourmet Pizzas' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'PIZZAS' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'Code can only contain alphanumeric characters and hyphens',
  })
  code?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ enum: MenuCategoryStatus })
  @IsOptional()
  @IsEnum(MenuCategoryStatus)
  status?: MenuCategoryStatus;
}
