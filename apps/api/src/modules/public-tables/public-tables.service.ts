import crypto from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  CacheKeys,
  CacheTtl,
  TtlCacheService,
} from '../../common/cache/ttl-cache.service';

@Injectable()
export class PublicTablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async resolveTableToken(token: string) {
    const cleanToken = token.trim();
    return this.cache.wrap(
      CacheKeys.tableToken(cleanToken),
      CacheTtl.tableToken,
      async () => {
        const tableSelect = {
          id: true,
          name: true,
          code: true,
          capacity: true,
          status: true,
          diningArea: {
            select: {
              id: true,
              name: true,
              status: true,
              branch: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  restaurant: {
                    select: {
                      id: true,
                      name: true,
                      status: true,
                      tenant: {
                        select: { id: true, name: true, status: true },
                      },
                    },
                  },
                },
              },
            },
          },
        };

        const table = await this.prisma.table.findFirst({
          where: {
            OR: [
              { publicToken: cleanToken },
              { id: cleanToken },
              { publicToken: `tbl_${cleanToken.replace(/-/g, '')}` },
              { publicToken: `tbl_${cleanToken}` },
            ],
          },
          select: tableSelect,
        });

        if (!table)
          throw new NotFoundException('Table QR code is no longer active');

        const { diningArea } = table;
        const branch = diningArea?.branch;
        const restaurant = branch?.restaurant;
        const tenant = restaurant?.tenant;

        if (!diningArea || !branch || !restaurant || !tenant) {
          throw new NotFoundException('Table structure is incomplete');
        }

        if (
          table.status !== 'ACTIVE' ||
          diningArea.status !== 'ACTIVE' ||
          branch.status !== 'ACTIVE' ||
          restaurant.status !== 'ACTIVE' ||
          tenant.status !== 'ACTIVE'
        ) {
          throw new NotFoundException('Table QR code is no longer active');
        }

