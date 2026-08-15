import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterRestaurantDto {
  @ApiProperty({ example: 'The Spice Garden' })
  @IsString()
  @IsNotEmpty()
  restaurantName: string;

  @ApiProperty({ example: 'Rik Mukherjee' })
  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @ApiProperty({ example: 'owner@spicegarden.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(6)
  password: string;
}
