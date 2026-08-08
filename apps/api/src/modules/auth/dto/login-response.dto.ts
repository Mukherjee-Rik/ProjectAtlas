import { ApiProperty } from '@nestjs/swagger';

export class LoginUserResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    example: 'Rik Mukherjee',
  })
  name: string;

  @ApiProperty({
    example: 'rik@example.com',
  })
  email: string;

  @ApiProperty({
    example: '9876543210',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    example: 'USER',
    enum: ['USER', 'ADMIN'],
  })
  role: string;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  })
  status: string;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    type: LoginUserResponseDto,
  })
  user: LoginUserResponseDto;
}