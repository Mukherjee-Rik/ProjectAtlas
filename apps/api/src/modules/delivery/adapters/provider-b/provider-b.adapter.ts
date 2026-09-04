import { Injectable, BadRequestException } from '@nestjs/common';
import {
  DeliveryProvider,
  NormalizedOrderPayload,
} from '../../interfaces/delivery-provider.interface';
import { OrderStatus } from '../../../../generated/prisma/enums';

@Injectable()
export class ProviderBAdapter implements DeliveryProvider {
  async createOrder(
    order: NormalizedOrderPayload,
    config: any,
  ): Promise<{
    externalOrderId: string;
    status: OrderStatus;
    rawResponse: any;
  }> {
    this.validateConfig(config);

    // Simulate different payload structure
    const providerRequest = {
      externalOrderId: order.externalOrderId,
      merchantId: order.restaurantId,
      lineItems: order.items.map((i) => ({
        itemId: i.menuItemId,
        quantity: i.quantity,
        price: i.price,
      })),
      customer: {
        fullName: order.customer.name,
        phoneNo: order.customer.phone,
      },
      subtotalPrice: order.subtotal,
      grandTotal: order.totalAmount,
    };

    return {
      externalOrderId: order.externalOrderId,
      status: OrderStatus.PENDING,
      rawResponse: {
        status: 'SUCCESS',
        order_meta: providerRequest,
      },
    };
  }

  async cancelOrder(
    externalOrderId: string,
    reason: string,
    config: any,
  ): Promise<{ success: boolean; rawResponse: any }> {
    this.validateConfig(config);

    return {
      success: true,
      rawResponse: {
        revokedId: externalOrderId,
        msg: 'Order cancelled on Provider B',
        reasonCode: reason,
      },
    };
  }

  async getOrderStatus(
    externalOrderId: string,
    config: any,
  ): Promise<OrderStatus> {
    this.validateConfig(config);

    return OrderStatus.PENDING;
  }

  async healthCheck(config: any): Promise<boolean> {
    try {
      this.validateConfig(config);
      return true;
    } catch {
      return false;
    }
  }

  private validateConfig(config: any) {
    if (!config || !config.apiKey || !config.apiKey.startsWith('PROV_B_')) {
      throw new BadRequestException(
        'Invalid Provider B API key or credentials configuration',
      );
    }
  }

  mapExternalStatus(status: string): OrderStatus {
    switch (status.toUpperCase()) {
      case 'ORDERED':
        return OrderStatus.PENDING;
      case 'ACCEPTED':
        return OrderStatus.CONFIRMED;
      case 'KITCHEN':
        return OrderStatus.PREPARING;
      case 'FOOD_READY':
        return OrderStatus.READY;
      case 'DISPATCHED':
        return OrderStatus.SERVED;
      case 'DELIVERED':
        return OrderStatus.COMPLETED;
      case 'REJECTED':
      case 'CANCELLED':
        return OrderStatus.CANCELLED;
      default:
        return OrderStatus.PENDING;
    }
  }

  mapInternalToExternalStatus(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'ORDERED';
      case OrderStatus.CONFIRMED:
        return 'ACCEPTED';
      case OrderStatus.PREPARING:
        return 'KITCHEN';
      case OrderStatus.READY:
        return 'FOOD_READY';
      case OrderStatus.SERVED:
        return 'DISPATCHED';
      case OrderStatus.COMPLETED:
        return 'DELIVERED';
      case OrderStatus.CANCELLED:
        return 'CANCELLED';
      default:
        return 'ORDERED';
    }
  }
}
