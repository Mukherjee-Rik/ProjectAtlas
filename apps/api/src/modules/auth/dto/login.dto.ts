import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
