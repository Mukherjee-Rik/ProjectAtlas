import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Public Orders')
@Controller({ path: 'public/tables/:token/orders', version: '1' })
export class PublicOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create an order from the active table cart' })
  async createOrder(@Param('token') token: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrderFromCart(token, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders placed in the current table session' })
  async getCustomerOrders(@Param('token') token: string) {
    return this.ordersService.getCustomerOrders(token);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get details of a specific order in the current session' })
  async getCustomerOrderById(
    @Param('token') token: string,
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.getCustomerOrderById(token, orderId);
  }
}
