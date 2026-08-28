import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OAuthLoginDto {
  @ApiProperty({ example: 'google', enum: ['google', 'github', 'apple'] })
  @IsNotEmpty()
  @IsString()
  provider: 'google' | 'github' | 'apple' | string;

  @ApiProperty({ example: 'owner@restaurant.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'oauth-token-or-id' })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional({ example: 'https://lh3.googleusercontent.com/a/...' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
