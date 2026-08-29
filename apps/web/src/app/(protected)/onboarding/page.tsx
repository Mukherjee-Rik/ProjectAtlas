'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useTenant } from '@/hooks/use-tenant';
import { useBranch } from '@/hooks/use-branch';

const ONBOARDING_STEPS = [
  { id: 1, title: 'Restaurant Profile', icon: '🏢', desc: 'Identity & currency' },
  { id: 2, title: 'Floor & Tables', icon: '📍', desc: 'Dining area & tables' },
  { id: 3, title: 'QR Ordering', icon: '📱', desc: 'Generate table QR codes' },
  { id: 4, title: 'Menu Catalog', icon: '🍽️', desc: 'Categories & dishes' },
  { id: 5, title: 'Staff & Roles', icon: '👥', desc: 'Invite chef & waitstaff' },
  { id: 6, title: 'Payment & Launch', icon: '💳', desc: 'Billing & Go-Live' },
];

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
  const { user } = useAuth();
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
  const [floor, setFloor] = useState({
    diningAreaName: '',
    tableCount: 6,
  });

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

  const progressPercent = Math.round((currentStep / ONBOARDING_STEPS.length) * 100);

  const currencySymbol =
    CURRENCIES.find((c) => c.code === profile.currency)?.symbol ?? profile.currency;

  const handleNext = async () => {
    setLoading(true);
    setSuccessMessage(null);
    try {
      if (currentStep === 6) {
        setSuccessMessage('🎉 Kafei Setup Completed! Redirecting to your Live Command Dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length));
      }
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
                  <label className="text-xs font-semibold text-muted-foreground">Initial Table Count</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={floor.tableCount}
                    onChange={(e) => setFloor({ ...floor, tableCount: parseInt(e.target.value) || 1 })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="p-3 bg-secondary border border-border rounded-xl text-xs text-primary">
                ⚡ Tables T-01 through T-{floor.tableCount.toString().padStart(2, '0')} will be provisioned automatically with dynamic QR tokens.
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

              {successMessage && (
                <div className="p-4 bg-primary/40 border border-primary/30 rounded-xl text-sm text-primary font-medium text-center">
                  {successMessage}
                </div>
              )}
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
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary text-background text-xs font-black hover:bg-primary shadow-lg shadow-primary/20 transition-all"
            >
              {currentStep === 6 ? '✨ Launch Restaurant Live!' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
