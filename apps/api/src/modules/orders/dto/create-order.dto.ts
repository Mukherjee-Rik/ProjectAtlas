import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cartId?: string;
}
