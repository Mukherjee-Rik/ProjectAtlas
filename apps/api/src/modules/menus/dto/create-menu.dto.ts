import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { MenuStatus } from '../../../generated/prisma/enums';

export class CreateMenuDto {
  @ApiProperty({
    example: 'Main Menu',
    description: 'Name of the menu',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'MAIN',
    description: 'Unique menu code within this restaurant',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'Code can only contain alphanumeric characters and hyphens',
  })
  code: string;

  @ApiPropertyOptional({
    enum: MenuStatus,
    example: MenuStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(MenuStatus)
  status?: MenuStatus;
}
