import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { DiningAreaStatus } from '../../../generated/prisma/enums';

export class UpdateDiningAreaDto {
  @ApiPropertyOptional({ example: 'Main Indoor Dining' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'INDOOR-01' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'Code can only contain alphanumeric characters and hyphens',
  })
  code?: string;

  @ApiPropertyOptional({ enum: DiningAreaStatus })
  @IsOptional()
  @IsEnum(DiningAreaStatus)
  status?: DiningAreaStatus;
}
