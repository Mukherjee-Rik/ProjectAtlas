import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { OrderStatus } from '../../generated/prisma/enums';
import { PublicTablesService } from '../public-tables/public-tables.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { DeliveryEventsService } from '../delivery/services/delivery-events.service';
import { InventoryService } from '../inventory/inventory.service';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SERVED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.SERVED, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY, OrderStatus.SERVED],
  READY: [OrderStatus.SERVED],
  SERVED: [OrderStatus.COMPLETED],
  COMPLETED: [],
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
  createdAt: true,
  updatedAt: true,
  table: { select: { id: true, name: true, code: true } },
  branch: { select: { id: true, name: true, code: true } },
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

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicTablesService: PublicTablesService,
    private readonly deliveryEvents: DeliveryEventsService,
    private readonly inventoryService: InventoryService,
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

      // Generate sequence order number: AT-000001 per restaurant
      const lastOrder = await tx.order.findFirst({
        where: { restaurantId: resolved.restaurant.id },
        orderBy: { createdAt: 'desc' },
        select: { orderNumber: true },
      });

      let nextSeq = 1;
      if (lastOrder && lastOrder.orderNumber) {
        const match = lastOrder.orderNumber.match(/\d+/);
        if (match) {
          nextSeq = parseInt(match[0], 10) + 1;
        }
      }
      const orderNumber = `AT-${String(nextSeq).padStart(6, '0')}`;

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
    const { session } = await this.publicTablesService.getOrCreateSessionRecord(token);

    const orders = await this.prisma.order.findMany({
      where: { customerSessionId: session.id },
      select: ORDER_SELECT_FULL,
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => this.formatOrderResponse(o));
  }

  async getCustomerOrderById(token: string, orderId: string) {
    const { session } = await this.publicTablesService.getOrCreateSessionRecord(token);

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerSessionId: session.id },
      select: ORDER_SELECT_FULL,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrderResponse(order);
  }

  async findRestaurantOrders(restaurantId: string, branchId?: string, status?: OrderStatus) {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        ...(branchId && { branchId }),
        ...(status && { status }),
      },
      select: ORDER_SELECT_FULL,
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => this.formatOrderResponse(o));
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

    // [V2 FEATURE - Automated Inventory Engine Stock Deductions / Returns (Commented out for V1)]
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
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      table: order.table ? { id: order.table.id, name: order.table.name, code: order.table.code } : null,
      branch: order.branch ? { id: order.branch.id, name: order.branch.name, code: order.branch.code } : null,
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
