import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('Public Cart')
@Controller({ path: 'public/tables/:token/cart', version: '1' })
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get the cart for the current table session' })
  async getCart(@Param('token') token: string) {
    return this.cartService.getCart(token);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add a configured menu item to the cart' })
  async addItem(@Param('token') token: string, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(token, dto);
  }

  @Post('set-item')
  @ApiOperation({ summary: 'Set exact quantity of a menu item (idempotent)' })
  async setItemQuantity(@Param('token') token: string, @Body() dto: AddCartItemDto) {
    return this.cartService.setItemQuantity(token, dto);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update the quantity of a cart line' })
  async updateItemQuantity(
    @Param('token') token: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(token, itemId, dto);
  }

  @Post('items/:itemId')
  async updateItemQuantityPost(
    @Param('token') token: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(token, itemId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove a cart line' })
  async removeItem(@Param('token') token: string, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(token, itemId);
  }
}
