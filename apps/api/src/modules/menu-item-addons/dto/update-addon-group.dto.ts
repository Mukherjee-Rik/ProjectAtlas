import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateAddonGroupDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) @MaxLength(100) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() required?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) minSelect?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) maxSelect?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) position?: number;
}
