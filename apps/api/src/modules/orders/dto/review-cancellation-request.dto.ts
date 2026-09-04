import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
} from 'class-validator';

export class ReviewCancellationRequestDto {
  @ApiProperty({
    enum: ['APPROVE', 'REJECT'],
    example: 'APPROVE',
    description:
      'Review action: APPROVE to cancel and optionally refund, REJECT to deny request',
  })
  @IsNotEmpty()
  @IsIn(['APPROVE', 'REJECT'])
  action: 'APPROVE' | 'REJECT';

  @ApiPropertyOptional({
    example: 'Food is already plated and served.',
    description:
      'Reason for rejecting cancellation request (required if action is REJECT)',
  })
  @ValidateIf((o) => o.action === 'REJECT')
  @IsNotEmpty({
    message: 'Rejection reason is required when rejecting a request',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiPropertyOptional({
    example: 1250,
    description:
      'Optional refund amount to process immediately on approval (if paid)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  refundAmount?: number;
}
