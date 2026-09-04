'use client';

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Sparkles,
  Check,
  Wifi,
  ArrowRight,
  RotateCcw,
  Utensils,
  Bell,
  Smartphone,
  QrCode,
  Zap,
} from 'lucide-react';

interface DishItem {
  id: string;
  name: string;
  price: number;
  category: string;
  badge?: string;
  description: string;
  prepTime: string;
  icon: string;
}

const SAMPLE_DISHES: DishItem[] = [
  {
    id: 'd1',
    name: 'Truffle Wild Mushroom Risotto',
    price: 480,
    category: 'Mains',
    badge: "Chef's Special",
    description: 'Arborio rice, porcini glaze & parmesan crisp',
    prepTime: '12m',
    icon: '🥘',
  },
  {
    id: 'd2',
    name: 'Artisan Iced Caramel Macchiato',
    price: 240,
    category: 'Beverage',
    badge: 'Popular',
    description: 'Double espresso, salted caramel, oat milk',
    prepTime: '4m',
    icon: '☕',
  },
];

const TABLES = [
  { id: 'T-04', name: 'Table 04', area: 'Garden Terrace' },
  { id: 'T-12', name: 'Table 12', area: 'Main Dining' },
  { id: 'P-02', name: 'Patio 02', area: 'Deck' },
];

