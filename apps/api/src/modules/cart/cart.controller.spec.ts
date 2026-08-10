import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const TOKEN = 'table-04-token';
const MENU_ITEM_ID = '8f14e45f-ea0b-4c9a-9d1f-1c2f6a3b4c5d';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  return validate(plainToInstance(cls, payload), { whitelist: true, forbidNonWhitelisted: true });
}

describe('CartController', () => {
  let controller: CartController;
  let cartService: any;

  beforeEach(async () => {
    cartService = {
      getCart: jest.fn().mockResolvedValue({ id: 'cart-1', items: [], itemCount: 0, totalQuantity: 0, subtotal: 0 }),
      addItem: jest.fn().mockResolvedValue({ id: 'cart-1' }),
      updateItemQuantity: jest.fn().mockResolvedValue({ id: 'cart-1' }),
      removeItem: jest.fn().mockResolvedValue({ id: 'cart-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: cartService }],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('routes the table token through to the cart service', async () => {
    await controller.getCart(TOKEN);
    expect(cartService.getCart).toHaveBeenCalledWith(TOKEN);
  });

  it('passes the add payload straight to the service', async () => {
    const dto: AddCartItemDto = { menuItemId: MENU_ITEM_ID, quantity: 2, variantIds: ['v-1'], addonIds: ['a-1'] };
    await controller.addItem(TOKEN, dto);
    expect(cartService.addItem).toHaveBeenCalledWith(TOKEN, dto);
  });

  it('passes quantity updates through with the cart item id', async () => {
    await controller.updateItemQuantity(TOKEN, 'ci-1', { quantity: 3 });
    expect(cartService.updateItemQuantity).toHaveBeenCalledWith(TOKEN, 'ci-1', { quantity: 3 });
  });

  it('passes removals through with the cart item id', async () => {
    await controller.removeItem(TOKEN, 'ci-1');
    expect(cartService.removeItem).toHaveBeenCalledWith(TOKEN, 'ci-1');
  });

  describe('AddCartItemDto validation', () => {
    it('accepts a valid payload', async () => {
      expect(await errorsFor(AddCartItemDto, { menuItemId: MENU_ITEM_ID, quantity: 2, variantIds: [], addonIds: [] })).toHaveLength(0);
    });

    it('accepts a payload without a quantity', async () => {
      expect(await errorsFor(AddCartItemDto, { menuItemId: MENU_ITEM_ID })).toHaveLength(0);
    });

    // Test 9
    it('Test 9: rejects quantity 0', async () => {
      const errors = await errorsFor(AddCartItemDto, { menuItemId: MENU_ITEM_ID, quantity: 0 });
      expect(errors.some((e) => e.property === 'quantity')).toBe(true);
    });

    // Test 10
    it('Test 10: rejects quantity 100', async () => {
      const errors = await errorsFor(AddCartItemDto, { menuItemId: MENU_ITEM_ID, quantity: 100 });
      expect(errors.some((e) => e.property === 'quantity')).toBe(true);
    });

    it('rejects a negative or fractional quantity', async () => {
      expect(await errorsFor(AddCartItemDto, { menuItemId: MENU_ITEM_ID, quantity: -1 })).not.toHaveLength(0);
      expect(await errorsFor(AddCartItemDto, { menuItemId: MENU_ITEM_ID, quantity: 1.5 })).not.toHaveLength(0);
    });

    it('rejects a non-uuid menu item id', async () => {
      const errors = await errorsFor(AddCartItemDto, { menuItemId: 'not-a-uuid', quantity: 1 });
      expect(errors.some((e) => e.property === 'menuItemId')).toBe(true);
    });

    it('rejects non-uuid entries inside the selection arrays', async () => {
      const errors = await errorsFor(AddCartItemDto, { menuItemId: MENU_ITEM_ID, variantIds: ['nope'] });
      expect(errors.some((e) => e.property === 'variantIds')).toBe(true);
    });

    // The global ValidationPipe runs with forbidNonWhitelisted, so a client-supplied
    // price is rejected outright rather than silently trusted.
    it('rejects a rogue price field on the request body', async () => {
      const errors = await errorsFor(AddCartItemDto, { menuItemId: MENU_ITEM_ID, quantity: 1, price: 1 });
      expect(errors.some((e) => e.property === 'price')).toBe(true);
    });
  });

  describe('UpdateCartItemDto validation', () => {
    it('accepts a quantity inside the 1-99 range', async () => {
      expect(await errorsFor(UpdateCartItemDto, { quantity: 3 })).toHaveLength(0);
      expect(await errorsFor(UpdateCartItemDto, { quantity: 99 })).toHaveLength(0);
    });

    it('rejects quantity 0 and 100', async () => {
      expect(await errorsFor(UpdateCartItemDto, { quantity: 0 })).not.toHaveLength(0);
      expect(await errorsFor(UpdateCartItemDto, { quantity: 100 })).not.toHaveLength(0);
    });

    it('requires a quantity', async () => {
      expect(await errorsFor(UpdateCartItemDto, {})).not.toHaveLength(0);
    });
  });
});
