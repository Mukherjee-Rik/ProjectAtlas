// Force type reload
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PaymentMethod, PaymentStatus, OrderStatus } from '../../generated/prisma/enums';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  // 1. Create a pending payment request
  async initiatePayment(dto: {
    tenantId: string;
    restaurantId: string;
    orderId: string;
    amount: number;
    method: PaymentMethod;
  }) {
    // Verify order exists
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { invoice: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Auto-generate invoice if not exists
    let invoice = order.invoice;
    if (!invoice) {
      const cgst = Number(order.taxAmount) / 2;
      const sgst = Number(order.taxAmount) / 2;
      const invoiceNumber = `INV-${order.orderNumber}`;

      invoice = await this.prisma.invoice.create({
        data: {
          tenantId: order.restaurantId, // Using restaurantId or tenantId mapping
          branchId: order.branchId,
          orderId: order.id,
          invoiceNumber,
          subtotal: order.subtotal,
          cgstAmount: cgst,
          sgstAmount: sgst,
          discountAmount: order.discountAmount,
          finalTotal: order.totalAmount,
          isSettled: false,
        },
      });
    }

    // Generate unique transaction reference
    const transactionReference = `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    return this.prisma.payment.create({
      data: {
        tenantId: dto.tenantId,
        restaurantId: dto.restaurantId,
        orderId: dto.orderId,
        invoiceId: invoice.id,
        customerSessionId: order.customerSessionId,
        amount: dto.amount,
        method: dto.method,
        status: 'PENDING',
        transactionReference,
      },
    });
  }

  // 2. Settle payment successfully
  async settlePayment(paymentId: string, transactionReference?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (payment.status === 'SUCCESS') {
      return payment;
    }

    return this.prisma.$transaction(async (tx) => {
      // Update payment record
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(),
          ...(transactionReference && { transactionReference }),
        },
      });

      // Settle invoice
      if (payment.invoiceId) {
        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: { isSettled: true },
        });
      }

      // Mark order as COMPLETED
      if (payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'COMPLETED' },
        });

        // Deduct stock for completed order
        await this.inventoryService.deductStockForOrder(payment.orderId, tx);
      }

      // If this is a table/dine-in session, check if we should end the session
      if (payment.customerSessionId) {
        // If all orders in the session are now COMPLETED, end the session
        const activeOrders = await tx.order.findMany({
          where: {
            customerSessionId: payment.customerSessionId,
            status: { not: 'COMPLETED' },
          },
        });

        if (activeOrders.length === 0) {
          await tx.customerSession.update({
            where: { id: payment.customerSessionId },
            data: {
              status: 'ENDED',
              endedAt: new Date(),
            },
          });
        }
      }

      return updatedPayment;
    });
  }

  // 3. Mark payment as failed
  async failPayment(paymentId: string, failureReason: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        failureReason,
      },
    });
  }

  // 4. Process Refund
  async refundPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (payment.status !== 'SUCCESS') {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' },
      });

      // Revert invoice status
      if (payment.invoiceId) {
        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: { isSettled: false },
        });
      }

      // Revert order status
      if (payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'CANCELLED' },
        });
      }

      return updatedPayment;
    });
  }

  // Find all payment records for a restaurant
  async findAll(restaurantId: string) {
    return this.prisma.payment.findMany({
      where: { restaurantId },
      include: {
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
