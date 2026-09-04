import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMyProfileDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Updated full name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: '+919876543210',
    description: 'Updated phone number. Send null to clear it.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;
}
