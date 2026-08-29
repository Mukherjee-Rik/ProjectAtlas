'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useTenant } from '@/hooks/use-tenant';
import { useBranch } from '@/hooks/use-branch';
import { createFirstRestaurant, saveOnboardingSetup } from '@/services/auth.service';
import { setCurrentTenant } from '@/lib/tenant-storage';
import { setCurrentRestaurant } from '@/lib/restaurant-storage';
import { setCurrentBranch } from '@/lib/branch-storage';

const ONBOARDING_STEPS = [
  { id: 1, title: 'Restaurant Profile', icon: '🏢', desc: 'Identity & currency' },
  { id: 2, title: 'Floor & Tables', icon: '📍', desc: 'Dining area & tables' },
  { id: 3, title: 'QR Ordering', icon: '📱', desc: 'Generate table QR codes' },
  { id: 4, title: 'Menu Catalog', icon: '🍽️', desc: 'Categories & dishes' },
  { id: 5, title: 'Staff & Roles', icon: '👥', desc: 'Invite chef & waitstaff' },
  { id: 6, title: 'Payment & Launch', icon: '💳', desc: 'Billing & Go-Live' },
];

/** Table sizes a dine-in floor is actually built from. */
const SEAT_SIZES = [2, 4, 6] as const;

/**
 * Proposes a plausible floor mix from a total table count, so the operator
 * adjusts numbers instead of inventing a layout from nothing. Roughly a third
 * two-seaters, a handful of large tables, the rest four-seaters.
 */
function suggestSeatingMix(total: number): Record<number, number> {
  const t = Math.max(0, Math.min(200, Math.floor(total || 0)));
  if (t === 0) return { 2: 0, 4: 0, 6: 0 };
  const twos = Math.round(t * 0.3);
  const sixes = Math.floor(t * 0.15);
  return { 2: twos, 4: Math.max(0, t - twos - sixes), 6: sixes };
}

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹) — Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'USD ($) — US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) — Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) — Pound Sterling' },
  { code: 'AED', symbol: 'AED', label: 'AED — UAE Dirham' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$) — Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$) — Australian Dollar' },
];

type PaymentKey = 'cash' | 'upi' | 'card';

