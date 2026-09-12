'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Bell, Bot, Zap, type LucideIcon } from 'lucide-react';

import { apiClient } from '@/services/api-client';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useVisiblePollInterval } from '@/hooks/use-live-query';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Both keys carry the restaurant id. The endpoints answer for whichever
 * restaurant the session is currently in, so a key without it would hand one
 * restaurant's notifications to the next one the user switches to.
 */
function notificationListKey(restaurantId: string | null) {
  return ['notifications', 'list', restaurantId] as const;
}

function notificationCountKey(restaurantId: string | null) {
  return ['notifications', 'unread-count', restaurantId] as const;
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  ALERT: Zap,
  REPORT: BarChart3,
  AI_INSIGHT: Bot,
  SYSTEM: Bell,
};

export function NotificationBell() {
  const { currentRestaurantId } = useRestaurant();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // The bell sits in the header of every protected page, so a KDS or cashier
  // tablet left open all shift used to fire two authenticated requests every
  // 30s forever — including the whole time nobody was looking at the tab. The
  // interval goes false while the document is hidden and resumes on return.
  const refetchInterval = useVisiblePollInterval(30_000);
  const isEnabled = Boolean(currentRestaurantId);

  const listQuery = useQuery({
    queryKey: notificationListKey(currentRestaurantId),
    queryFn: async () => {
      const res = await apiClient.get<unknown>('/automations/notifications/list');
      const list = (res as { data?: unknown } | null)?.data ?? res;
      return (Array.isArray(list) ? list : []) as Notification[];
    },
    enabled: isEnabled,
    refetchInterval,
  });

  const countQuery = useQuery({
    queryKey: notificationCountKey(currentRestaurantId),
    queryFn: async () => {
      const res = await apiClient.get<unknown>('/automations/notifications/unread-count');
      const data = ((res as { data?: unknown } | null)?.data ?? res) as
        | { count?: number; unreadCount?: number }
        | null;
      if (typeof data?.count === 'number') return data.count;
      if (typeof data?.unreadCount === 'number') return data.unreadCount;
      return 0;
    },
    enabled: isEnabled,
    refetchInterval,
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/automations/notifications/${id}/read`),
    onSuccess: () => {
      // Re-asking is cheaper than keeping a hand-patched copy honest: the count
      // endpoint is the authority and the list may have moved on anyway.
      queryClient.invalidateQueries({ queryKey: notificationListKey(currentRestaurantId) });
      queryClient.invalidateQueries({ queryKey: notificationCountKey(currentRestaurantId) });
    },
  });

  const notifications = listQuery.data ?? [];
  const unreadCount = countQuery.data ?? 0;

  // Only worth listening while there is something to dismiss — attached
  // unconditionally this ran a contains() check on every click in the app.
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick, { passive: true });
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const timeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const m = Math.floor(diff / 60000);
      if (m < 1) return 'Just now';
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      return `${Math.floor(h / 24)}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/85 text-foreground transition-all hover:border-primary hover:bg-secondary"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-atlas-error px-1 text-[11px] font-bold leading-none text-destructive-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        // The bell is not the rightmost control, so a fixed 20rem panel hung off
        // its right edge ran off the left of a 320px screen. Cap it to the
        // viewport instead, and to the visible viewport height so a landscape
        // phone does not get a panel taller than the screen.
        <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-1.5rem))] max-h-[min(420px,60dvh)] overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
          <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[11px] font-medium text-primary">
                {unreadCount} unread
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {listQuery.isPending ? 'Loading notifications…' : 'No notifications yet'}
            </div>
          ) : (
            <div>
              {notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Bell;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      if (!n.isRead) markAsRead.mutate(n.id);
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-secondary transition-colors ${
                      !n.isRead ? 'bg-secondary/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-medium truncate ${
                            !n.isRead ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
