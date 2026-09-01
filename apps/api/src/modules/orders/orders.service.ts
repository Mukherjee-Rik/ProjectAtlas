import crypto from 'node:crypto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { OrderStatus, CancellationRequestStatus } from '../../generated/prisma/enums';
import { PublicTablesService } from '../public-tables/public-tables.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateCancellationRequestDto } from './dto/cancellation-request.dto';
import { ReviewCancellationRequestDto } from './dto/review-cancellation-request.dto';
import { AddExtraChargeDto } from './dto/add-extra-charge.dto';
import { DeliveryEventsService } from '../delivery/services/delivery-events.service';
import { InventoryService } from '../inventory/inventory.service';
import { AuditService } from '../audit/audit.service';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SERVED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.SERVED, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY, OrderStatus.SERVED, OrderStatus.CANCELLED],
  READY: [OrderStatus.SERVED, OrderStatus.CANCELLED],
  SERVED: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  COMPLETED: [OrderStatus.CANCELLED],
  CANCELLED: [],
};

const ORDER_SELECT_FULL = {
  id: true,
  restaurantId: true,
  branchId: true,
  tableId: true,
  customerSessionId: true,
  orderNumber: true,
  status: true,
  source: true,
  subtotal: true,
  taxAmount: true,
  discountAmount: true,
  totalAmount: true,
  cancelledAt: true,
  cancelledBy: true,
  cancellationReason: true,
  cancellationNote: true,
  createdAt: true,
  updatedAt: true,
  table: { select: { id: true, name: true, code: true } },
  branch: { select: { id: true, name: true, code: true } },
  payments: {
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      paidAt: true,
      transactionReference: true,
    },
  },
  cancellationRequests: {
    select: {
      id: true,
      reason: true,
      note: true,
      status: true,
      requestedBy: true,
      requestedByName: true,
      reviewedBy: true,
      reviewedByName: true,
      reviewedAt: true,
      rejectionReason: true,
      createdAt: true,
    },
  },
  refunds: {
    select: {
      id: true,
      amount: true,
      reason: true,
      note: true,
      status: true,
      requestedBy: true,
      approvedBy: true,
      processedAt: true,
      createdAt: true,
    },
  },
  items: {
    orderBy: { id: 'asc' as const },
    select: {
      id: true,
      menuItemId: true,
      name: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      taxAmount: true,
      variants: { select: { id: true, variantId: true, name: true, price: true } },
      addons: { select: { id: true, addonId: true, name: true, price: true } },
    },
  },
};

type DbOrderPayload = Prisma.OrderGetPayload<{ select: typeof ORDER_SELECT_FULL }>;

