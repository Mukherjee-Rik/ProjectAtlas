import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { TableStatus } from '../../../generated/prisma/enums';

export class CreateTableDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the target dining area',
  })
  @IsUUID()
  diningAreaId: string;

  @ApiProperty({
    example: 'Table 1',
    description: 'Name of the table',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'T01',
    description: 'Unique table code within this dining area',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'Code can only contain alphanumeric characters and hyphens',
  })
  code: string;

  @ApiProperty({
    example: 4,
    description: 'Seating capacity (1 to 50)',
  })
  @IsInt()
  @Min(1)
  @Max(50)
  capacity: number;

  @ApiPropertyOptional({
    enum: TableStatus,
    example: TableStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}
