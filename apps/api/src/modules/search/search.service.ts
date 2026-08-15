import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(query: string, userId: string, role: string, restaurantId?: string) {
    const term = query.trim();
    if (!term || term.length < 2) {
      return { pages: [], results: {} };
    }

    const results: any = {
      pages: [],
      restaurants: [],
      orders: [],
      menuItems: [],
      staff: [],
      tables: [],
    };

    // 1. Pages Navigation (Quick Navigation matching term)
    const allPages = [
      { label: 'Dashboard', href: '/dashboard', roles: ['OWNER', 'ADMIN', 'MANAGER', 'PLATFORM_ADMIN'] },
      { label: 'Platform Settings', href: '/platform-admin', roles: ['PLATFORM_ADMIN'] },
      { label: 'Subscriptions List', href: '/subscriptions', roles: ['PLATFORM_ADMIN', 'OWNER'] },
      { label: 'Order History', href: '/orders', roles: ['OWNER', 'ADMIN', 'MANAGER', 'WAITER', 'STAFF', 'KITCHEN'] },
      { label: 'Kitchen Screen', href: '/kitchen', roles: ['OWNER', 'ADMIN', 'MANAGER', 'KITCHEN'] },
      { label: 'Waiter Dashboard', href: '/waiter', roles: ['OWNER', 'ADMIN', 'MANAGER', 'WAITER'] },
      { label: 'Cashier Dashboard', href: '/cashier', roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] },
      { label: 'Dining Areas', href: '/dining-areas', roles: ['OWNER', 'ADMIN', 'MANAGER'] },
      { label: 'Tables Configuration', href: '/tables', roles: ['OWNER', 'ADMIN', 'MANAGER'] },
      { label: 'Menu Catalogs', href: '/menus', roles: ['OWNER', 'ADMIN', 'MANAGER'] },
      { label: 'Staff Configuration', href: '/users', roles: ['OWNER', 'ADMIN'] },
      { label: 'User Profile', href: '/profile', roles: ['OWNER', 'ADMIN', 'MANAGER', 'WAITER', 'KITCHEN', 'STAFF'] },
      { label: 'System Settings', href: '/settings', roles: ['OWNER', 'ADMIN', 'MANAGER', 'PLATFORM_ADMIN'] },
    ];

    results.pages = allPages.filter(p =>
      p.roles.includes(role) &&
      p.label.toLowerCase().includes(term.toLowerCase())
    );

    // 2. Database Resources Search (scoped by role and tenant isolation)
    if (role === 'PLATFORM_ADMIN') {
      // Platform Admin can search restaurants, tenants, users
      results.restaurants = await this.prisma.restaurant.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { slug: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, slug: true },
      });
      return results;
    }

    // Must have active restaurant context for non-platform admin searches
    if (!restaurantId) {
      return results;
    }

    // Scoped queries to prevent cross-tenant leak:
    // A. Search Menu Items
    if (['OWNER', 'ADMIN', 'MANAGER', 'WAITER', 'STAFF', 'KITCHEN'].includes(role)) {
      results.menuItems = await this.prisma.menuItem.findMany({
        where: {
          category: {
            menu: {
              restaurantId: restaurantId,
            },
          },
          name: { contains: term, mode: 'insensitive' },
        },
        take: 5,
        select: { id: true, name: true, price: true },
      });
    }

    // B. Search Orders
    if (['OWNER', 'ADMIN', 'MANAGER', 'WAITER', 'STAFF', 'KITCHEN'].includes(role)) {
      const orderStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];
      const isStatusEnum = orderStatuses.includes(term.toUpperCase());

      results.orders = await this.prisma.order.findMany({
        where: {
          restaurantId: restaurantId,
          OR: [
            { orderNumber: { contains: term, mode: 'insensitive' } },
            ...(isStatusEnum ? [{ status: term.toUpperCase() as any }] : []),
          ],
        },
        take: 5,
        select: { id: true, orderNumber: true, status: true, totalAmount: true },
      });
    }

    // C. Search Tables
    if (['OWNER', 'ADMIN', 'MANAGER', 'WAITER'].includes(role)) {
      results.tables = await this.prisma.table.findMany({
        where: {
          diningArea: {
            branch: {
              restaurantId: restaurantId,
            },
          },
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { code: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, code: true },
      });
    }

    // D. Search Staff
    if (['OWNER', 'ADMIN', 'MANAGER'].includes(role)) {
      const tenantRest = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { tenantId: true },
      });
      if (tenantRest) {
        const memberships = await this.prisma.tenantMembership.findMany({
          where: {
            tenantId: tenantRest.tenantId,
            user: {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
              ],
            },
          },
          take: 5,
          select: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        });
        results.staff = memberships.map(m => m.user);
      }
    }

    return results;
  }
}
