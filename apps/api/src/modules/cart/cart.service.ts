import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { PublicTablesService } from '../public-tables/public-tables.service';
import { CacheKeys, CacheTtl, TtlCacheService } from '../../common/cache/ttl-cache.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const MAX_QUANTITY = 99;

type SelectableOption = { id: string; groupId: string; groupName: string; name: string; price: Prisma.Decimal };

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicTablesService: PublicTablesService,
    private readonly cache: TtlCacheService,
  ) {}

  async getCart(token: string) {
    const { cart } = await this.getOrCreateCart(token);
    return this.buildCartResponse(cart.id);
  }

  /**
   * Idempotent item quantity setter: creates, updates, or deletes based on exact target quantity.
   * Eliminates race conditions and delta merging errors.
   */
  async setItemQuantity(token: string, dto: AddCartItemDto) {
    const { cart, restaurantId } = await this.getOrCreateCart(token);
    const menuItem = await this.loadAvailableMenuItem(restaurantId, dto.menuItemId);

    const variantIds = this.normalizeIds(dto.variantIds);
    const addonIds = this.normalizeIds(dto.addonIds);
    const { variants, addons } = this.validateSelections(menuItem, variantIds, addonIds);

    const targetQuantity = dto.quantity ?? 1;
    const existing = await this.findMatchingCartItem(cart.id, menuItem.id, variantIds, addonIds);

    if (targetQuantity <= 0) {
      if (existing) {
        await this.prisma.cartItem.delete({ where: { id: existing.id } });
      }
      return this.buildCartResponse(cart.id);
    }

    if (targetQuantity > MAX_QUANTITY) {
      throw new BadRequestException(`Maximum quantity per cart line is ${MAX_QUANTITY}`);
    }

    if (existing) {
      const unitPrice = new Prisma.Decimal(existing.unitPrice);
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: targetQuantity, totalPrice: unitPrice.mul(targetQuantity) },
      });
    } else {
      const unitPrice = this.calculateItemPrice(menuItem.price, variants, addons);
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId: menuItem.id,
          quantity: targetQuantity,
          unitPrice,
          totalPrice: unitPrice.mul(targetQuantity),
          variantSelections: { create: variants.map((v) => ({ variantId: v.id, name: v.name, price: v.price })) },
          addonSelections: { create: addons.map((a) => ({ addonId: a.id, name: a.name, price: a.price })) },
        },
      });
    }

    return this.buildCartResponse(cart.id);
  }

  async addItem(token: string, dto: AddCartItemDto) {
    const { cart, restaurantId } = await this.getOrCreateCart(token);

    const menuItem = await this.loadAvailableMenuItem(restaurantId, dto.menuItemId);

    const variantIds = this.normalizeIds(dto.variantIds);
    const addonIds = this.normalizeIds(dto.addonIds);
    const { variants, addons } = this.validateSelections(menuItem, variantIds, addonIds);

    const quantity = dto.quantity ?? 1;
    const existing = await this.findMatchingCartItem(cart.id, menuItem.id, variantIds, addonIds);

    if (existing) {
      // Same menu item + same selections => merge into the existing line (3.25.28).
      // The original snapshot price is preserved so a mid-session menu price change
      // never rewrites what the customer already accepted.
      const mergedQuantity = existing.quantity + quantity;
      if (mergedQuantity > MAX_QUANTITY) {
        throw new BadRequestException(`Maximum quantity per cart line is ${MAX_QUANTITY}`);
      }
      const unitPrice = new Prisma.Decimal(existing.unitPrice);
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: mergedQuantity, totalPrice: unitPrice.mul(mergedQuantity) },
      });
    } else {
      // Prices are always computed here from the database rows, never from the request.
      const unitPrice = this.calculateItemPrice(menuItem.price, variants, addons);
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId: menuItem.id,
          quantity,
          unitPrice,
          totalPrice: unitPrice.mul(quantity),
          variantSelections: { create: variants.map((v) => ({ variantId: v.id, name: v.name, price: v.price })) },
          addonSelections: { create: addons.map((a) => ({ addonId: a.id, name: a.name, price: a.price })) },
        },
      });
    }

    return this.buildCartResponse(cart.id);
  }

  async updateItemQuantity(token: string, itemId: string, dto: UpdateCartItemDto) {
    const { cart } = await this.getOrCreateCart(token);
    const item = await this.loadOwnedCartItem(cart.id, itemId);

    if (dto.quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: item.id } });
      return this.buildCartResponse(cart.id);
    }

    const unitPrice = new Prisma.Decimal(item.unitPrice);
    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: dto.quantity, totalPrice: unitPrice.mul(dto.quantity) },
    });

    return this.buildCartResponse(cart.id);
  }

  async removeItem(token: string, itemId: string) {
    const { cart } = await this.getOrCreateCart(token);
    const item = await this.loadOwnedCartItem(cart.id, itemId);

    // Only the line goes away — the cart itself survives for the session lifecycle (3.25.20).
    await this.prisma.cartItem.delete({ where: { id: item.id } });

    return this.buildCartResponse(cart.id);
  }

  async getOrCreateCart(token: string) {
    const { session, resolved } = await this.publicTablesService.getOrCreateSessionRecord(token);

    // Anti-Spoofing: If all orders for this session are COMPLETED, session is settled and cannot accept new cart items
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

    const existing = await this.prisma.cart.findUnique({ where: { customerSessionId: session.id }, select: { id: true } });
    if (existing) return { cart: existing, restaurantId: resolved.restaurant.id, sessionId: session.id };

    let cart: { id: string };
    try {
      cart = await this.prisma.cart.create({ data: { customerSessionId: session.id }, select: { id: true } });
    } catch {
      // Two concurrent requests can race on the one-cart-per-session unique index.
      const raced = await this.prisma.cart.findUnique({ where: { customerSessionId: session.id }, select: { id: true } });
      if (!raced) throw new BadRequestException('Unable to open a cart for this table session');
      cart = raced;
    }

    return { cart, restaurantId: resolved.restaurant.id, sessionId: session.id };
  }

  calculateItemPrice(
    basePrice: Prisma.Decimal | string | number,
    variants: { price: Prisma.Decimal }[],
    addons: { price: Prisma.Decimal }[],
  ): Prisma.Decimal {
    let unitPrice = new Prisma.Decimal(basePrice);
    for (const variant of variants) unitPrice = unitPrice.add(new Prisma.Decimal(variant.price));
    for (const addon of addons) unitPrice = unitPrice.add(new Prisma.Decimal(addon.price));
    return unitPrice;
  }

  validateSelections(
    menuItem: Awaited<ReturnType<CartService['loadAvailableMenuItem']>>,
    variantIds: string[],
    addonIds: string[],
  ) {
    const variants = this.resolveOptions(
      variantIds,
      menuItem.variantGroups.flatMap((group) =>
        group.variants.map((v) => ({ id: v.id, groupId: group.id, groupName: group.name, name: v.name, price: new Prisma.Decimal(v.price) })),
      ),
      'variant',
    );

    for (const group of menuItem.variantGroups) {
      const count = variants.filter((v) => v.groupId === group.id).length;
      // Variant groups are single-select by design, so more than one option is a rejection.
      if (count > 1) throw new BadRequestException(`Only one option can be selected for "${group.name}"`);
      if (group.required && count === 0) throw new BadRequestException(`A selection for "${group.name}" is required`);
    }

    const addons = this.resolveOptions(
      addonIds,
      menuItem.addonGroups.flatMap((group) =>
        group.addons.map((a) => ({ id: a.id, groupId: group.id, groupName: group.name, name: a.name, price: new Prisma.Decimal(a.price) })),
      ),
      'add-on',
    );

    for (const group of menuItem.addonGroups) {
      const count = addons.filter((a) => a.groupId === group.id).length;
      if (count > group.maxSelect) {
        throw new BadRequestException(`At most ${group.maxSelect} option(s) can be selected for "${group.name}"`);
      }
      if (count === 0 && !group.required) continue;
      const minimum = group.required ? Math.max(group.minSelect, 1) : group.minSelect;
      if (count < minimum) {
        throw new BadRequestException(`At least ${minimum} option(s) must be selected for "${group.name}"`);
      }
    }

    return { variants, addons };
  }

  private resolveOptions(requestedIds: string[], available: SelectableOption[], label: string): SelectableOption[] {
    const byId = new Map(available.map((option) => [option.id, option]));
    return requestedIds.map((id) => {
      const option = byId.get(id);
      // Covers unknown ids, deactivated options and options belonging to another item.
      if (!option) throw new BadRequestException(`Selected ${label} is not available for this item`);
      return option;
    });
  }

  private async loadAvailableMenuItem(restaurantId: string, menuItemId: string) {
    // The whole availability chain is enforced here: menu, category and item must be
    // ACTIVE, and the item must belong to this table's restaurant. A foreign or
    // deactivated item is indistinguishable from a missing one on a public endpoint.
    return this.cache.wrap(
      CacheKeys.menuItem(restaurantId, menuItemId),
      CacheTtl.menuItem,
      async () => {
        const menuItem = await this.prisma.menuItem.findFirst({
          where: {
            id: menuItemId,
            status: 'ACTIVE',
            category: { status: 'ACTIVE', menu: { restaurantId, status: 'ACTIVE' } },
          },
          select: {
            id: true,
            name: true,
            price: true,
            variantGroups: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                name: true,
                required: true,
                variants: { where: { status: 'ACTIVE' }, orderBy: { position: 'asc' }, select: { id: true, name: true, price: true } },
              },
            },
            addonGroups: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                name: true,
                required: true,
                minSelect: true,
                maxSelect: true,
                addons: { where: { status: 'ACTIVE' }, orderBy: { position: 'asc' }, select: { id: true, name: true, price: true } },
              },
            },
          },
        });

        if (!menuItem) throw new NotFoundException('Menu item not found');
        return menuItem;
      },
    );
  }

  private async loadOwnedCartItem(cartId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        OR: [{ id: itemId }, { menuItemId: itemId }],
      },
      select: { id: true, quantity: true, unitPrice: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    return item;
  }

  private async findMatchingCartItem(cartId: string, menuItemId: string, variantIds: string[], addonIds: string[]) {
    const candidates = await this.prisma.cartItem.findMany({
      where: { cartId, menuItemId },
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        variantSelections: { select: { variantId: true } },
        addonSelections: { select: { addonId: true } },
      },
    });

    const signature = this.buildSignature(variantIds, addonIds);
    return candidates.find(
      (candidate) =>
        this.buildSignature(
          candidate.variantSelections.map((v) => v.variantId),
          candidate.addonSelections.map((a) => a.addonId),
        ) === signature,
    );
  }

  /** Selection order must not create a second cart line (3.25.29), so ids are sorted. */
  private buildSignature(variantIds: string[], addonIds: string[]) {
    return `${this.normalizeIds(variantIds).join(',')}|${this.normalizeIds(addonIds).join(',')}`;
  }

  private normalizeIds(ids?: string[]): string[] {
    return [...new Set(ids ?? [])].sort();
  }

  private async buildCartResponse(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      select: {
        id: true,
        updatedAt: true,
        items: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            menuItemId: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            menuItem: { select: { name: true, imageUrl: true, dietaryType: true } },
            variantSelections: { select: { id: true, variantId: true, name: true, price: true } },
            addonSelections: { select: { id: true, addonId: true, name: true, price: true } },
          },
        },
      },
    });

    if (!cart) throw new NotFoundException('Cart not found');

    let subtotal = new Prisma.Decimal(0);
    let totalQuantity = 0;

    const items = cart.items.map((item) => {
      subtotal = subtotal.add(new Prisma.Decimal(item.totalPrice));
      totalQuantity += item.quantity;

      const variants = item.variantSelections.map((v) => ({ id: v.id, variantId: v.variantId, name: v.name, price: Number(v.price) }));

      return {
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.menuItem.name,
        imageUrl: item.menuItem.imageUrl,
        dietaryType: item.menuItem.dietaryType,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        // `variant` keeps the documented single-variant shape; `variants` carries every
        // group selection for items with more than one variant group.
        variant: variants[0] ?? null,
        variants,
        addons: item.addonSelections.map((a) => ({ id: a.id, addonId: a.addonId, name: a.name, price: Number(a.price) })),
      };
    });

    return {
      id: cart.id,
      updatedAt: cart.updatedAt,
      items,
      // Distinct lines vs total units, so the badge can show either (3.25.27).
      itemCount: items.length,
      totalQuantity,
      subtotal: Number(subtotal),
    };
  }
}
