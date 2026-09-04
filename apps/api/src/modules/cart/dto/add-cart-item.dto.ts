import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ example: '8f14e45f-ea0b-4c9a-9d1f-1c2f6a3b4c5d' })
  @IsUUID()
  menuItemId: string;
  @ApiPropertyOptional({ example: 2, minimum: 1, maximum: 99, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  quantity?: number;
  @ApiPropertyOptional({
    type: [String],
    description: 'One variant per variant group',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  variantIds?: string[];
  @ApiPropertyOptional({
    type: [String],
    description: 'Add-ons within each group min/max limits',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  addonIds?: string[];
}