const PAYMENT_METHODS: { key: PaymentKey; title: string; desc: string }[] = [
  { key: 'cash', title: '💵 Cash at Table / POS', desc: 'Collected by your floor staff' },
  { key: 'upi', title: '📱 Dynamic UPI Intent', desc: 'Scan-to-pay at the table' },
  { key: 'card', title: '💳 Card Terminal (POS)', desc: 'Integrated settlement' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loginUser } = useAuth();
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Set once step 1 has produced a real restaurant, so stepping back and
  // forward again cannot create a second one.
  const [restaurantCreated, setRestaurantCreated] = useState(false);

  // Step 1 Form. Left blank on purpose — these fields describe the operator's
  // own restaurant, so a seeded value is either wrong or gets carried forward
  // as though they had entered it.
  //
  // `name` stays null until edited. That lets a restaurant record loading in
  // after first paint supply the name through a derived value, rather than an
  // effect that copies props into state and re-renders.
  const [profile, setProfile] = useState<{
    name: string | null;
    cuisineType: string;
    phone: string;
    address: string;
    currency: string;
  }>({
    name: null,
    cuisineType: '',
    phone: '',
    address: '',
    currency: 'INR',
  });

  // An existing restaurant's name shows through until the operator types.
  const restaurantName = profile.name ?? currentRestaurant?.name ?? '';

  // Step 2 Form
  const [floor, setFloor] = useState<{
    diningAreaName: string;
    seating: Record<number, number>;
  }>({
    diningAreaName: '',
    seating: { 2: 0, 4: 0, 6: 0 },
  });
  // Seeds the suggested mix only; the mix itself is what gets created.
  const [tableTarget, setTableTarget] = useState('');

  // Step 4 Form. dishPrice is a string so the field can start genuinely empty
  // instead of showing a 0 the operator has to clear first.
  const [menu, setMenu] = useState({
    menuName: '',
    categoryName: '',
    dishName: '',
    dishPrice: '',
  });

  // Step 5 Form
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('KITCHEN');

  // Step 6 Form
  const [payments, setPayments] = useState<Record<PaymentKey, boolean>>({
    cash: true,
    upi: true,
    card: true,
  });

  const seatingEntries = SEAT_SIZES.map((seats) => ({ seats, count: floor.seating[seats] ?? 0 }));
  const totalTables = seatingEntries.reduce((sum, e) => sum + e.count, 0);
  const totalCovers = seatingEntries.reduce((sum, e) => sum + e.count * e.seats, 0);
  // Smallest tables first, which is how the generated numbering reads on the floor.
  const generatedTables = seatingEntries.flatMap((e) =>
    Array.from({ length: e.count }, () => e.seats),
  );

  const setSeatCount = (seats: number, count: number) => {
    setFloor((prev) => ({
      ...prev,
      seating: { ...prev.seating, [seats]: Math.max(0, Math.min(100, count)) },
    }));
  };

  const progressPercent = Math.round((currentStep / ONBOARDING_STEPS.length) * 100);

  const currencySymbol =
    CURRENCIES.find((c) => c.code === profile.currency)?.symbol ?? profile.currency;

  const handleNext = async () => {
    setLoading(true);
    setSuccessMessage(null);
    setError(null);
    try {
      // Step 1 is the only step that persists anything. It creates the
      // tenant, restaurant, main branch and OWNER membership for the
      // signed-in user — which /auth/signup cannot do, because it refuses an
      // email that is already registered, and an OAuth sign-in always
      // registers the account before a restaurant has been named.
      if (currentStep === 1 && !restaurantCreated && !currentRestaurant?.id) {
        const name = restaurantName.trim();
        if (name.length < 2) {
          setError('Enter your restaurant name to continue.');
          return;
        }

        const response = await createFirstRestaurant({
          restaurantName: name,
          phone: profile.phone.trim() || undefined,
          address: profile.address.trim() || undefined,
        });

        const result = response.data;

        // The fresh token carries the promoted OWNER role. An account that
        // was already onboarded comes back without one, and nothing changes.
        if (result?.accessToken && result?.user) {
          loginUser(result.accessToken, result.user);
        }
        if (result?.tenant?.id) {
          setCurrentTenant({
            id: result.tenant.id,
            name: result.tenant.name,
            slug: result.tenant.slug,
            status: 'ACTIVE',
            createdAt: '',
            updatedAt: '',
          });
        }
        if (result?.restaurant?.id) {
          setCurrentRestaurant({
            id: result.restaurant.id,
            tenantId: result.tenant?.id || '',
            name: result.restaurant.name,
            slug: result.restaurant.slug,
            status: 'ACTIVE',
            createdAt: '',
            updatedAt: '',
          });
        }
        if (result?.branch?.id) {
          setCurrentBranch({
            id: result.branch.id,
            restaurantId: result.restaurant?.id || '',
            name: result.branch.name,
            code: result.branch.code,
            status: 'ACTIVE',
            createdAt: '',
            updatedAt: '',
          });
        }

        setRestaurantCreated(true);
      }

      // Steps 2, 4 and 5 each persist their own section. Every write is
      // idempotent, so returning to a step rewrites it instead of adding a
      // duplicate floor, menu or membership.
      if (currentStep === 2) {
        if (totalTables < 1) {
          setError('Add at least one table so we can lay out your floor.');
          return;
        }

        const saved = await saveOnboardingSetup({
          floor: {
            diningAreaName: floor.diningAreaName.trim() || undefined,
            seating: seatingEntries.filter((entry) => entry.count > 0),
          },
        });

        const savedFloor = saved.data.floor;
        if (savedFloor?.skipped) {
          setError(`Floor could not be saved: ${savedFloor.skipped}`);
          return;
        }
        if (savedFloor) {
          setSuccessMessage(
            `Laid out ${savedFloor.tablesTotal} tables (${savedFloor.coversTotal} covers), each with its own QR code.`,
          );
        }
      }

      if (currentStep === 4) {
        await saveOnboardingSetup({
          menu: {
            menuName: menu.menuName.trim() || undefined,
            categoryName: menu.categoryName.trim() || undefined,
            dishName: menu.dishName.trim() || undefined,
            dishPrice: menu.dishPrice === '' ? undefined : Number(menu.dishPrice),
          },
        });
      }

      // An invite is optional; an empty email simply moves on.
      if (currentStep === 5 && staffEmail.trim()) {
        const saved = await saveOnboardingSetup({
          staff: { email: staffEmail.trim(), role: staffRole },
        });
        if (saved.data.staff?.skipped) {
          setError(`Team member not added: ${saved.data.staff.skipped}`);
          return;
        }
      }

      if (currentStep === 6) {
        setSuccessMessage('🎉 Kafei Setup Completed! Redirecting to your Live Command Dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create the restaurant.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const inputClass =
    'w-full p-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary';

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header & Progress */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider">
            ✨ Kafei v1 Guided Onboarding
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-foreground">
            Setup {restaurantName || 'Your Restaurant'}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Complete the 6 fast setup steps to activate table QR ordering, kitchen display systems, and automated analytics.
          </p>

          {/* Progress Bar */}
          <div className="pt-4 max-w-md mx-auto">
            <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1.5">
              <span>Setup Progress</span>
              <span className="text-primary font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Navigation Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {ONBOARDING_STEPS.map((step) => {
            const isDone = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all text-xs font-medium ${
                  isCurrent
                    ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10'
                    : isDone
                    ? 'bg-secondary/80 border-primary/40 text-primary'
                    : 'bg-secondary/40 border-border text-muted-foreground hover:border-input'
                }`}
              >
                <div className="p-2 rounded-lg bg-background mb-1.5 text-base">
                  {isDone ? '✓' : step.icon}
                </div>
                <span className="truncate w-full font-semibold">{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Step Card Content */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">1. Restaurant Profile & Concept</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Set the primary branding and operational currency for your establishment.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Restaurant Name</label>
                  <input
                    value={restaurantName}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Cafe Rizz"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Cuisine & Concept</label>
                  <input
                    value={profile.cuisineType}
                    onChange={(e) => setProfile({ ...profile, cuisineType: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Italian Fine Dining, Cafe & Bakery"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Business Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Operational Currency</label>
                  <select
                    value={profile.currency}
                    onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                    className={inputClass}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Business Address</label>
                  <input
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className={inputClass}
                    placeholder="Street, area, city"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">2. Floor Plan & Physical Tables</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure dining sections and table counts for your active branch location.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Primary Dining Area Name</label>
                  <input
                    value={floor.diningAreaName}
                    onChange={(e) => setFloor({ ...floor, diningAreaName: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Main Dining Hall"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    How many tables in total?
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={tableTarget}
                    onChange={(e) => {
                      setTableTarget(e.target.value);
                      setFloor((prev) => ({
                        ...prev,
                        seating: suggestSeatingMix(Number(e.target.value)),
                      }));
                    }}
                    className={inputClass}
                    placeholder="e.g. 6"
                  />
                  <p className="text-[10px] text-subtle">
                    We split this into a seating plan for you — adjust it below.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Seating arrangement
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {seatingEntries.map(({ seats, count }) => (
                    <div
                      key={seats}
                      className="rounded-xl border border-border bg-background p-3.5 space-y-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-foreground">Tables for {seats}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {seats === 2 ? "Couples and walk-ins" : seats === 4 ? "The everyday table" : "Groups and families"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary p-1">
                        <button
                          type="button"
                          aria-label={`Fewer tables for ${seats}`}
                          onClick={() => setSeatCount(seats, count - 1)}
                          className="h-7 w-8 rounded-md text-base font-bold text-primary transition-colors hover:bg-primary/15"
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-sm font-bold font-mono text-foreground">
                          {count}
                        </span>
                        <button
                          type="button"
                          aria-label={`More tables for ${seats}`}
                          onClick={() => setSeatCount(seats, count + 1)}
                          className="h-7 w-8 rounded-md text-base font-bold text-primary transition-colors hover:bg-primary/15"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-secondary p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-xs">
                  <span className="font-semibold text-foreground">
                    {totalTables} {totalTables === 1 ? "table" : "tables"}
                  </span>
                  <span className="text-muted-foreground">{totalCovers} covers</span>
                  <span className="text-primary">QR code generated per table</span>
                </div>
                {generatedTables.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {generatedTables.slice(0, 14).map((seats, i) => (
                      <span
                        key={`${i}-${seats}`}
                        className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[10px] text-muted-foreground"
                      >
                        T-{String(i + 1).padStart(2, '0')} · {seats}p
                      </span>
                    ))}
                    {generatedTables.length > 14 && (
                      <span className="px-2 py-1 font-mono text-[10px] text-subtle">
                        +{generatedTables.length - 14} more
                      </span>
                    )}
                  </div>
                )}
                {totalTables === 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Enter a table count above and we will lay the floor out for you.
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">3. Table QR Code Generation</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Customers scan these high-density QR codes to view live menus and place orders without waiting.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-background border border-border rounded-xl">
                <div className="w-28 h-28 bg-foreground p-2 rounded-xl flex items-center justify-center text-4xl shadow-inner">
                  📱
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="text-base font-bold text-foreground">Dynamic Session QR Codes Ready</h4>
                  <p className="text-xs text-muted-foreground">
                    Each table receives an encrypted session token with automated table ordering, live cart sync, and instant kitchen alerts.
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
                    ✓ Batch SVG Export & Printable Stickers Enabled
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">4. Menu & Signature Dish Setup</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your first master catalog category and launch your signature dish.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Master Menu Name</label>
                  <input
                    value={menu.menuName}
                    onChange={(e) => setMenu({ ...menu, menuName: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. All-Day Dining"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Category Name</label>
                  <input
                    value={menu.categoryName}
                    onChange={(e) => setMenu({ ...menu, categoryName: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Chef Specials"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Signature Dish</label>
                  <input
                    value={menu.dishName}
                    onChange={(e) => setMenu({ ...menu, dishName: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Dum Biryani"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Base Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={menu.dishPrice}
                    onChange={(e) => setMenu({ ...menu, dishPrice: e.target.value })}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">5. Staff & Role Delegation</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Invite your kitchen and waitstaff team members with tailored permission scopes.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Staff Member Email</label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. chef@restaurant.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Role & Access Scope</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className={inputClass}
                  >
                    <option value="KITCHEN">🍳 Kitchen Staff (KDS Display Only)</option>
                    <option value="WAITER">🛎️ Waiter / Floor Staff (Table & Orders)</option>
                    <option value="CASHIER">💵 Cashier (Settlements & Invoices)</option>
                    <option value="MANAGER">📋 Restaurant Manager (Full Restaurant Ops)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">6. Payment Methods & Go-Live!</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Select payment channels to accept and launch your live Kafei operations.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const isOn = payments[method.key];

                  return (
                    <button
                      key={method.key}
                      type="button"
                      aria-pressed={isOn}
                      onClick={() =>
                        setPayments((prev) => ({ ...prev, [method.key]: !prev[method.key] }))
                      }
                      className={`p-4 rounded-xl border text-left space-y-1 transition-all ${
                        isOn
                          ? 'border-primary/30 bg-primary/20 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:border-input'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-semibold text-sm">
                        <span>{method.title}</span>
                        <span className="text-xs">{isOn ? '✓' : '+'}</span>
                      </div>
                      <div className={`text-xs ${isOn ? 'text-primary/80' : 'text-muted-foreground'}`}>
                        {method.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Your choice here is not saved yet — there is no payment-method table in
                the database. Everything else in this setup is stored.
              </p>

              {successMessage && (
                <div className="p-4 bg-primary/40 border border-primary/30 rounded-xl text-sm text-primary font-medium text-center">
                  {successMessage}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/10 p-3.5 text-xs text-atlas-error">
              {error}
            </div>
          )}

          {/* Wizard Footer Buttons */}
          <div className="pt-6 border-t border-border flex items-center justify-between">
            <button
              type="button"
              disabled={currentStep === 1 || loading}
              onClick={handlePrev}
              className="px-5 py-2.5 rounded-xl border border-border bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={loading || (currentStep === 1 && restaurantName.trim().length < 2)}
              className="px-6 py-2.5 rounded-xl bg-primary text-background text-xs font-black hover:bg-primary shadow-lg shadow-primary/20 transition-all disabled:opacity-40"
            >
              {loading ? 'Working…' : currentStep === 6 ? '✨ Launch Restaurant Live!' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