export function InteractiveTableStandee({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTable, setSelectedTable] = useState(TABLES[0]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [activeMobileTab, setActiveMobileTab] = useState<'standee' | 'menu'>('standee');
  const [isDispatching, setIsDispatching] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [addedItemKey, setAddedItemKey] = useState<string | null>(null);
  const [lastTicketNumber, setLastTicketNumber] = useState<number>(284);

  // Mouse physics for 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], [10, 90]), springConfig);
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, 90]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const resetDemo = () => {
    setCartCount(0);
    setCartTotal(0);
    setOrderSent(false);
    setIsDispatching(false);
    setActiveMobileTab('standee');
  };

  const addItemToCart = (dish: DishItem) => {
    setCartCount((prev) => prev + 1);
    setCartTotal((prev) => prev + dish.price);
    setAddedItemKey(dish.id);
    setTimeout(() => {
      setAddedItemKey(null);
    }, 700);
  };

  const sendOrderToKitchen = () => {
    if (cartCount === 0 || isDispatching) return;
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      setOrderSent(true);
      setLastTicketNumber((prev) => prev + 1);
      setTimeout(() => {
        setCartCount(0);
        setCartTotal(0);
      }, 3500);
    }, 600);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full max-w-full select-none ${className}`}
      style={{ perspective: 1200 }}
    >
      {/* Ambient glowing backdrop glow */}
      <div className="pointer-events-none absolute -inset-2 sm:-inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500/10 via-primary/10 to-amber-500/10 blur-xl opacity-80" />

      {/* Main 3D Container Box */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-gradient-to-b from-card/95 via-card/85 to-card/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl"
      >
        {/* Dynamic Glare Shimmer */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl opacity-15"
          style={{
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.4) 0%, transparent 65%)`,
          }}
        />

        {/* ═══ Top Control Bar ═══ */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 sm:pb-3.5">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-500">
              Live Table Standee
            </span>
          </div>

          {/* Table Switcher Pills & Reset */}
          <div className="flex items-center gap-1">
            {TABLES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTable(t)}
                className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold transition-all ${
                  selectedTable.id === t.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {t.id}
              </button>
            ))}
            <button
              type="button"
              onClick={resetDemo}
              title="Reset Live Demo"
              className="ml-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* ═══ Mobile View Switcher Tabs (Only below sm screen width) ═══ */}
        <div className="mt-3 flex sm:hidden rounded-lg bg-secondary/80 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveMobileTab('standee')}
            className={`flex-1 rounded-md py-1 text-center transition-all flex items-center justify-center gap-1.5 ${
              activeMobileTab === 'standee'
                ? 'bg-background text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <QrCode className="h-3.5 w-3.5 text-emerald-500" />
            <span>Table Standee</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('menu')}
            className={`flex-1 rounded-md py-1 text-center transition-all flex items-center justify-center gap-1.5 ${
              activeMobileTab === 'menu'
                ? 'bg-background text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 text-primary" />
            <span>Guest Menu</span>
            {cartCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* ═══ Main Stage: Standee + Live Menu ═══ */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch gap-4 sm:gap-5 min-w-0">
          
          {/* ================= LEFT: 3D Acrylic & Wood Table Standee ================= */}
          <div
            className={`flex-col items-center justify-center sm:w-[185px] md:w-[195px] lg:w-[205px] shrink-0 ${
              activeMobileTab === 'standee' ? 'flex' : 'hidden sm:flex'
            }`}
          >
            {/* Acrylic Glass Plaque */}
            <div
              className="relative w-full max-w-[210px] rounded-2xl border border-white/25 bg-gradient-to-b from-white/20 via-white/10 to-white/15 p-3.5 shadow-xl backdrop-blur-md dark:border-white/15 dark:from-white/10 dark:via-white/5 dark:to-white/10"
              style={{
                boxShadow:
                  '0 15px 35px -10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
              }}
            >
              {/* Brass Screw Caps */}
              <div className="absolute left-2 top-2 h-2 w-2 rounded-full bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-100 shadow-sm" />
              <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-100 shadow-sm" />

              {/* Standee Header */}
              <div className="pt-0.5 pb-2 text-center">
                <div className="inline-flex items-center gap-1 rounded-full bg-black/10 dark:bg-white/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-foreground">
                  <span>☕</span>
                  <span>Kafei Café</span>
                </div>
                <h4 className="mt-1 font-display text-base font-black tracking-tight text-foreground">
                  {selectedTable.name}
                </h4>
                <p className="font-mono text-[9px] text-muted-foreground">{selectedTable.area}</p>
              </div>

              {/* QR Code Container with Animated Laser Scanner */}
              <div className="relative mx-auto flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-xl bg-white p-2.5 shadow-inner">
                {/* Crisp SVG QR Code */}
                <svg
                  viewBox="0 0 100 100"
                  className="h-full w-full select-none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer corner finder 1 */}
                  <rect x="2" y="2" width="28" height="28" rx="4" fill="#09090b" />
                  <rect x="6" y="6" width="20" height="20" rx="2" fill="#ffffff" />
                  <rect x="10" y="10" width="12" height="12" rx="1.5" fill="#10b981" />

                  {/* Outer corner finder 2 */}
                  <rect x="70" y="2" width="28" height="28" rx="4" fill="#09090b" />
                  <rect x="74" y="6" width="20" height="20" rx="2" fill="#ffffff" />
                  <rect x="78" y="10" width="12" height="12" rx="1.5" fill="#10b981" />

                  {/* Outer corner finder 3 */}
                  <rect x="2" y="70" width="28" height="28" rx="4" fill="#09090b" />
                  <rect x="6" y="74" width="20" height="20" rx="2" fill="#ffffff" />
                  <rect x="10" y="78" width="12" height="12" rx="1.5" fill="#10b981" />

                  {/* QR Matrix Elements */}
                  <rect x="36" y="6" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="46" y="6" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="56" y="10" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="36" y="18" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="46" y="24" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="56" y="24" width="6" height="6" rx="1" fill="#09090b" />

                  <rect x="6" y="36" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="18" y="36" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="6" y="46" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="24" y="46" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="12" y="56" width="6" height="6" rx="1" fill="#09090b" />

                  <rect x="72" y="36" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="84" y="36" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="78" y="46" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="88" y="56" width="6" height="6" rx="1" fill="#09090b" />

                  <rect x="36" y="72" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="48" y="72" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="58" y="82" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="38" y="86" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="48" y="86" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="72" y="72" width="6" height="6" rx="1" fill="#09090b" />
                  <rect x="84" y="84" width="6" height="6" rx="1" fill="#09090b" />

                  {/* Center Coffee Emblem */}
                  <circle cx="50" cy="50" r="14" fill="#ffffff" />
                  <circle cx="50" cy="50" r="11" fill="#10b981" />
                  <path d="M46 54C46 54 45 47 50 47C55 47 54 54 54 54H46Z" fill="#ffffff" />
                  <path
                    d="M54 49C55.5 49 56.5 50 56.5 51.5C56.5 53 55.5 54 54 54"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    fill="none"
                  />
                </svg>

                {/* Animated Laser Scanning Beam */}
                <motion.div
                  animate={{
                    y: ['-42px', '42px', '-42px'],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="pointer-events-none absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#10b981]"
                />

                {/* Camera Reticle Brackets */}
                <div className="pointer-events-none absolute inset-1.5 flex items-center justify-center rounded-lg border border-emerald-500/30">
                  <div className="absolute -top-0.5 -left-0.5 h-2.5 w-2.5 border-t-2 border-l-2 border-emerald-500" />
                  <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 border-t-2 border-r-2 border-emerald-500" />
                  <div className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 border-b-2 border-l-2 border-emerald-500" />
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 border-b-2 border-r-2 border-emerald-500" />
                </div>
              </div>

              {/* NFC Chip Indicator */}
              <div className="mt-2.5 text-center">
                <div className="inline-flex items-center gap-1 text-[9px] font-semibold text-foreground/90">
                  <Wifi className="h-2.5 w-2.5 rotate-90 text-emerald-500" />
                  <span>NFC Tap or Camera Scan</span>
                </div>
                <p className="mt-0.5 text-[8px] text-muted-foreground">No app download needed</p>
              </div>
            </div>

            {/* Teak Wood Base */}
            <div
              className="relative -mt-1.5 flex h-4 w-44 sm:w-48 items-center justify-center rounded-md border-t border-[#a16b3b]/60 bg-gradient-to-r from-[#5c3a21] via-[#85532b] to-[#5c3a21] shadow-xl"
              style={{
                boxShadow: '0 8px 20px -4px rgba(0,0,0,0.4)',
              }}
            >
              <span className="font-mono text-[7px] font-black uppercase tracking-[0.2em] text-[#f2d49c] opacity-90">
                Kafei • Smart Table
              </span>
            </div>

            {/* Mobile Helper: Tap to open menu */}
            <button
              type="button"
              onClick={() => setActiveMobileTab('menu')}
              className="mt-3 sm:hidden inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400"
            >
              <span>Open Menu Demo</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* ================= RIGHT: Live Guest Ordering PWA ================= */}
          <div
            className={`min-w-0 flex-1 flex-col justify-between space-y-3 ${
              activeMobileTab === 'menu' ? 'flex' : 'hidden sm:flex'
            }`}
          >
            {/* Header / Speed Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span className="truncate">Instant Guest Ordering</span>
                </span>
                <h4 className="font-display text-xs sm:text-sm font-bold text-foreground truncate">
                  Scan & Order Experience
                </h4>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-500">
                ⚡ 0.4s to KDS
              </span>
            </div>

            {/* Menu Items List (Fluid, No Horizontal Overflow) */}
            <div className="space-y-2.5 min-w-0">
              {SAMPLE_DISHES.map((dish) => {
                const isJustAdded = addedItemKey === dish.id;

                return (
                  <motion.div
                    key={dish.id}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className="group relative flex items-center justify-between gap-2.5 rounded-xl border border-border/70 bg-secondary/50 p-2.5 transition-all hover:border-emerald-500/40 hover:bg-secondary/80 min-w-0"
                  >
                    {/* Left Dish Details */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background text-lg shadow-sm">
                        {dish.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="text-[11px] sm:text-xs font-bold text-foreground leading-tight truncate">
                            {dish.name}
                          </h5>
                          {dish.badge && (
                            <span className="shrink-0 rounded bg-emerald-500/10 px-1 py-0.2 text-[8px] font-bold text-emerald-500">
                              {dish.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
                          {dish.description}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 font-mono text-[9px] text-muted-foreground">
                          <span className="font-bold text-foreground text-[10px]">₹{dish.price}</span>
                          <span>•</span>
                          <span>⏳ {dish.prepTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Add to Cart Action Button */}
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => addItemToCart(dish)}
                      className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm ${
                        isJustAdded
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white active:bg-emerald-700'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <span>Add</span>
                          <span className="text-xs leading-none">+</span>
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>

            {/* Tray Summary & Send to Kitchen Button */}
            <div className="rounded-xl border border-border/70 bg-background/80 p-2.5 shadow-sm flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-black text-white"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-foreground truncate">
                    {cartCount === 0
                      ? 'Tray is empty'
                      : `${cartCount} dish${cartCount > 1 ? 'es' : ''} on ${selectedTable.id}`}
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground truncate">
                    {cartCount === 0 ? 'Click "Add +" above' : `Total: ₹${cartTotal}`}
                  </div>
                </div>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                disabled={cartCount === 0 || isDispatching}
                onClick={sendOrderToKitchen}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                  cartCount > 0
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    : 'bg-secondary text-muted-foreground opacity-40 cursor-not-allowed'
                }`}
              >
                <span>{isDispatching ? 'Dispatching...' : 'Send to Kitchen'}</span>
                <ArrowRight className="h-3 w-3" />
              </motion.button>
            </div>

            {/* Live Kitchen KDS Ticket Alert */}
            <AnimatePresence>
              {orderSent && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400 flex items-center justify-between gap-2 shadow-md"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white font-black text-[9px]">
                      ✓
                    </span>
                    <span className="font-semibold text-foreground text-[10.5px] truncate">
                      Sent to KDS Ticket #{lastTicketNumber} on {selectedTable.name}!
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-emerald-500 font-bold shrink-0">
                    KDS Alert 🔔
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ═══ Bottom Footer Hint ═══ */}
        <div className="mt-3.5 flex items-center justify-between border-t border-border/50 pt-2.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5 truncate">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span className="truncate">Interactive 3D Demo • Tilt with mouse or add dishes</span>
          </span>
          <span className="font-mono text-[9px] shrink-0 text-muted-foreground/80 hidden sm:inline">
            Zero Hardware Leases
          </span>
        </div>
      </motion.div>
    </div>
  );
}
