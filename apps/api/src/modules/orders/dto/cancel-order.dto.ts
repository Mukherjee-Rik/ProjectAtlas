import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export const CANCELLATION_REASONS = [
  'CUSTOMER_REQUESTED',
  'FOOD_QUALITY_ISSUE',
  'TOO_OILY',
  'UNHYGIENIC',
  'UNDERCOOKED_OVERCOOKED',
  'COLD_FOOD',
  'WRONG_ITEM',
  'WRONG_ORDER',
  'DUPLICATE_ORDER',
  'ITEM_UNAVAILABLE',
  'KITCHEN_ISSUE',
  'PAYMENT_ISSUE',
  'STAFF_MISTAKE',
  'TECHNICAL_ISSUE',
  'OTHER',
] as const;

export type CancellationReasonCode = (typeof CANCELLATION_REASONS)[number];

export class CancelOrderDto {
  @ApiProperty({
    enum: CANCELLATION_REASONS,
    example: 'CUSTOMER_REQUESTED',
    description: 'Predefined cancellation reason code',
  })
  @IsNotEmpty()
  @IsIn(CANCELLATION_REASONS as unknown as string[])
  reason: string;

  @ApiPropertyOptional({
    example: 'Customer had an urgent emergency and had to leave.',
    description: 'Detailed explanation note (required if reason is OTHER)',
  })
  @ValidateIf((o) => o.reason === 'OTHER')
  @IsNotEmpty({ message: 'Note is required when cancellation reason is OTHER' })
  @IsString()
  @IsOptional()
  note?: string;
}
