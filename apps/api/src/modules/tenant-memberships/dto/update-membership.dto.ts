import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { UserRole } from '../../../generated/prisma/enums';

export class UpdateMembershipDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.ADMIN,
    description: 'Updated role of the user within this tenant',
  })
  @IsEnum(UserRole)
  role: UserRole;
}
