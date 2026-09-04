import { Injectable, BadRequestException } from '@nestjs/common';
import {
  DeliveryProvider,
  NormalizedOrderPayload,
} from '../../interfaces/delivery-provider.interface';
import { OrderStatus } from '../../../../generated/prisma/enums';

@Injectable()
export class ProviderAAdapter implements DeliveryProvider {
  async createOrder(
    order: NormalizedOrderPayload,
    config: any,
  ): Promise<{
    externalOrderId: string;
    status: OrderStatus;
    rawResponse: any;
  }> {
    this.validateConfig(config);

    // Simulate external platform request structure mapping
    const providerRequest = {
      order_id: order.externalOrderId,
      restaurant_id: order.restaurantId,
      items: order.items.map((i) => ({
        id: i.menuItemId,
        qty: i.quantity,
        rate: i.price,
      })),
      buyer: {
        name: order.customer.name,
        contact: order.customer.phone,
      },
      grand_total: order.totalAmount,
    };

    // Simulate calling the external endpoint
    return {
      externalOrderId: order.externalOrderId,
      status: OrderStatus.PENDING,
      rawResponse: {
        success: true,
        message: 'Order received by Provider A',
        payload: providerRequest,
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
        cancelled_id: externalOrderId,
        reason,
        status: 'CANCELLED_BY_MERCHANT',
      },
    };
  }

  async getOrderStatus(
    externalOrderId: string,
    config: any,
  ): Promise<OrderStatus> {
    this.validateConfig(config);

    // Mock query database/platform state
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
    if (!config || !config.apiKey || !config.apiKey.startsWith('PROV_A_')) {
      throw new BadRequestException(
        'Invalid Provider A API key or configuration credentials',
      );
    }
  }

  // Maps external raw status to Atlas canonical OrderStatus
  mapExternalStatus(status: string): OrderStatus {
    switch (status.toUpperCase()) {
      case 'PLACED':
        return OrderStatus.PENDING;
      case 'ACCEPTED':
        return OrderStatus.CONFIRMED;
      case 'PREPARING':
        return OrderStatus.PREPARING;
      case 'READY':
      case 'FOOD_READY':
        return OrderStatus.READY;
      case 'PICKED_UP':
        return OrderStatus.SERVED; // Map served as picked up
      case 'COMPLETED':
      case 'DELIVERED':
        return OrderStatus.COMPLETED;
      case 'CANCELLED':
        return OrderStatus.CANCELLED;
      default:
        return OrderStatus.PENDING;
    }
  }

  // Maps internal OrderStatus back to Provider A external status
  mapInternalToExternalStatus(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'PLACED';
      case OrderStatus.CONFIRMED:
        return 'ACCEPTED';
      case OrderStatus.PREPARING:
        return 'PREPARING';
      case OrderStatus.READY:
        return 'FOOD_READY';
      case OrderStatus.SERVED:
        return 'PICKED_UP';
      case OrderStatus.COMPLETED:
        return 'DELIVERED';
      case OrderStatus.CANCELLED:
        return 'CANCELLED';
      default:
        return 'PLACED';
    }
  }
}
