import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../generated/prisma/enums';

const VALID_PAYMENT_METHODS = [
  'CASH',
  'CARD',
  'UPI_INTENT',
  'RAZORPAY',
  'STRIPE',
];

export class InitiatePaymentDto {
  @ApiProperty({ description: 'ID of the order to settle payment for' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Amount to be paid' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method used' })
  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_PAYMENT_METHODS)
  method: PaymentMethod;
}
