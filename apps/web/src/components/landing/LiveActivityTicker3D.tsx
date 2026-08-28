'use client';

import React, { useState, useEffect } from 'react';

interface ActivityItem {
  id: number;
  icon: string;
  title: string;
  detail: string;
  time: string;
  badge: string;
  badgeColor: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: 1,
    icon: '📱',
    title: 'New QR Round 2 Order',
    detail: 'Table 4 placed order for 2x Cold Brew (#AT-0028)',
    time: 'just now',
    badge: 'QR Dine-In',
    badgeColor: 'bg-primary/20 text-primary border-primary/30',
  },
  {
    id: 2,
    icon: '👨‍🍳',
    title: 'Kitchen Marked Ticket Ready',
    detail: 'Order #AT-0025 (Truffle Alfredo) is ready for pickup',
    time: '12s ago',
    badge: 'KDS',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
  {
    id: 3,
    icon: '💳',
    title: 'Seat UPI Payment Settled',
    detail: 'Table 2 cleared bill of ₹1,240.00 via PhonePe QR',
    time: '34s ago',
    badge: 'Settlement',
    badgeColor: 'bg-primary/20 text-primary border-primary/30',
  },
  {
    id: 4,
    icon: '🛡️',
    title: 'Cancellation Reviewed',
    detail: 'Manager approved beverage cancellation for Table 7',
    time: '1m ago',
    badge: 'Security',
    badgeColor: 'bg-[#A855F7]/20 text-[#A855F7] border-[#A855F7]/30',
  },
  {
    id: 5,
    icon: '📦',
    title: 'AI Auto-Stock Depletion',
    detail: 'Deducted 400g Chicken & 200g Cream from Central Stock',
    time: '2m ago',
    badge: 'Inventory AI',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
];

export function LiveActivityTicker3D() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mockActivities.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  const current = mockActivities[currentIndex];

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm hidden sm:block">
      <div
        key={current.id}
        className="flex items-center gap-3.5 rounded-2xl border border-border bg-card/95 p-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500 hover:border-primary/50"
        style={{
          animation: 'slideUpFade 0.4s ease-out',
        }}
      >
        <div className="h-10 w-10 shrink-0 rounded-xl bg-secondary border border-border flex items-center justify-center text-lg shadow-inner">
          {current.icon}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground truncate">{current.title}</span>
            <span className={`shrink-0 rounded-md border px-1.5 py-0.2 text-[9px] font-black uppercase ${current.badgeColor}`}>
              {current.badge}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{current.detail}</p>
          <p className="text-[9px] text-primary font-mono font-semibold">{current.time}</p>
        </div>
      </div>
    </div>
  );
}
