import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'owner@kafei.in or 9903085026',
    description: 'User registered email or phone number',
  })
  @IsNotEmpty()
  @IsString()
  identifier: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'chl_a8f3b2c1',
    description: 'Challenge ID received during forgot-password request',
  })
  @IsNotEmpty()
  @IsString()
  challengeId: string;

  @ApiProperty({ example: '123456', description: '6-digit verification code' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'New password (min 8 characters)',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class ResendResetOtpDto {
  @ApiProperty({
    example: 'chl_a8f3b2c1',
    description: 'Challenge ID to resend verification OTP for',
  })
  @IsNotEmpty()
  @IsString()
  challengeId: string;
}
