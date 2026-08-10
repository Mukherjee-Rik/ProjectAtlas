import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { TenantStatus } from '../../../generated/prisma/enums';

export class CreateTenantDto {
  @ApiProperty({
    example: 'Mukherjee Restaurants',
    description: 'Name of the tenant organization',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'mukherjee-restaurants',
    description: 'Unique URL-friendly slug',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiPropertyOptional({
    enum: TenantStatus,
    example: TenantStatus.ACTIVE,
    description: 'Status of the tenant',
  })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}
