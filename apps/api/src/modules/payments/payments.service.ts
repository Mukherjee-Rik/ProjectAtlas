// Force type reload
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PaymentMethod, PaymentStatus, OrderStatus } from '../../generated/prisma/enums';
import { InventoryService } from '../inventory/inventory.service';
import { AuditService } from '../audit/audit.service';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
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
          tenantId: order.restaurantId,
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
        const activeOrders = await tx.order.findMany({
          where: {
            customerSessionId: payment.customerSessionId,
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
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

  // 4. Process Full or Partial Refund
  async refundPayment(
    paymentId: string,
    restaurantId: string,
    user: { id: string; name?: string; email?: string; role: string },
    dto: ProcessRefundDto,
  ) {
    if (!['CASHIER', 'MANAGER', 'ADMIN', 'OWNER', 'PLATFORM_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Only Cashiers, Managers, or Admins can process refunds.');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, restaurantId },
      include: {
        order: true,
        invoice: true,
        refunds: { where: { status: 'SUCCESS' } },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (payment.status !== 'SUCCESS' && payment.status !== 'PARTIALLY_REFUNDED') {
      throw new BadRequestException(`Only successful payments can be refunded (current status: ${payment.status})`);
    }

    const totalRefundedSoFar = payment.refunds.reduce((sum, r) => sum + Number(r.amount), 0);
    const remainingRefundable = Number(payment.amount) - totalRefundedSoFar;

    if (dto.amount <= 0) {
      throw new BadRequestException('Refund amount must be greater than 0');
    }

    if (dto.amount > remainingRefundable) {
      throw new BadRequestException(
        `Refund amount ₹${dto.amount} exceeds remaining refundable balance ₹${remainingRefundable.toFixed(2)}`,
      );
    }

    const approverName = user.name || user.email || `Staff (${user.id})`;
    const isFullRefund = (totalRefundedSoFar + dto.amount) >= Number(payment.amount);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Refund Record
      const refund = await tx.refund.create({
        data: {
          restaurantId,
          orderId: payment.orderId || '',
          paymentId: payment.id,
          amount: new Prisma.Decimal(dto.amount),
          reason: dto.reason,
          note: dto.note || null,
          status: 'SUCCESS',
          requestedBy: user.id,
          approvedBy: approverName,
          processedAt: new Date(),
          providerRefundId: `RFND-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        },
      });

      // 2. Update Payment Status
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        },
      });

      // 3. Update Invoice & Order if Full Refund
      if (isFullRefund) {
        if (payment.invoiceId) {
          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: { isSettled: false },
          });
        }

        if (payment.orderId) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              status: OrderStatus.CANCELLED,
              cancelledAt: new Date(),
              cancelledBy: approverName,
              cancellationReason: dto.reason,
              cancellationNote: dto.note || 'Order automatically cancelled upon full refund',
            },
          });
        }
      }

      return { refund, updatedPayment };
    });

    // Record audit log
    await this.auditService.log({
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'REFUND_PROCESSED',
      resourceType: 'PAYMENT',
      resourceId: payment.id,
      restaurantId,
      metadata: {
        refundId: result.refund.id,
        amount: dto.amount,
        isFullRefund,
        orderId: payment.orderId,
        reason: dto.reason,
        note: dto.note,
      },
    });

    return result;
  }

  // Find all payment records for a restaurant
  async findAll(restaurantId: string) {
    return this.prisma.payment.findMany({
      where: { restaurantId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            table: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Find all refund transactions for a restaurant
  async findRefunds(restaurantId: string) {
    return this.prisma.refund.findMany({
      where: { restaurantId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            table: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            transactionReference: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
