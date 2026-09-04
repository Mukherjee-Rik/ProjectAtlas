import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MockWebhookDto {
  @ApiProperty({ description: 'Payment status outcome (SUCCESS or FAILED)' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['SUCCESS', 'FAILED'])
  status: 'SUCCESS' | 'FAILED';

  @ApiPropertyOptional({ description: 'Optional transaction reference code' })
  @IsString()
  @IsOptional()
  transactionReference?: string;

  @ApiPropertyOptional({
    description: 'Failure explanation if status is FAILED',
  })
  @IsString()
  @IsOptional()
  failureReason?: string;
}