/** Covers a busy service period without loading a restaurant's whole history. */
const DEFAULT_ORDERS_PAGE_SIZE = 50;
const MAX_ORDERS_PAGE_SIZE = 200;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicTablesService: PublicTablesService,
    private readonly deliveryEvents: DeliveryEventsService,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
  ) {}

  validateStatusTransition(currentStatus: OrderStatus, nextStatus: OrderStatus) {
    if (currentStatus === nextStatus) return;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot change order status from ${currentStatus} to ${nextStatus}`,
      );
    }
  }

  async createOrderFromCart(token: string, _dto?: CreateOrderDto) {
    const { session, resolved } = await this.publicTablesService.getOrCreateSessionRecord(token);

    // Anti-Spoofing: Prevent placing new orders on a settled / completed table session
    const existingOrders = await this.prisma.order.findMany({
      where: { customerSessionId: session.id },
      select: { id: true, status: true },
    });
    const hasOnlyCompletedOrders =
      existingOrders.length > 0 &&
      existingOrders.every((o) => o.status === 'COMPLETED' || o.status === 'CANCELLED');

    if (hasOnlyCompletedOrders) {
      throw new ForbiddenException(
        'This dining session has ended and been settled. Please scan the QR code at your table to start a new dining session.',
      );
    }

    const cart = await this.prisma.cart.findUnique({
      where: { customerSessionId: session.id },
      include: {
        items: {
          include: {
            variantSelections: true,
            addonSelections: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Execute order creation in an isolated Prisma transaction (3.26.12)
    return this.prisma.$transaction(async (tx) => {
      let subtotalAcc = new Prisma.Decimal(0);
      let taxAcc = new Prisma.Decimal(0);

      const itemCreations: {
        menuItemId: string;
        name: string;
        quantity: number;
        unitPrice: Prisma.Decimal;
        totalPrice: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        variants: { variantId: string | null; name: string; price: Prisma.Decimal }[];
        addons: { addonId: string | null; name: string; price: Prisma.Decimal }[];
      }[] = [];

      for (const cartItem of cart.items) {
        // Re-validate menu item availability & pricing against active DB records (3.26.14)
        const menuItem = await tx.menuItem.findFirst({
          where: {
            id: cartItem.menuItemId,
            status: 'ACTIVE',
            category: { status: 'ACTIVE', menu: { restaurantId: resolved.restaurant.id, status: 'ACTIVE' } },
          },
          include: {
            taxRate: true,
            variantGroups: { include: { variants: true } },
            addonGroups: { include: { addons: true } },
          },
        });

        if (!menuItem) {
          throw new BadRequestException(`Item in cart is no longer available`);
        }

        let unitPrice = new Prisma.Decimal(menuItem.price);
        const variantSnapshots: { variantId: string | null; name: string; price: Prisma.Decimal }[] = [];
        const addonSnapshots: { addonId: string | null; name: string; price: Prisma.Decimal }[] = [];

        // Validate & snapshot variants
        for (const vSel of cartItem.variantSelections) {
          const variant = menuItem.variantGroups
            .flatMap((g) => g.variants)
            .find((v) => v.id === vSel.variantId && v.status === 'ACTIVE');

          if (!variant) {
            throw new BadRequestException(`Selected variant "${vSel.name}" is no longer available`);
          }

          const vPrice = new Prisma.Decimal(variant.price);
          unitPrice = unitPrice.add(vPrice);
          variantSnapshots.push({
            variantId: variant.id,
            name: variant.name,
            price: vPrice,
          });
        }

        // Validate & snapshot addons
        for (const aSel of cartItem.addonSelections) {
          const addon = menuItem.addonGroups
            .flatMap((g) => g.addons)
            .find((a) => a.id === aSel.addonId && a.status === 'ACTIVE');

          if (!addon) {
            throw new BadRequestException(`Selected add-on "${aSel.name}" is no longer available`);
          }

          const aPrice = new Prisma.Decimal(addon.price);
          unitPrice = unitPrice.add(aPrice);
          addonSnapshots.push({
            addonId: addon.id,
            name: addon.name,
            price: aPrice,
          });
        }

        const quantity = cartItem.quantity;
        const lineTotalPrice = unitPrice.mul(quantity);
        subtotalAcc = subtotalAcc.add(lineTotalPrice);

        // Tax calculation per item (3.26.15)
        let itemTaxAmount = new Prisma.Decimal(0);
        if (menuItem.taxRate && menuItem.taxRate.status === 'ACTIVE') {
          if (menuItem.taxRate.type === 'PERCENTAGE') {
            itemTaxAmount = lineTotalPrice.mul(menuItem.taxRate.value).div(100);
          } else if (menuItem.taxRate.type === 'FIXED') {
            itemTaxAmount = new Prisma.Decimal(menuItem.taxRate.value).mul(quantity);
          }
        }
        taxAcc = taxAcc.add(itemTaxAmount);

        itemCreations.push({
          menuItemId: menuItem.id,
          name: menuItem.name,
          quantity,
          unitPrice,
          totalPrice: lineTotalPrice,
          taxAmount: itemTaxAmount,
          variants: variantSnapshots,
          addons: addonSnapshots,
        });
      }

      // Generate collision-safe sequence order number: AT-000001 per restaurant
      const orderCount = await tx.order.count({
        where: { restaurantId: resolved.restaurant.id },
      });

      let nextSeq = orderCount + 1;
      let orderNumber = `AT-${String(nextSeq).padStart(6, '0')}`;

      let existingOrder = await tx.order.findUnique({
        where: {
          restaurantId_orderNumber: {
            restaurantId: resolved.restaurant.id,
            orderNumber,
          },
        },
        select: { id: true },
      });

      while (existingOrder) {
        nextSeq++;
        orderNumber = `AT-${String(nextSeq).padStart(6, '0')}`;
        existingOrder = await tx.order.findUnique({
          where: {
            restaurantId_orderNumber: {
              restaurantId: resolved.restaurant.id,
              orderNumber,
            },
          },
          select: { id: true },
        });
      }

      const discountAmount = new Prisma.Decimal(0);
      const totalAmount = subtotalAcc.add(taxAcc).sub(discountAmount);

      // Create Order
      const order = await tx.order.create({
        data: {
          restaurantId: resolved.restaurant.id,
          branchId: resolved.branch.id,
          tableId: resolved.table.id,
          customerSessionId: session.id,
          orderNumber,
          status: OrderStatus.PENDING,
          subtotal: subtotalAcc,
          taxAmount: taxAcc,
          discountAmount,
          totalAmount,
          items: {
            create: itemCreations.map((ic) => ({
              menuItemId: ic.menuItemId,
              name: ic.name,
              quantity: ic.quantity,
              unitPrice: ic.unitPrice,
              totalPrice: ic.totalPrice,
              taxAmount: ic.taxAmount,
              variants: {
                create: ic.variants.map((v) => ({
                  variantId: v.variantId,
                  name: v.name,
                  price: v.price,
                })),
              },
              addons: {
                create: ic.addons.map((a) => ({
                  addonId: a.addonId,
                  name: a.name,
                  price: a.price,
                })),
              },
            })),
          },
        },
        select: ORDER_SELECT_FULL,
      });

      // Clear cart items after successful order creation (3.26.29)
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return this.formatOrderResponse(order);
    }, { maxWait: 25000, timeout: 35000 });
  }

  async getCustomerOrders(token: string) {
    const resolved = await this.publicTablesService.resolveTableToken(token);
    const { session } = await this.publicTablesService.getActiveSessionRecord(token);

    if (session) {
      const orders = await this.prisma.order.findMany({
        where: { customerSessionId: session.id },
        select: ORDER_SELECT_FULL,
        orderBy: { createdAt: 'desc' },
      });
      return orders.map((o) => this.formatOrderResponse(o));
    }

    // If active session was recently ended/cleared by cashier, return orders from latest session so customer sees receipt
    const recentSession = await this.prisma.customerSession.findFirst({
      where: { tableId: resolved.table.id },
      orderBy: { startedAt: 'desc' },
      select: { id: true },
    });

    if (recentSession) {
      const orders = await this.prisma.order.findMany({
        where: { customerSessionId: recentSession.id },
        select: ORDER_SELECT_FULL,
        orderBy: { createdAt: 'desc' },
      });
      return orders.map((o) => this.formatOrderResponse(o));
    }

    return [];
  }

  async getCustomerOrderById(token: string, orderId: string) {
    const resolved = await this.publicTablesService.resolveTableToken(token);

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        tableId: resolved.table.id,
      },
      select: ORDER_SELECT_FULL,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrderResponse(order);
  }

  async findRestaurantOrders(
    restaurantId: string,
    branchId?: string,
    status?: OrderStatus,
    page = 1,
    limit = DEFAULT_ORDERS_PAGE_SIZE,
  ) {
    // This list used to be unbounded: every order the restaurant had ever
    // taken, each with six nested relations. It got measurably slower every
    // day of trading, so it is paginated now.
    const safeLimit = Math.min(Math.max(Math.trunc(limit) || DEFAULT_ORDERS_PAGE_SIZE, 1), MAX_ORDERS_PAGE_SIZE);
    const safePage = Math.max(Math.trunc(page) || 1, 1);

    const where = {
      restaurantId,
      ...(branchId && { branchId }),
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        // ORDER_SELECT_FULL pulls six relations. Without a join strategy
        // Prisma issues one query per relation, and each is a round trip to
        // another region.
        relationLoadStrategy: 'join',
        select: ORDER_SELECT_FULL,
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((o) => this.formatOrderResponse(o)),
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
      },
    };
  }

  async findRestaurantOrderById(id: string, restaurantId: string, branchId?: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        restaurantId,
        ...(branchId && { branchId }),
      },
      select: ORDER_SELECT_FULL,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrderResponse(order);
  }

  async updateOrderStatus(id: string, restaurantId: string, dto: UpdateOrderStatusDto, branchId?: string) {
    const existing = await this.prisma.order.findFirst({
      where: {
        id,
        restaurantId,
        ...(branchId && { branchId }),
      },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new ForbiddenException('Order not found or does not belong to active restaurant');
    }

    this.validateStatusTransition(existing.status, dto.status);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      select: ORDER_SELECT_FULL,
    });

    // V2 FEATURE - Automated Inventory Engine Stock Deductions / Returns (Commented out for V1)
    /*
    if (
      dto.status === OrderStatus.CONFIRMED ||
      dto.status === OrderStatus.PREPARING ||
      dto.status === OrderStatus.SERVED
    ) {
      await this.inventoryService.deductStockForOrder(updated.id);
    } else if (dto.status === OrderStatus.CANCELLED) {
      await this.inventoryService.restoreStockForOrder(updated.id);
    }
    */

    // Emit reactive state sync event to delivery adapters
    this.deliveryEvents.emitOrderStatusUpdated(updated.id, updated.status, updated.restaurantId);

    return this.formatOrderResponse(updated);
  }

  async cancelOrder(
    id: string,
    restaurantId: string,
    user: { id: string; name?: string; email?: string; role: string },
    dto: CancelOrderDto,
    branchId?: string,
  ) {
    const existing = await this.prisma.order.findFirst({
      where: {
        id,
        restaurantId,
        ...(branchId && { branchId }),
      },
      include: {
        payments: true,
        cancellationRequests: { where: { status: 'PENDING_REVIEW' } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Order not found or does not belong to active restaurant');
    }

    if (existing.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    // Role-based financial validation
    const hasSuccessfulPayment = existing.payments.some(
      (p) => p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED',
    );

    const isWaiter = user.role === 'WAITER' || user.role === 'STAFF';
    const isPrivileged = ['CASHIER', 'MANAGER', 'ADMIN', 'OWNER', 'PLATFORM_ADMIN'].includes(user.role);

    if (hasSuccessfulPayment && isWaiter && !isPrivileged) {
      throw new BadRequestException(
        'Paid orders cannot be directly cancelled by Waiters. Please submit a Cancellation Request for Cashier/Manager approval.',
      );
    }

    if (
      existing.status === OrderStatus.COMPLETED &&
      !['MANAGER', 'ADMIN', 'OWNER', 'PLATFORM_ADMIN'].includes(user.role)
    ) {
      throw new ForbiddenException('Only Managers or Admins can cancel a completed order.');
    }

    const cancelledByLabel = user.name || user.email || `User (${user.id})`;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (existing.cancellationRequests.length > 0) {
        await tx.cancellationRequest.updateMany({
          where: { orderId: existing.id, status: 'PENDING_REVIEW' },
          data: {
            status: 'APPROVED',
            reviewedBy: user.id,
            reviewedByName: cancelledByLabel,
            reviewedAt: new Date(),
          },
        });
      }

      const orderUpdated = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: cancelledByLabel,
          cancellationReason: dto.reason,
          cancellationNote: dto.note || null,
        },
        select: ORDER_SELECT_FULL,
      });

      return orderUpdated;
    });

    // Record audit log
    await this.auditService.log({
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'ORDER_CANCELLED',
      resourceType: 'ORDER',
      resourceId: updated.id,
      restaurantId,
      metadata: {
        orderNumber: updated.orderNumber,
        reason: dto.reason,
        note: dto.note,
        userRole: user.role,
        hadPaid: hasSuccessfulPayment,
      },
    });

    this.deliveryEvents.emitOrderStatusUpdated(updated.id, updated.status, updated.restaurantId);

    return this.formatOrderResponse(updated);
  }

  async createCancellationRequest(
    id: string,
    restaurantId: string,
    user: { id: string; name?: string; email?: string; role: string },
    dto: CreateCancellationRequestDto,
    branchId?: string,
  ) {
    const existing = await this.prisma.order.findFirst({
      where: {
        id,
        restaurantId,
        ...(branchId && { branchId }),
      },
      include: {
        cancellationRequests: { where: { status: 'PENDING_REVIEW' } },
        payments: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Order not found or does not belong to active restaurant');
    }

    if (existing.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    if (existing.cancellationRequests.length > 0) {
      throw new BadRequestException('A cancellation request is already pending review for this order');
    }

    const requesterName = user.name || user.email || 'Staff';

    const req = await this.prisma.cancellationRequest.create({
      data: {
        restaurantId,
        orderId: existing.id,
        requestedBy: user.id,
        requestedByName: requesterName,
        reason: dto.reason,
        note: dto.note || null,
        status: 'PENDING_REVIEW',
      },
      include: {
        order: { select: ORDER_SELECT_FULL },
      },
    });

    // Create in-app Notification for Cashiers/Managers
    await this.prisma.notification.create({
      data: {
        restaurantId,
        title: `Cancellation Request: ${existing.orderNumber}`,
        message: `${requesterName} requested cancellation for Order #${existing.orderNumber} (Reason: ${dto.reason})`,
        type: 'ALERT',
        metadata: { orderId: existing.id, requestId: req.id },
      },
    });

    // Audit log
    await this.auditService.log({
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'ORDER_CANCEL_REQUESTED',
      resourceType: 'ORDER',
      resourceId: existing.id,
      restaurantId,
      metadata: {
        orderNumber: existing.orderNumber,
        requestId: req.id,
        reason: dto.reason,
        note: dto.note,
      },
    });

    return {
      id: req.id,
      orderId: req.orderId,
      restaurantId: req.restaurantId,
      reason: req.reason,
      note: req.note,
      status: req.status,
      requestedBy: req.requestedBy,
      requestedByName: req.requestedByName,
      createdAt: req.createdAt,
      order: this.formatOrderResponse(req.order),
    };
  }

  async findCancellationRequests(
    restaurantId: string,
    status?: CancellationRequestStatus,
    branchId?: string,
  ) {
    const requests = await this.prisma.cancellationRequest.findMany({
      where: {
        restaurantId,
        ...(status && { status }),
        ...(branchId && { order: { branchId } }),
      },
      include: {
        order: { select: ORDER_SELECT_FULL },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((req) => ({
      id: req.id,
      orderId: req.orderId,
      restaurantId: req.restaurantId,
      reason: req.reason,
      note: req.note,
      status: req.status,
      requestedBy: req.requestedBy,
      requestedByName: req.requestedByName,
      reviewedBy: req.reviewedBy,
      reviewedByName: req.reviewedByName,
      reviewedAt: req.reviewedAt,
      rejectionReason: req.rejectionReason,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
      order: this.formatOrderResponse(req.order),
    }));
  }

  async reviewCancellationRequest(
    requestId: string,
    restaurantId: string,
    user: { id: string; name?: string; email?: string; role: string },
    dto: ReviewCancellationRequestDto,
  ) {
    if (!['CASHIER', 'MANAGER', 'ADMIN', 'OWNER', 'PLATFORM_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Only Cashiers, Managers, or Admins can review cancellation requests.');
    }

    const req = await this.prisma.cancellationRequest.findFirst({
      where: { id: requestId, restaurantId },
      include: {
        order: {
          include: {
            payments: { where: { status: 'SUCCESS' } },
            invoice: true,
          },
        },
      },
    });

    if (!req) {
      throw new NotFoundException('Cancellation request not found');
    }

    if (req.status !== 'PENDING_REVIEW') {
      throw new BadRequestException(`Request has already been reviewed (status: ${req.status})`);
    }

    const reviewerName = user.name || user.email || `Staff (${user.id})`;

    if (dto.action === 'REJECT') {
      const rejected = await this.prisma.cancellationRequest.update({
        where: { id: req.id },
        data: {
          status: 'REJECTED',
          reviewedBy: user.id,
          reviewedByName: reviewerName,
          reviewedAt: new Date(),
          rejectionReason: dto.rejectionReason,
        },
      });

      await this.auditService.log({
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'ORDER_CANCEL_REJECTED',
        resourceType: 'ORDER',
        resourceId: req.orderId,
        restaurantId,
        metadata: {
          requestId: req.id,
          rejectionReason: dto.rejectionReason,
        },
      });

      return {
        id: rejected.id,
        status: rejected.status,
        rejectionReason: rejected.rejectionReason,
        reviewedBy: rejected.reviewedBy,
        reviewedByName: rejected.reviewedByName,
        reviewedAt: rejected.reviewedAt,
      };
    }

    // APPROVE flow
    return this.prisma.$transaction(async (tx) => {
      // 1. Mark request APPROVED
      await tx.cancellationRequest.update({
        where: { id: req.id },
        data: {
          status: 'APPROVED',
          reviewedBy: user.id,
          reviewedByName: reviewerName,
          reviewedAt: new Date(),
        },
      });

      // 2. Mark order CANCELLED
      const orderUpdated = await tx.order.update({
        where: { id: req.orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: reviewerName,
          cancellationReason: req.reason,
          cancellationNote: req.note || null,
        },
        select: ORDER_SELECT_FULL,
      });

      // 3. If refund amount requested and order has paid payments, process refund
      if (dto.refundAmount && dto.refundAmount > 0 && req.order.payments.length > 0) {
        const payment = req.order.payments[0];
        const refundAmt = Math.min(dto.refundAmount, Number(payment.amount));
        const isFull = refundAmt >= Number(payment.amount);

        await tx.refund.create({
          data: {
            restaurantId,
            orderId: req.orderId,
            paymentId: payment.id,
            amount: new Prisma.Decimal(refundAmt),
            reason: req.reason,
            note: req.note || 'Refund generated from approved cancellation request',
            status: 'SUCCESS',
            requestedBy: req.requestedBy,
            approvedBy: reviewerName,
            processedAt: new Date(),
            providerRefundId: `RFND-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          },
        });

        await tx.payment.update({
          where: { id: payment.id },
          data: { status: isFull ? 'REFUNDED' : 'PARTIALLY_REFUNDED' },
        });

        if (req.order.invoice) {
          await tx.invoice.update({
            where: { id: req.order.invoice.id },
            data: { isSettled: !isFull },
          });
        }
      }

      await this.auditService.log({
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'ORDER_CANCEL_APPROVED',
        resourceType: 'ORDER',
        resourceId: req.orderId,
        restaurantId,
        metadata: {
          requestId: req.id,
          refundAmount: dto.refundAmount,
        },
      });

      this.deliveryEvents.emitOrderStatusUpdated(orderUpdated.id, orderUpdated.status, orderUpdated.restaurantId);

      return {
        id: req.id,
        status: 'APPROVED',
        reviewedBy: user.id,
        reviewedByName: reviewerName,
        reviewedAt: new Date(),
        order: this.formatOrderResponse(orderUpdated),
      };
    });
  }

  async addExtraCharge(
    restaurantId: string,
    user: any,
    dto: AddExtraChargeDto,
    branchId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      let targetOrder: any = null;

      if (dto.orderId) {
        targetOrder = await tx.order.findFirst({
          where: {
            id: dto.orderId,
            restaurantId,
            ...(branchId && { branchId }),
          },
          include: { items: true, table: true, branch: true },
        });

        if (!targetOrder) {
          throw new NotFoundException('Target order not found');
        }
      } else if (dto.tableId) {
        const table = await tx.table.findFirst({
          where: {
            id: dto.tableId,
            diningArea: { branch: { restaurantId, ...(branchId && { id: branchId }) } },
          },
          include: {
            diningArea: { include: { branch: true } },
          },
        });

        if (!table) {
          throw new NotFoundException('Table not found in active restaurant/branch');
        }

        // Find active customer session for table
        let session = await tx.customerSession.findFirst({
          where: { tableId: table.id, status: 'ACTIVE' },
          orderBy: { startedAt: 'desc' },
        });

        if (!session) {
          const sessionToken = `cs_${crypto.randomUUID().replace(/-/g, '')}`;
          session = await tx.customerSession.create({
            data: {
              tableId: table.id,
              sessionToken,
              status: 'ACTIVE',
            },
          });
        }

        // Check if there is an active (unpaid) order for this session
        targetOrder = await tx.order.findFirst({
          where: {
            customerSessionId: session.id,
            status: { notIn: [OrderStatus.CANCELLED] },
          },
          orderBy: { createdAt: 'desc' },
          include: { items: true, table: true, branch: true },
        });

        // If no active order exists, create a new manual order for this table
        if (!targetOrder) {
          const orderCount = await tx.order.count({
            where: { restaurantId },
          });

          let nextSeq = orderCount + 1;
          let orderNumber = `AT-${String(nextSeq).padStart(6, '0')}`;

          let existingOrder = await tx.order.findUnique({
            where: {
              restaurantId_orderNumber: {
                restaurantId,
                orderNumber,
              },
            },
            select: { id: true },
          });

          while (existingOrder) {
            nextSeq++;
            orderNumber = `AT-${String(nextSeq).padStart(6, '0')}`;
            existingOrder = await tx.order.findUnique({
              where: {
                restaurantId_orderNumber: {
                  restaurantId,
                  orderNumber,
                },
              },
              select: { id: true },
            });
          }

          targetOrder = await tx.order.create({
            data: {
              restaurantId,
              branchId: table.diningArea.branchId,
              tableId: table.id,
              customerSessionId: session.id,
              orderNumber,
              status: OrderStatus.SERVED,
              source: 'DIRECT',
              subtotal: new Prisma.Decimal(0),
              taxAmount: new Prisma.Decimal(0),
              discountAmount: new Prisma.Decimal(0),
              totalAmount: new Prisma.Decimal(0),
            },
            include: { items: true, table: true, branch: true },
          });
        }
      } else {
        throw new BadRequestException('Either orderId or tableId must be provided');
      }

      // Resolve valid MenuItem ID for foreign key constraint
      let resolvedMenuItemId = dto.menuItemId;
      if (resolvedMenuItemId) {
        const itemExists = await tx.menuItem.findFirst({
          where: { id: resolvedMenuItemId, category: { menu: { restaurantId } } },
          select: { id: true },
        });
        if (!itemExists) resolvedMenuItemId = undefined;
      }

      if (!resolvedMenuItemId) {
        const fallbackItem = await tx.menuItem.findFirst({
          where: { category: { menu: { restaurantId, status: 'ACTIVE' } } },
          select: { id: true },
        });

        if (fallbackItem) {
          resolvedMenuItemId = fallbackItem.id;
        } else {
          let menu = await tx.menu.findFirst({ where: { restaurantId } });
          if (!menu) {
            menu = await tx.menu.create({
              data: { restaurantId, name: 'Default Menu', code: 'DEF_MENU' },
            });
          }
          let category = await tx.menuCategory.findFirst({ where: { menuId: menu.id } });
          if (!category) {
            category = await tx.menuCategory.create({
              data: { menuId: menu.id, name: 'General', code: 'GEN_CAT' },
            });
          }
          let menuItem = await tx.menuItem.findFirst({ where: { categoryId: category.id } });
          if (!menuItem) {
            menuItem = await tx.menuItem.create({
              data: {
                categoryId: category.id,
                name: 'Custom Extra Item',
                code: 'MISC_EXTRA',
                price: new Prisma.Decimal(dto.amount),
              },
            });
          }
          resolvedMenuItemId = menuItem.id;
        }
      }

      const quantity = Math.max(1, dto.quantity || 1);
      const unitPrice = new Prisma.Decimal(dto.amount);
      const totalPrice = unitPrice.mul(quantity);

      // Create line item under target order with reason/notes
      const addonNotes: { name: string; price: Prisma.Decimal }[] = [];
      if (dto.reason || dto.notes) {
        const label = [dto.reason, dto.notes].filter(Boolean).join(' - ');
        addonNotes.push({
          name: `Reason: ${label}`,
          price: new Prisma.Decimal(0),
        });
      }

      await tx.orderItem.create({
        data: {
          orderId: targetOrder.id,
          menuItemId: resolvedMenuItemId,
          name: dto.name || dto.reason || 'Extra Charge',
          quantity,
          unitPrice,
          totalPrice,
          taxAmount: new Prisma.Decimal(0),
          addons: {
            create: addonNotes.map((an) => ({
              name: an.name,
              price: an.price,
            })),
          },
        },
      });

      // Recalculate order subtotal and totalAmount
      const allItems = await tx.orderItem.findMany({
        where: { orderId: targetOrder.id },
      });

      const newSubtotal = allItems.reduce(
        (acc, it) => acc.add(new Prisma.Decimal(it.totalPrice)),
        new Prisma.Decimal(0),
      );
      const newTotal = newSubtotal
        .add(new Prisma.Decimal(targetOrder.taxAmount || 0))
        .sub(new Prisma.Decimal(targetOrder.discountAmount || 0));

      const updatedOrder = await tx.order.update({
        where: { id: targetOrder.id },
        data: {
          subtotal: newSubtotal,
          totalAmount: newTotal,
        },
        select: ORDER_SELECT_FULL,
      });

      // Audit Log
      await this.auditService.log({
        actorUserId: user?.id,
        actorEmail: user?.email,
        action: 'ORDER_EXTRA_CHARGE_ADDED',
        resourceType: 'ORDER',
        resourceId: targetOrder.id,
        restaurantId,
        metadata: {
          orderNumber: targetOrder.orderNumber,
          chargeName: dto.name,
          amount: dto.amount,
          quantity,
          reason: dto.reason,
          notes: dto.notes,
          addedBy: user?.name || user?.email,
        },
      });

      return this.formatOrderResponse(updatedOrder);
    });
  }

  private formatOrderResponse(order: DbOrderPayload) {
    return {
      id: order.id,
      restaurantId: order.restaurantId,
      branchId: order.branchId,
      tableId: order.tableId,
      customerSessionId: order.customerSessionId,
      orderNumber: order.orderNumber,
      status: order.status,
      source: order.source,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      cancelledAt: order.cancelledAt,
      cancelledBy: order.cancelledBy,
      cancellationReason: order.cancellationReason,
      cancellationNote: order.cancellationNote,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      table: order.table ? { id: order.table.id, name: order.table.name, code: order.table.code } : null,
      branch: order.branch ? { id: order.branch.id, name: order.branch.name, code: order.branch.code } : null,
      payments: (order.payments || []).map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
        paidAt: p.paidAt,
        transactionReference: p.transactionReference,
      })),
      cancellationRequests: (order.cancellationRequests || []).map((cr) => ({
        id: cr.id,
        reason: cr.reason,
        note: cr.note,
        status: cr.status,
        requestedBy: cr.requestedBy,
        requestedByName: cr.requestedByName,
        reviewedBy: cr.reviewedBy,
        reviewedByName: cr.reviewedByName,
        reviewedAt: cr.reviewedAt,
        rejectionReason: cr.rejectionReason,
        createdAt: cr.createdAt,
      })),
      refunds: (order.refunds || []).map((rf) => ({
        id: rf.id,
        amount: Number(rf.amount),
        reason: rf.reason,
        note: rf.note,
        status: rf.status,
        requestedBy: rf.requestedBy,
        approvedBy: rf.approvedBy,
        processedAt: rf.processedAt,
        createdAt: rf.createdAt,
      })),
      items: order.items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        taxAmount: Number(item.taxAmount),
        variants: item.variants.map((v) => ({ id: v.id, variantId: v.variantId, name: v.name, price: Number(v.price) })),
        addons: item.addons.map((a) => ({ id: a.id, addonId: a.addonId, name: a.name, price: Number(a.price) })),
      })),
    };
  }
}