        return {
          table: {
            id: table.id,
            name: table.name,
            code: table.code,
            capacity: table.capacity,
          },
          diningArea: { name: diningArea.name },
          branch: { id: branch.id, name: branch.name },
          restaurant: { id: restaurant.id, name: restaurant.name },
        };
      },
    );
  }

  /**
   * Read-only lookup for the current active session without creating a new session row.
   * Prevents customer polling from reviving cleared/ended tables.
   */
  async getActiveSessionRecord(token: string) {
    const resolved = await this.resolveTableToken(token);
    const session = await this.prisma.customerSession.findFirst({
      where: { tableId: resolved.table.id, status: 'ACTIVE' },
      orderBy: { startedAt: 'desc' },
    });
    return { session, resolved };
  }

  /**
   * Resolves the QR token and returns the live customer session row alongside the
   * resolved table context. Other public modules (cart, orders) need the session id,
   * so session creation lives here and is reused instead of duplicated.
   */
  async getOrCreateSessionRecord(token: string) {
    const resolved = await this.resolveTableToken(token);
    let session = await this.prisma.customerSession.findFirst({
      where: { tableId: resolved.table.id, status: 'ACTIVE' },
      orderBy: { startedAt: 'desc' },
    });
    if (!session) {
      const sessionToken = `cs_${crypto.randomUUID().replace(/-/g, '')}`;
      session = await this.prisma.customerSession.create({
        data: { tableId: resolved.table.id, sessionToken, status: 'ACTIVE' },
      });
      // Self-healing: if there are other duplicate active sessions for this table, end them
      await this.prisma.customerSession.updateMany({
        where: {
          tableId: resolved.table.id,
          status: 'ACTIVE',
          id: { not: session.id },
        },
        data: { status: 'ENDED', endedAt: new Date() },
      });
    }
    return { session, resolved };
  }

  async getOrCreateSession(token: string) {
    const { session, resolved } = await this.getOrCreateSessionRecord(token);
    return {
      sessionToken: session.sessionToken,
      status: session.status,
      startedAt: session.startedAt,
      ...resolved,
    };
  }

  async endSession(token: string) {
    const resolved = await this.resolveTableToken(token);
    this.cache.invalidate(CacheKeys.tableToken(token.trim()));
    await this.prisma.customerSession.updateMany({
      where: { tableId: resolved.table.id, status: 'ACTIVE' },
      data: { status: 'ENDED', endedAt: new Date() },
    });
    return { success: true, message: 'Active table sessions ended' };
  }

  async getPublicTableMenu(token: string) {
    const resolved = await this.resolveTableToken(token);

    const activeMenu = await this.cache.wrap(
      `public_menu:${resolved.restaurant.id}`,
      30_000,
      async () => {
        return this.prisma.menu.findFirst({
          where: { restaurantId: resolved.restaurant.id, status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            code: true,
            categories: {
              where: { status: 'ACTIVE' },
              orderBy: { position: 'asc' },
              select: {
                id: true,
                name: true,
                code: true,
                position: true,
                items: {
                  where: { status: 'ACTIVE' },
                  orderBy: { position: 'asc' },
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    description: true,
                    imageUrl: true,
                    price: true,
                    dietaryType: true,
                    foodType: true,
                    preparationTimeMinutes: true,
                    position: true,
                    taxRate: {
                      select: { name: true, type: true, value: true },
                    },
                    variantGroups: {
                      orderBy: { position: 'asc' },
                      select: {
                        id: true,
                        name: true,
                        required: true,
                        position: true,
                        variants: {
                          where: { status: 'ACTIVE' },
                          orderBy: { position: 'asc' },
                          select: {
                            id: true,
                            name: true,
                            price: true,
                            position: true,
                          },
                        },
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
                        position: true,
                        addons: {
                          where: { status: 'ACTIVE' },
                          orderBy: { position: 'asc' },
                          select: {
                            id: true,
                            name: true,
                            price: true,
                            position: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });
      },
    );

    if (!activeMenu)
      throw new NotFoundException('No active menu is currently available');

    return {
      restaurant: { name: resolved.restaurant.name },
      branch: { name: resolved.branch.name },
      diningArea: { name: resolved.diningArea.name },
      table: { name: resolved.table.name },
      menu: { name: activeMenu.name },
      categories: activeMenu.categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        code: cat.code,
        position: cat.position,
        items: cat.items.map((item) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          description: item.description,
          imageUrl: item.imageUrl,
          price: Number(item.price),
          dietaryType: item.dietaryType,
          foodType: item.foodType,
          preparationTimeMinutes: item.preparationTimeMinutes,
          position: item.position,
          taxRate: item.taxRate
            ? {
                name: item.taxRate.name,
                type: item.taxRate.type,
                value: Number(item.taxRate.value),
              }
            : null,
          variantGroups: item.variantGroups.map((vg) => ({
            id: vg.id,
            name: vg.name,
            required: vg.required,
            position: vg.position,
            variants: vg.variants.map((v) => ({
              id: v.id,
              name: v.name,
              price: Number(v.price),
              position: v.position,
            })),
          })),
          addonGroups: item.addonGroups.map((ag) => ({
            id: ag.id,
            name: ag.name,
            required: ag.required,
            minSelect: ag.minSelect,
            maxSelect: ag.maxSelect,
            position: ag.position,
            addons: ag.addons.map((a) => ({
              id: a.id,
              name: a.name,
              price: Number(a.price),
              position: a.position,
            })),
          })),
        })),
      })),
    };
  }

  async getPublicMenuItem(token: string, itemId: string) {
    const resolved = await this.resolveTableToken(token);

    const item = await this.prisma.menuItem.findFirst({
      where: {
        id: itemId,
        status: 'ACTIVE',
        category: {
          status: 'ACTIVE',
          menu: { restaurantId: resolved.restaurant.id, status: 'ACTIVE' },
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        imageUrl: true,
        price: true,
        dietaryType: true,
        foodType: true,
        preparationTimeMinutes: true,
        taxRate: { select: { name: true, type: true, value: true } },
        category: { select: { name: true } },
        variantGroups: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            name: true,
            required: true,
            position: true,
            variants: {
              where: { status: 'ACTIVE' },
              orderBy: { position: 'asc' },
              select: { id: true, name: true, price: true, position: true },
            },
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
            position: true,
            addons: {
              where: { status: 'ACTIVE' },
              orderBy: { position: 'asc' },
              select: { id: true, name: true, price: true, position: true },
            },
          },
        },
      },
    });

    if (!item) throw new NotFoundException('Menu item not found');

    return {
      restaurant: { name: resolved.restaurant.name },
      table: { name: resolved.table.name },
      item: {
        id: item.id,
        name: item.name,
        code: item.code,
        description: item.description,
        imageUrl: item.imageUrl,
        price: Number(item.price),
        dietaryType: item.dietaryType,
        foodType: item.foodType,
        preparationTimeMinutes: item.preparationTimeMinutes,
        category: { name: item.category.name },
        taxRate: item.taxRate
          ? {
              name: item.taxRate.name,
              type: item.taxRate.type,
              value: Number(item.taxRate.value),
            }
          : null,
        variantGroups: item.variantGroups.map((vg) => ({
          id: vg.id,
          name: vg.name,
          required: vg.required,
          position: vg.position,
          variants: vg.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: Number(v.price),
            position: v.position,
          })),
        })),
        addonGroups: item.addonGroups.map((ag) => ({
          id: ag.id,
          name: ag.name,
          required: ag.required,
          minSelect: ag.minSelect,
          maxSelect: ag.maxSelect,
          position: ag.position,
          addons: ag.addons.map((a) => ({
            id: a.id,
            name: a.name,
            price: Number(a.price),
            position: a.position,
          })),
        })),
      },
    };
  }
}
