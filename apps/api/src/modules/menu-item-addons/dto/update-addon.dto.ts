import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { MenuItemAddonStatus } from '../../../generated/prisma/enums';

export class UpdateAddonDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(100) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) position?: number;
  @ApiPropertyOptional({ enum: MenuItemAddonStatus }) @IsOptional() @IsEnum(MenuItemAddonStatus) status?: MenuItemAddonStatus;
}
