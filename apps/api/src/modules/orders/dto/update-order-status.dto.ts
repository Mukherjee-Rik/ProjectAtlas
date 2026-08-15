import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../../generated/prisma/enums';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.CONFIRMED })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
