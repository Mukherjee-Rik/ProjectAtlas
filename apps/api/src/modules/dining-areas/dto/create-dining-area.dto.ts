import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { DiningAreaStatus } from '../../../generated/prisma/enums';

export class CreateDiningAreaDto {
  @ApiProperty({
    example: 'Indoor Dining',
    description: 'Name of the dining area',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'INDOOR',
    description: 'Unique dining area code within this branch',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'Code can only contain alphanumeric characters and hyphens',
  })
  code: string;

  @ApiPropertyOptional({
    enum: DiningAreaStatus,
    example: DiningAreaStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(DiningAreaStatus)
  status?: DiningAreaStatus;
}
