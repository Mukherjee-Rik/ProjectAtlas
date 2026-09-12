import { getPublicCustomerMenu } from '@/services/public-tables.service';
import { getPublicOrderById, getPublicOrders } from '@/services/orders.service';
import type { PublicCustomerMenu } from '@/types/menu';
import type { Order } from '@/types/order';

/**
 * Query keys and fetchers shared by every screen under /t/[token].
 *
 * On this flow the QR token IS the scope: it resolves server-side to exactly
 * one table of one branch, so it belongs in every key — a key of just
 * ['public-menu'] would hand one table's session data to the next scan.
 *
 * Keeping them in one module is what makes the menu -> item -> cart -> back hop
 * free: each screen reads the payload the previous one already fetched instead
 * of re-requesting it over the restaurant's wifi.
 */
export const publicKeys = {
  menu: (token: string) => ['public-menu', token] as const,
  orders: (token: string) => ['public-orders', token] as const,
  order: (token: string, orderId: string) => ['public-order', token, orderId] as const,
};

export function publicMenuQuery(token: string) {
  return {
    queryKey: publicKeys.menu(token),
    queryFn: async (): Promise<PublicCustomerMenu> => (await getPublicCustomerMenu(token)).data,
    // A menu barely changes inside one service, and the diner walks this route
    // several times per meal.
    staleTime: 60_000,
    enabled: Boolean(token),
  };
}

export function publicOrdersQuery(token: string) {
  return {
    queryKey: publicKeys.orders(token),
    queryFn: async (): Promise<Order[]> => (await getPublicOrders(token)).data ?? [],
    enabled: Boolean(token),
  };
}

export function publicOrderQuery(token: string, orderId: string) {
  return {
    queryKey: publicKeys.order(token, orderId),
    queryFn: async (): Promise<Order> => (await getPublicOrderById(token, orderId)).data,
    enabled: Boolean(token) && Boolean(orderId),
  };
}
