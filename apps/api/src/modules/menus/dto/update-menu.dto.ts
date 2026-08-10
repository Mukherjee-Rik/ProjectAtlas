import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { MenuStatus } from '../../../generated/prisma/enums';

export class UpdateMenuDto {
  @ApiPropertyOptional({ example: 'Summer Special Menu' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'SUMMER-01' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'Code can only contain alphanumeric characters and hyphens',
  })
  code?: string;

  @ApiPropertyOptional({ enum: MenuStatus })
  @IsOptional()
  @IsEnum(MenuStatus)
  status?: MenuStatus;
}
