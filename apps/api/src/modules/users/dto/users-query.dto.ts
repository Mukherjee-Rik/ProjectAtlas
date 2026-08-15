import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

import {
  UserRole,
  UserStatus,
} from '../../../generated/prisma/enums';

export class UsersQueryDto {
  @ApiPropertyOptional({
    example: 'john',
    description: 'Search by name, email, or phone number',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'CASHIER',
  })
  @IsOptional()
  @IsIn(['PLATFORM_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'WAITER', 'KITCHEN', 'CASHIER', 'USER'])
  role?: UserRole;

  @ApiPropertyOptional({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}
