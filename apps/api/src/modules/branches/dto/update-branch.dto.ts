import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { BranchStatus } from '../../../generated/prisma/enums';

export class UpdateBranchDto {
  @ApiPropertyOptional({ example: 'Agartala Main Branch' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'AGT-01' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'Code can only contain alphanumeric characters and hyphens',
  })
  code?: string;

  @ApiPropertyOptional({ example: '123 Central Road' })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({ example: 'Agartala' })
  @IsOptional()
  @IsString()
  city?: string | null;

  @ApiPropertyOptional({ example: 'Tripura' })
  @IsOptional()
  @IsString()
  state?: string | null;

  @ApiPropertyOptional({ example: '799001' })
  @IsOptional()
  @IsString()
  postalCode?: string | null;

  @ApiPropertyOptional({ example: '+91 9876543210' })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({ enum: BranchStatus })
  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;
}
