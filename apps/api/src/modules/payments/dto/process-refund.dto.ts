import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class ProcessRefundDto {
  @ApiProperty({
    example: 250.0,
    description:
      'Amount to refund (must be > 0 and <= total paid minus previous refunds)',
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: 'Customer complained about quality of paneer',
    description: 'Reason for refund',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    example: 'Refund approved by Manager on shift.',
    description: 'Additional notes for record keeping',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
