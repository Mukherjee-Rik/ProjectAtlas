import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { RestaurantStatus } from '../../../generated/prisma/enums';

export class CreateRestaurantDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the owning tenant (optional, inferred from X-Tenant-Id header)',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({
    example: 'Downtown Bistro',
    description: 'Name of the restaurant',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'downtown-bistro',
    description: 'URL-friendly slug (unique per tenant)',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiPropertyOptional({
    enum: RestaurantStatus,
    example: RestaurantStatus.ACTIVE,
    description: 'Status of the restaurant',
  })
  @IsOptional()
  @IsEnum(RestaurantStatus)
  status?: RestaurantStatus;
}
