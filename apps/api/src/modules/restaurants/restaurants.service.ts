import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createRestaurantDto: CreateRestaurantDto) {
    const { name, slug, status } = createRestaurantDto;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const existingRestaurant = await this.prisma.restaurant.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
    });

    if (existingRestaurant) {
      throw new ConflictException(
        'A restaurant with this slug already exists under this tenant',
      );
    }

    return this.prisma.restaurant.create({
      data: {
        tenantId,
        name,
        slug,
        ...(status !== undefined && { status }),
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.restaurant.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string, tenantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        id,
        tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async findAllGlobal() {
    return this.prisma.restaurant.findMany({
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllAdminWithMetrics() {
    const restaurants = await this.prisma.restaurant.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        branches: {
          include: {
            diningAreas: {
              include: {
                tables: true,
              },
            },
          },
        },
        orders: {
          select: { id: true, status: true, totalAmount: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return restaurants.map((r) => {
      const activeSubscription = r.subscriptions?.[0] || null;
      const totalSales = r.orders.reduce(
        (sum, o) => sum + Number(o.totalAmount || 0),
        0,
      );
      const completedOrders = r.orders.filter(
        (o) => o.status === 'COMPLETED' || o.status === 'SERVED',
      ).length;

      let tablesCount = 0;
      r.branches.forEach((b) => {
        b.diningAreas.forEach((da) => {
          tablesCount += da.tables.length;
        });
      });

      return {
        id: r.id,
        tenantId: r.tenantId,
        name: r.name,
        slug: r.slug,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        tenantName: r.tenant?.name || 'Unknown Tenant',
        planName: activeSubscription?.plan?.name || 'Free',
        planStatus: activeSubscription?.status || 'TRIALING',
        branchesCount: r.branches.length,
        tablesCount,
        totalOrders: r.orders.length,
        completedOrders,
        totalSales,
      };
    });
  }

  async findAdminDetail(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            memberships: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        branches: {
          include: {
            diningAreas: {
              include: {
                tables: {
                  include: {
                    customerSessions: {
                      where: { status: 'ACTIVE' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
        menus: {
          include: {
            categories: {
              include: {
                items: true,
              },
            },
          },
        },
        orders: {
          include: {
            items: true,
            table: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
        supportTickets: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    // Compute sales analytics
    const allOrders = restaurant.orders;
    const totalSales = allOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount || 0),
      0,
    );
    const completedOrders = allOrders.filter(
      (o) => o.status === 'COMPLETED' || o.status === 'SERVED',
    );
    const completedSales = completedOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount || 0),
      0,
    );
    const averageOrderValue =
      completedOrders.length > 0 ? completedSales / completedOrders.length : 0;

    const ordersByStatus = allOrders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Collect all tables across branches & dining areas
    const allTables: Array<{
      id: string;
      name: string;
      code: string;
      capacity: number;
      status: string;
      publicToken: string;
      diningAreaName: string;
      branchName: string;
      hasActiveSession: boolean;
    }> = [];

    restaurant.branches.forEach((b) => {
      b.diningAreas.forEach((da) => {
        da.tables.forEach((t) => {
          allTables.push({
            id: t.id,
            name: t.name,
            code: t.code,
            capacity: t.capacity,
            status: t.status,
            publicToken: t.publicToken,
            diningAreaName: da.name,
            branchName: b.name,
            hasActiveSession: t.customerSessions.length > 0,
          });
        });
      });
    });

    // Total menu items count
    let totalMenuItems = 0;
    let totalCategories = 0;
    restaurant.menus.forEach((m) => {
      totalCategories += m.categories.length;
      m.categories.forEach((c) => {
        totalMenuItems += c.items.length;
      });
    });

    const activeSub = restaurant.subscriptions?.[0] || null;

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        status: restaurant.status,
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt,
      },
      tenant: {
        id: restaurant.tenant?.id,
        name: restaurant.tenant?.name,
        slug: restaurant.tenant?.slug,
      },
      subscription: activeSub
        ? {
            id: activeSub.id,
            planName: activeSub.plan.name,
            planPrice: Number(activeSub.plan.price),
            planFeatures: activeSub.plan.features,
            planLimits: activeSub.plan.limits,
            status: activeSub.status,
            trialEnd: activeSub.trialEnd,
            currentPeriodEnd: activeSub.currentPeriodEnd,
          }
        : null,
      salesMetrics: {
        totalSales,
        completedSales,
        totalOrdersCount: allOrders.length,
        completedOrdersCount: completedOrders.length,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        ordersByStatus,
      },
      usersAndPermissions: (restaurant.tenant?.memberships || []).map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        phone: m.user.phone,
        membershipRole: m.role,
        systemRole: m.user.role,
        status: m.user.status,
        joinedAt: m.createdAt,
      })),
      branches: restaurant.branches.map((b) => ({
        id: b.id,
        name: b.name,
        address: b.address,
        phone: b.phone,
        diningAreas: b.diningAreas.map((da) => ({
          id: da.id,
          name: da.name,
          tablesCount: da.tables.length,
        })),
      })),
      tables: allTables,
      menusSummary: {
        totalMenus: restaurant.menus.length,
        totalCategories,
        totalMenuItems,
        menus: restaurant.menus.map((m) => ({
          id: m.id,
          name: m.name,
          code: m.code,
          status: m.status,
          categoriesCount: m.categories.length,
        })),
      },
      recentOrders: restaurant.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        tableName: o.table?.name || 'Table',
        itemsCount: o.items.length,
        createdAt: o.createdAt,
      })),
      supportTickets: restaurant.supportTickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        category: t.category,
        priority: t.priority,
        status: t.status,
        subject: t.subject,
        createdAt: t.createdAt,
        resolvedAt: t.resolvedAt,
      })),
    };
  }
}
