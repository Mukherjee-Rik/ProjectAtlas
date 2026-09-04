import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { UserRole } from '../../../generated/prisma/enums';

export class UpdateMembershipDto {
  @ApiProperty({
    example: 'CASHIER',
    description: 'Updated role of the user within this tenant',
  })
  @IsIn([
    'PLATFORM_ADMIN',
    'OWNER',
    'ADMIN',
    'MANAGER',
    'STAFF',
    'WAITER',
    'KITCHEN',
    'CASHIER',
    'USER',
  ])
  role: UserRole;
}
