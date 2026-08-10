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

import { BranchStatus } from '../../../generated/prisma/enums';

export class CreateBranchDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the target restaurant',
  })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({
    example: 'Agartala Branch',
    description: 'Name of the branch',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'AGT-01',
    description: 'Unique branch code within this restaurant',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'Code can only contain alphanumeric characters and hyphens',
  })
  code: string;

  @ApiPropertyOptional({ example: '123 Central Road' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Agartala' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Tripura' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '799001' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: '+91 9876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    enum: BranchStatus,
    example: BranchStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;
}
