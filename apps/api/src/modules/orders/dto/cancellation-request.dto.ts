import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { CANCELLATION_REASONS } from './cancel-order.dto';

export class CreateCancellationRequestDto {
  @ApiProperty({
    enum: CANCELLATION_REASONS,
    example: 'CUSTOMER_REQUESTED',
    description: 'Predefined cancellation reason code',
  })
  @IsNotEmpty()
  @IsIn(CANCELLATION_REASONS)
  reason: string;

  @ApiPropertyOptional({
    example: 'Customer requested cancellation after payment was completed.',
    description: 'Detailed explanation note (required if reason is OTHER)',
  })
  @ValidateIf((o) => o.reason === 'OTHER')
  @IsNotEmpty({ message: 'Note is required when reason is OTHER' })
  @IsString()
  @IsOptional()
  note?: string;
}
