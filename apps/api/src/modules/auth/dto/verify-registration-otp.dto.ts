import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyRegistrationOtpDto {
  @ApiProperty({
    example: 'reg_a8f3b2c1d4e5f6g7',
    description: 'Registration challenge ID returned from /auth/signup',
  })
  @IsNotEmpty()
  @IsString()
  challengeId: string;

  @ApiProperty({ example: '123456', description: '6-digit verification code' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;
}

export class ResendRegistrationOtpDto {
  @ApiProperty({
    example: 'reg_a8f3b2c1d4e5f6g7',
    description: 'Registration challenge ID returned from /auth/signup',
  })
  @IsNotEmpty()
  @IsString()
  challengeId: string;
}
