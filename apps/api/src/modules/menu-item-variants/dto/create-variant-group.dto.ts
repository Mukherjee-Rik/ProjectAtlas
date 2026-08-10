import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateVariantGroupDto {
  @ApiProperty({ example: 'Size' }) @IsString() @MinLength(2) @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ example: 0 }) @IsOptional() @IsInt() @Min(0)
  position?: number;
}
