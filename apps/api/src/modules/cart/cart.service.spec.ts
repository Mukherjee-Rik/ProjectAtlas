import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PublicTablesService } from '../public-tables/public-tables.service';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';

const RESTAURANT_A = 'restaurant-a';
const TOKEN = 'table-04-token';

/** Margherita ₹299 — Size (required, single-select) + Extra Toppings (min 0, max 3). */
function margherita(overrides: Record<string, any> = {}) {
  return {
    id: 'item-margherita',
    name: 'Margherita Pizza',
    price: '299.00',
    variantGroups: [
      {
        id: 'vg-size',
        name: 'Size',
        required: true,
        variants: [
          { id: 'v-medium', name: 'Medium', price: '0.00' },
          { id: 'v-large', name: 'Large', price: '80.00' },
        ],
      },
    ],
    addonGroups: [
      {
        id: 'ag-toppings',
        name: 'Extra Toppings',
        required: false,
        minSelect: 0,
        maxSelect: 3,
        addons: [
          { id: 'a-cheese', name: 'Extra Cheese', price: '50.00' },
          { id: 'a-olives', name: 'Olives', price: '30.00' },
          { id: 'a-jalapenos', name: 'Jalapeños', price: '20.00' },
          { id: 'a-mushrooms', name: 'Mushrooms', price: '25.00' },
        ],
      },
    ],
    ...overrides,
  };
}

