import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';

import { UserRole } from '../../../generated/prisma/enums';

export class CreateMembershipDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the target user',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'UUID of the target tenant',
  })
  @IsUUID()
  tenantId: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Role of the user within this tenant',
  })
  @IsEnum(UserRole)
  role: UserRole;
}
