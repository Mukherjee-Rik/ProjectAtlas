import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddExtraChargeDto {
  @ApiPropertyOptional({
    description: 'Specific order ID to attach the extra charge to',
  })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Table ID to add the extra charge to' })
  @IsOptional()
  @IsUUID()
  tableId?: string;

  @ApiProperty({
    description:
      'Description or item name (e.g. Broken Glassware, Extra Beverage, Delivery Charge)',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Charge amount per unit in currency' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    description: 'Quantity of items / charges',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Reason category for the extra charge' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Detailed remarks or notes from cashier',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Optional menu item ID if this charge references a catalog item',
  })
  @IsOptional()
  @IsUUID()
  menuItemId?: string;
}