describe('CartService', () => {
  let service: CartService;
  let prisma: any;
  let publicTables: any;

  /** Mirrors what buildCartResponse reads back after a write. */
  function cartRows(items: any[]) {
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', updatedAt: new Date('2026-08-11T10:00:00Z'), items });
  }

  function cartRow(overrides: Record<string, any> = {}) {
    return {
      id: 'ci-1',
      menuItemId: 'item-margherita',
      quantity: 1,
      unitPrice: '379.00',
      totalPrice: '379.00',
      menuItem: { name: 'Margherita Pizza', imageUrl: null, dietaryType: 'VEG' },
      variantSelections: [{ id: 'civ-1', variantId: 'v-medium', name: 'Medium', price: '0.00' }],
      addonSelections: [
        { id: 'cia-1', addonId: 'a-cheese', name: 'Extra Cheese', price: '50.00' },
        { id: 'cia-2', addonId: 'a-olives', name: 'Olives', price: '30.00' },
      ],
      ...overrides,
    };
  }

  beforeEach(async () => {
    prisma = {
      cart: { findUnique: jest.fn(), create: jest.fn() },
      cartItem: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      menuItem: { findFirst: jest.fn() },
      order: { findMany: jest.fn().mockResolvedValue([]) },
    };

    publicTables = {
      getOrCreateSessionRecord: jest.fn().mockResolvedValue({
        session: { id: 'session-1', sessionToken: 'cs_abc', status: 'ACTIVE' },
        resolved: { table: { id: 'table-1' }, restaurant: { id: RESTAURANT_A, name: 'Pizza House' } },
      }),
    };

    // Cart already exists for the session unless a test says otherwise.
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        TtlCacheService,
        { provide: PrismaService, useValue: prisma },
        { provide: PublicTablesService, useValue: publicTables },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateCart', () => {
    it('creates a cart when the session has none', async () => {
      prisma.cart.findUnique.mockResolvedValueOnce(null);
      prisma.cart.create.mockResolvedValue({ id: 'cart-new' });

      const result = await service.getOrCreateCart(TOKEN);

      expect(prisma.cart.create).toHaveBeenCalledWith({ data: { customerSessionId: 'session-1' }, select: { id: true } });
      expect(result.cart.id).toBe('cart-new');
      expect(result.restaurantId).toBe(RESTAURANT_A);
    });

    it('reuses the single cart already attached to the session', async () => {
      const result = await service.getOrCreateCart(TOKEN);

      expect(prisma.cart.create).not.toHaveBeenCalled();
      expect(result.cart.id).toBe('cart-1');
    });

    it('recovers from a concurrent create losing the unique race', async () => {
      prisma.cart.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'cart-raced' });
      prisma.cart.create.mockRejectedValue(new Error('Unique constraint failed'));

      const result = await service.getOrCreateCart(TOKEN);
      expect(result.cart.id).toBe('cart-raced');
    });
  });

  // Test 1 — add Margherita x 1 => 1 item
  it('Test 1: adds a configured item as a single cart line', async () => {
    prisma.menuItem.findFirst.mockResolvedValue(margherita());
    prisma.cartItem.create.mockResolvedValue({ id: 'ci-1' });
    cartRows([cartRow()]);

    const cart = await service.addItem(TOKEN, {
      menuItemId: 'item-margherita',
      quantity: 1,
      variantIds: ['v-medium'],
      addonIds: ['a-cheese', 'a-olives'],
    });

    // 299 + 0 (Medium) + 50 (Cheese) + 30 (Olives) = 379
    const created = prisma.cartItem.create.mock.calls[0][0].data;
    expect(created.unitPrice.toString()).toBe('379');
    expect(created.totalPrice.toString()).toBe('379');
    expect(created.variantSelections.create).toEqual([{ variantId: 'v-medium', name: 'Medium', price: expect.anything() }]);
    expect(created.addonSelections.create).toHaveLength(2);

    expect(cart.items).toHaveLength(1);
    expect(cart.itemCount).toBe(1);
    expect(cart.totalQuantity).toBe(1);
    expect(cart.subtotal).toBe(379);
  });

  it('defaults quantity to 1 when the request omits it', async () => {
    prisma.menuItem.findFirst.mockResolvedValue(margherita());
    prisma.cartItem.create.mockResolvedValue({ id: 'ci-1' });
    cartRows([cartRow()]);

    await service.addItem(TOKEN, { menuItemId: 'item-margherita', variantIds: ['v-medium'] });

    expect(prisma.cartItem.create.mock.calls[0][0].data.quantity).toBe(1);
  });

  // Test 2 — 1 -> 2 doubles the line total
  it('Test 2: recalculates the line total when quantity changes', async () => {
    prisma.cartItem.findFirst.mockResolvedValue({ id: 'ci-1', quantity: 1, unitPrice: '379.00' });
    cartRows([cartRow({ quantity: 2, totalPrice: '758.00' })]);

    const cart = await service.updateItemQuantity(TOKEN, 'ci-1', { quantity: 2 });

    expect(prisma.cartItem.update).toHaveBeenCalledWith({
      where: { id: 'ci-1' },
      data: { quantity: 2, totalPrice: expect.anything() },
    });
    expect(prisma.cartItem.update.mock.calls[0][0].data.totalPrice.toString()).toBe('758');
    expect(cart.items[0].totalPrice).toBe(758);
    expect(cart.subtotal).toBe(758);
    expect(cart.totalQuantity).toBe(2);
  });

  // Test 3 — same configuration merges instead of adding a line
  it('Test 3: merges an identical configuration into the existing line', async () => {
    prisma.menuItem.findFirst.mockResolvedValue(margherita());
    prisma.cartItem.findMany.mockResolvedValue([
      {
        id: 'ci-1',
        quantity: 1,
        unitPrice: '379.00',
        variantSelections: [{ variantId: 'v-medium' }],
        addonSelections: [{ addonId: 'a-cheese' }, { addonId: 'a-olives' }],
      },
    ]);
    cartRows([cartRow({ quantity: 2, totalPrice: '758.00' })]);

    const cart = await service.addItem(TOKEN, {
      menuItemId: 'item-margherita',
      quantity: 1,
      variantIds: ['v-medium'],
      addonIds: ['a-cheese', 'a-olives'],
    });

    expect(prisma.cartItem.create).not.toHaveBeenCalled();
    expect(prisma.cartItem.update.mock.calls[0][0].data.quantity).toBe(2);
    expect(cart.items).toHaveLength(1);
  });

  it('Test 3b: matches regardless of add-on order (normalized signature)', async () => {
    prisma.menuItem.findFirst.mockResolvedValue(margherita());
    prisma.cartItem.findMany.mockResolvedValue([
      {
        id: 'ci-1',
        quantity: 1,
        unitPrice: '379.00',
        variantSelections: [{ variantId: 'v-medium' }],
        addonSelections: [{ addonId: 'a-cheese' }, { addonId: 'a-olives' }],
      },
    ]);
    cartRows([cartRow({ quantity: 2, totalPrice: '758.00' })]);

    await service.addItem(TOKEN, {
      menuItemId: 'item-margherita',
      quantity: 1,
      variantIds: ['v-medium'],
      addonIds: ['a-olives', 'a-cheese'],
    });

    expect(prisma.cartItem.create).not.toHaveBeenCalled();
    expect(prisma.cartItem.update).toHaveBeenCalled();
  });

  it('keeps the original snapshot price when merging after a menu price change', async () => {
    // Menu price is now 349, but the existing line was snapshotted at 379.
    prisma.menuItem.findFirst.mockResolvedValue(margherita({ price: '349.00' }));
    prisma.cartItem.findMany.mockResolvedValue([
      {
        id: 'ci-1',
        quantity: 1,
        unitPrice: '379.00',
        variantSelections: [{ variantId: 'v-medium' }],
        addonSelections: [{ addonId: 'a-cheese' }, { addonId: 'a-olives' }],
      },
    ]);
    cartRows([cartRow({ quantity: 2, totalPrice: '758.00' })]);

    await service.addItem(TOKEN, {
      menuItemId: 'item-margherita',
      quantity: 1,
      variantIds: ['v-medium'],
      addonIds: ['a-cheese', 'a-olives'],
    });

    const data = prisma.cartItem.update.mock.calls[0][0].data;
    expect(data.unitPrice).toBeUndefined();
    expect(data.totalPrice.toString()).toBe('758');
  });

  it('rejects a merge that would exceed the per-line quantity ceiling', async () => {
    prisma.menuItem.findFirst.mockResolvedValue(margherita());
    prisma.cartItem.findMany.mockResolvedValue([
      { id: 'ci-1', quantity: 98, unitPrice: '379.00', variantSelections: [{ variantId: 'v-medium' }], addonSelections: [] },
    ]);

    await expect(
      service.addItem(TOKEN, { menuItemId: 'item-margherita', quantity: 5, variantIds: ['v-medium'] }),
    ).rejects.toThrow(BadRequestException);
  });

  // Test 4 — same item, different add-ons => separate line
  it('Test 4: creates a separate line for a different add-on configuration', async () => {
    prisma.menuItem.findFirst.mockResolvedValue(margherita());
    prisma.cartItem.findMany.mockResolvedValue([
      {
        id: 'ci-1',
        quantity: 1,
        unitPrice: '379.00',
        variantSelections: [{ variantId: 'v-medium' }],
        addonSelections: [{ addonId: 'a-cheese' }, { addonId: 'a-olives' }],
      },
    ]);
    prisma.cartItem.create.mockResolvedValue({ id: 'ci-2' });
    cartRows([cartRow(), cartRow({ id: 'ci-2', unitPrice: '329.00', totalPrice: '329.00', addonSelections: [{ id: 'cia-3', addonId: 'a-olives', name: 'Olives', price: '30.00' }] })]);

    const cart = await service.addItem(TOKEN, {
      menuItemId: 'item-margherita',
      quantity: 1,
      variantIds: ['v-medium'],
      addonIds: ['a-olives'],
    });

    expect(prisma.cartItem.update).not.toHaveBeenCalled();
    expect(prisma.cartItem.create).toHaveBeenCalled();
    // 299 + 0 + 30 = 329
    expect(prisma.cartItem.create.mock.calls[0][0].data.unitPrice.toString()).toBe('329');
    expect(cart.items).toHaveLength(2);
    expect(cart.itemCount).toBe(2);
    expect(cart.subtotal).toBe(708);
  });

  // Test 5 — invalid / missing / over-selected variants
  describe('Test 5: variant validation', () => {
    it('rejects an unknown variant id', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(margherita());

      await expect(
        service.addItem(TOKEN, { menuItemId: 'item-margherita', quantity: 1, variantIds: ['v-does-not-exist'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an empty selection for a required variant group', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(margherita());

      await expect(
        service.addItem(TOKEN, { menuItemId: 'item-margherita', quantity: 1, variantIds: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects two variants from the same single-select group', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(margherita());

      await expect(
        service.addItem(TOKEN, { menuItemId: 'item-margherita', quantity: 1, variantIds: ['v-medium', 'v-large'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a variant that has been deactivated', async () => {
      // Deactivated variants are filtered out of the query, so the id resolves to nothing.
      prisma.menuItem.findFirst.mockResolvedValue(
        margherita({
          variantGroups: [{ id: 'vg-size', name: 'Size', required: true, variants: [{ id: 'v-medium', name: 'Medium', price: '0.00' }] }],
        }),
      );

      await expect(
        service.addItem(TOKEN, { menuItemId: 'item-margherita', quantity: 1, variantIds: ['v-large'] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('add-on validation', () => {
    it('rejects more add-ons than maxSelect allows', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(margherita());

      await expect(
        service.addItem(TOKEN, {
          menuItemId: 'item-margherita',
          quantity: 1,
          variantIds: ['v-medium'],
          addonIds: ['a-cheese', 'a-olives', 'a-jalapenos', 'a-mushrooms'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a required add-on group left empty', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(
        margherita({
          addonGroups: [
            {
              id: 'ag-base',
              name: 'Choose a base',
              required: true,
              minSelect: 1,
              maxSelect: 1,
              addons: [{ id: 'a-thin', name: 'Thin Crust', price: '0.00' }],
            },
          ],
        }),
      );

      await expect(
        service.addItem(TOKEN, { menuItemId: 'item-margherita', quantity: 1, variantIds: ['v-medium'], addonIds: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows an optional add-on group to be skipped', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(margherita());
      prisma.cartItem.create.mockResolvedValue({ id: 'ci-1' });
      cartRows([cartRow({ unitPrice: '299.00', totalPrice: '299.00', addonSelections: [] })]);

      const cart = await service.addItem(TOKEN, { menuItemId: 'item-margherita', quantity: 1, variantIds: ['v-medium'] });

      expect(prisma.cartItem.create.mock.calls[0][0].data.unitPrice.toString()).toBe('299');
      expect(cart.subtotal).toBe(299);
    });

    it('rejects an add-on belonging to another menu item', async () => {
      prisma.menuItem.findFirst.mockResolvedValue(margherita());

      await expect(
        service.addItem(TOKEN, {
          menuItemId: 'item-margherita',
          quantity: 1,
          variantIds: ['v-medium'],
          addonIds: ['a-foreign-addon'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // Tests 6 & 7 — availability and restaurant isolation both resolve to "not found"
  it('Test 6: rejects an item whose menu, category or item row is not ACTIVE', async () => {
    prisma.menuItem.findFirst.mockResolvedValue(null);

    await expect(
      service.addItem(TOKEN, { menuItemId: 'item-deactivated', quantity: 1, variantIds: [] }),
    ).rejects.toThrow(NotFoundException);

    // The ACTIVE chain is enforced in the query itself, not in frontend state.
    expect(prisma.menuItem.findFirst.mock.calls[0][0].where).toEqual({
      id: 'item-deactivated',
      status: 'ACTIVE',
      category: { status: 'ACTIVE', menu: { restaurantId: RESTAURANT_A, status: 'ACTIVE' } },
    });
  });

  it('Test 7: rejects an item owned by another restaurant with 404', async () => {
    prisma.menuItem.findFirst.mockResolvedValue(null);

    await expect(
      service.addItem(TOKEN, { menuItemId: 'item-of-restaurant-b', quantity: 1, variantIds: ['v-medium'] }),
    ).rejects.toThrow(NotFoundException);

    // Scoped to this table's restaurant, so a foreign item can never be located.
    expect(prisma.menuItem.findFirst.mock.calls[0][0].where.category.menu.restaurantId).toBe(RESTAURANT_A);
    expect(prisma.cartItem.create).not.toHaveBeenCalled();
  });

  // Test 8 — a client-supplied price is never used
  it('Test 8: ignores any price sent by the client and uses the database price', async () => {
    prisma.menuItem.findFirst.mockResolvedValue(margherita());
    prisma.cartItem.create.mockResolvedValue({ id: 'ci-1' });
    cartRows([cartRow({ unitPrice: '299.00', totalPrice: '299.00', addonSelections: [] })]);

    await service.addItem(TOKEN, {
      menuItemId: 'item-margherita',
      quantity: 1,
      variantIds: ['v-medium'],
      // Rogue fields a hostile client might append.
      price: 1,
      unitPrice: 1,
      totalPrice: 1,
      subtotal: 1,
    } as any);

    const created = prisma.cartItem.create.mock.calls[0][0].data;
    expect(created.unitPrice.toString()).toBe('299');
    expect(created.totalPrice.toString()).toBe('299');
  });

  it('Test 8b: ignores a client price on a variant/add-on heavy configuration', async () => {
    prisma.menuItem.findFirst.mockResolvedValue(margherita());
    prisma.cartItem.create.mockResolvedValue({ id: 'ci-1' });
    cartRows([cartRow({ unitPrice: '429.00', totalPrice: '858.00', quantity: 2 })]);

    await service.addItem(TOKEN, {
      menuItemId: 'item-margherita',
      quantity: 2,
      variantIds: ['v-large'],
      addonIds: ['a-cheese'],
      price: 1,
    } as any);

    // 299 + 80 (Large) + 50 (Cheese) = 429, x2 = 858
    const created = prisma.cartItem.create.mock.calls[0][0].data;
    expect(created.unitPrice.toString()).toBe('429');
    expect(created.totalPrice.toString()).toBe('858');
    // Snapshots come from the database rows.
    expect(created.variantSelections.create[0].name).toBe('Large');
    expect(created.addonSelections.create[0].name).toBe('Extra Cheese');
  });

  it('snapshots variant and add-on names and prices onto the cart line', async () => {
    prisma.menuItem.findFirst.mockResolvedValue(margherita());
    prisma.cartItem.create.mockResolvedValue({ id: 'ci-1' });
    cartRows([cartRow()]);

    await service.addItem(TOKEN, {
      menuItemId: 'item-margherita',
      quantity: 1,
      variantIds: ['v-medium'],
      addonIds: ['a-cheese'],
    });

    const created = prisma.cartItem.create.mock.calls[0][0].data;
    expect(created.variantSelections.create[0]).toMatchObject({ variantId: 'v-medium', name: 'Medium' });
    expect(created.addonSelections.create[0]).toMatchObject({ addonId: 'a-cheese', name: 'Extra Cheese' });
    expect(created.addonSelections.create[0].price.toString()).toBe('50');
  });

  describe('price calculation', () => {
    it('adds base, variant and add-on prices with Decimal arithmetic', () => {
      const unitPrice = service.calculateItemPrice('299.00', [{ price: '0.00' as any }], [{ price: '50.00' as any }, { price: '30.00' as any }]);
      expect(unitPrice.toString()).toBe('379');
      expect(unitPrice.mul(2).toString()).toBe('758');
    });

    it('stays exact on values that float arithmetic would drift on', () => {
      const unitPrice = service.calculateItemPrice('0.10', [{ price: '0.20' as any }], []);
      expect(unitPrice.toString()).toBe('0.3');
      expect(unitPrice.mul(3).toString()).toBe('0.9');
    });
  });

  describe('cart item ownership', () => {
    it('does not update a cart line from another session cart', async () => {
      prisma.cartItem.findFirst.mockResolvedValue(null);

      await expect(service.updateItemQuantity(TOKEN, 'ci-foreign', { quantity: 2 })).rejects.toThrow(NotFoundException);
      expect(prisma.cartItem.update).not.toHaveBeenCalled();
    });

    it('does not delete a cart line from another session cart', async () => {
      prisma.cartItem.findFirst.mockResolvedValue(null);

      await expect(service.removeItem(TOKEN, 'ci-foreign')).rejects.toThrow(NotFoundException);
      expect(prisma.cartItem.delete).not.toHaveBeenCalled();
    });

    it('scopes the lookup to this session cart', async () => {
      prisma.cartItem.findFirst.mockResolvedValue({ id: 'ci-1', quantity: 1, unitPrice: '379.00' });
      cartRows([]);

      await service.removeItem(TOKEN, 'ci-1');
      expect(prisma.cartItem.findFirst.mock.calls[0][0].where).toEqual({
        cartId: 'cart-1',
        OR: [{ id: 'ci-1' }, { menuItemId: 'ci-1' }],
      });
    });
  });

  it('removes a line and keeps the remaining ones', async () => {
    prisma.cartItem.findFirst.mockResolvedValue({ id: 'ci-2', quantity: 1, unitPrice: '329.00' });
    cartRows([cartRow(), cartRow({ id: 'ci-3', unitPrice: '299.00', totalPrice: '299.00', addonSelections: [] })]);

    const cart = await service.removeItem(TOKEN, 'ci-2');

    expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'ci-2' } });
    expect(cart.items.map((i) => i.id)).toEqual(['ci-1', 'ci-3']);
    expect(cart.subtotal).toBe(678);
  });

  it('keeps the cart alive and reports a zero subtotal once emptied', async () => {
    prisma.cartItem.findFirst.mockResolvedValue({ id: 'ci-1', quantity: 1, unitPrice: '379.00' });
    cartRows([]);

    const cart = await service.removeItem(TOKEN, 'ci-1');

    expect(cart.id).toBe('cart-1');
    expect(cart.items).toEqual([]);
    expect(cart.itemCount).toBe(0);
    expect(cart.totalQuantity).toBe(0);
    expect(cart.subtotal).toBe(0);
  });

  it('reports distinct lines and total units separately for the badge', async () => {
    cartRows([
      cartRow({ quantity: 2, totalPrice: '758.00' }),
      cartRow({ id: 'ci-2', quantity: 3, unitPrice: '299.00', totalPrice: '897.00', addonSelections: [] }),
    ]);

    const cart = await service.getCart(TOKEN);

    expect(cart.itemCount).toBe(2);
    expect(cart.totalQuantity).toBe(5);
    expect(cart.subtotal).toBe(1655);
  });

  it('exposes the selected variant on both the single and multi shapes', async () => {
    cartRows([cartRow()]);

    const cart = await service.getCart(TOKEN);

    expect(cart.items[0].variant).toMatchObject({ name: 'Medium', price: 0 });
    expect(cart.items[0].variants).toHaveLength(1);
    expect(cart.items[0].addons).toEqual([
      { id: 'cia-1', addonId: 'a-cheese', name: 'Extra Cheese', price: 50 },
      { id: 'cia-2', addonId: 'a-olives', name: 'Olives', price: 30 },
    ]);
  });

  it('returns a null variant for items without variant groups', async () => {
    cartRows([cartRow({ variantSelections: [] })]);

    const cart = await service.getCart(TOKEN);
    expect(cart.items[0].variant).toBeNull();
    expect(cart.items[0].variants).toEqual([]);
  });
});
