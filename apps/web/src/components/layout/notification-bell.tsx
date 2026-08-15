'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { apiClient } from '@/services/api-client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const [list, countRes] = await Promise.all([
        apiClient.get<Notification[]>('/automations/notifications/list'),
        apiClient.get<{ count: number }>('/automations/notifications/unread-count'),
      ]);
      setNotifications(list);
      setUnreadCount(countRes.count);
    } catch {
      // Silently fail for non-critical feature
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/automations/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const typeIcon: Record<string, string> = {
    ALERT: '⚡',
    REPORT: '📊',
    AI_INSIGHT: '🤖',
    SYSTEM: '🔔',
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg border border-[#26313C] bg-[#18212B]/85 hover:border-[#2AFEB7] hover:bg-[#18212B] px-2.5 py-2 text-sm transition-all"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 max-h-[420px] overflow-y-auto rounded-xl border border-[#26313C] bg-[#111820] shadow-2xl">
          <div className="sticky top-0 bg-[#111820] border-b border-[#26313C] px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F7FA]">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] text-[#2AFEB7] font-medium">
                {unreadCount} unread
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#9AA6B2]">
              No notifications yet
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.isRead) markAsRead(n.id);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-[#26313C]/50 hover:bg-[#18212B] transition-colors ${
                    !n.isRead ? 'bg-[#18212B]/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5">{typeIcon[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-medium truncate ${
                          !n.isRead ? 'text-[#F5F7FA]' : 'text-[#9AA6B2]'
                        }`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-[#2AFEB7] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#9AA6B2] mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-[#9AA6B2]/60 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
