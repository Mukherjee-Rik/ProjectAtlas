import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: 'chl_a8f3b2c1' })
  @IsNotEmpty()
  @IsString()
  challengeId: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: 'chl_a8f3b2c1' })
  @IsNotEmpty()
  @IsString()
  challengeId: string;
}
