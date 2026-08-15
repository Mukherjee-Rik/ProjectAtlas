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

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Step 1 Form
  const [profile, setProfile] = useState({
    cuisineType: 'Contemporary Indian & Fusion',
    phone: '+91 9876543210',
    address: '42 Culinary Boulevard, Central District',
    currency: 'INR',
  });

  // Step 2 Form
  const [floor, setFloor] = useState({
    diningAreaName: 'Main Dining Hall',
    tableCount: 6,
  });

  // Step 4 Form
  const [menu, setMenu] = useState({
    menuName: 'All-Day Dining',
    categoryName: 'Chef Specials',
    dishName: 'Truffle Butter Dum Biryani',
    dishPrice: 599,
  });

  // Step 5 Form
  const [staffEmail, setStaffEmail] = useState('chef@atlas-bistro.com');
  const [staffRole, setStaffRole] = useState('KITCHEN');

  const progressPercent = Math.round((currentStep / ONBOARDING_STEPS.length) * 100);

  const handleNext = async () => {
    setLoading(true);
    setSuccessMessage(null);
    try {
      if (currentStep === 6) {
        setSuccessMessage('🎉 Atlas Setup Completed! Redirecting to your Live Command Dashboard...');
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

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#F5F7FA] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header & Progress */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2AFEB7]/10 border border-[#2AFEB7]/30 text-[#2AFEB7] text-xs font-semibold uppercase tracking-wider">
            ✨ Atlas v1 Guided Onboarding
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
            Setup {currentRestaurant?.name || 'Your Restaurant'}
          </h1>
          <p className="text-[#9AA6B2] max-w-xl mx-auto text-sm">
            Complete the 6 fast setup steps to activate table QR ordering, kitchen display systems, and automated analytics.
          </p>

          {/* Progress Bar */}
          <div className="pt-4 max-w-md mx-auto">
            <div className="flex justify-between text-xs font-medium text-[#9AA6B2] mb-1.5">
              <span>Setup Progress</span>
              <span className="text-[#2AFEB7] font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-[#18212B] rounded-full overflow-hidden border border-[#26313C]">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#2AFEB7] rounded-full transition-all duration-500"
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
                    ? 'bg-[#2AFEB7]/10 border-[#2AFEB7] text-[#2AFEB7] shadow-lg shadow-[#2AFEB7]/10'
                    : isDone
                    ? 'bg-[#18212B]/80 border-emerald-500/40 text-emerald-400'
                    : 'bg-[#18212B]/40 border-[#26313C] text-[#9AA6B2] hover:border-[#384654]'
                }`}
              >
                <div className="p-2 rounded-lg bg-[#0B0F14] mb-1.5 text-base">
                  {isDone ? '✓' : step.icon}
                </div>
                <span className="truncate w-full font-semibold">{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Step Card Content */}
        <div className="bg-[#121922] border border-[#26313C] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">1. Restaurant Profile & Concept</h3>
                <p className="text-xs text-[#9AA6B2] mt-1">
                  Verify the primary branding and operational currency for your establishment.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9AA6B2]">Restaurant Name</label>
                  <input
                    disabled
                    value={currentRestaurant?.name || 'Atlas Grand Bistro'}
                    className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-[#9AA6B2] text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9AA6B2]">Cuisine & Concept</label>
                  <input
                    value={profile.cuisineType}
                    onChange={(e) => setProfile({ ...profile, cuisineType: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-sm focus:outline-none focus:border-[#2AFEB7]"
                    placeholder="e.g. Italian Fine Dining, Cafe & Bakery"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9AA6B2]">Business Phone</label>
                  <input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-sm focus:outline-none focus:border-[#2AFEB7]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9AA6B2]">Operational Currency</label>
                  <input
                    disabled
                    value="INR (₹) — Indian Rupee"
                    className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-[#9AA6B2] text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">2. Floor Plan & Physical Tables</h3>
                <p className="text-xs text-[#9AA6B2] mt-1">
                  Configure dining sections and table counts for your active branch location.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9AA6B2]">Primary Dining Area Name</label>
                  <input
                    value={floor.diningAreaName}
                    onChange={(e) => setFloor({ ...floor, diningAreaName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-sm focus:outline-none focus:border-[#2AFEB7]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9AA6B2]">Initial Table Count</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={floor.tableCount}
                    onChange={(e) => setFloor({ ...floor, tableCount: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-sm focus:outline-none focus:border-[#2AFEB7]"
                  />
                </div>
              </div>
              <div className="p-3 bg-[#18212B] border border-[#26313C] rounded-xl text-xs text-[#2AFEB7]">
                ⚡ Tables T-01 through T-{floor.tableCount.toString().padStart(2, '0')} will be provisioned automatically with dynamic QR tokens.
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">3. Table QR Code Generation</h3>
                <p className="text-xs text-[#9AA6B2] mt-1">
                  Customers scan these high-density QR codes to view live menus and place orders without waiting.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-[#0B0F14] border border-[#26313C] rounded-xl">
                <div className="w-28 h-28 bg-white p-2 rounded-xl flex items-center justify-center text-4xl shadow-inner">
                  📱
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="text-base font-bold text-white">Dynamic Session QR Codes Ready</h4>
                  <p className="text-xs text-[#9AA6B2]">
                    Each table receives an encrypted session token with automated table ordering, live cart sync, and instant kitchen alerts.
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    ✓ Batch SVG Export & Printable Stickers Enabled
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">4. Menu & Signature Dish Setup</h3>
                <p className="text-xs text-[#9AA6B2] mt-1">
                  Create your first master catalog category and launch your signature dish.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9AA6B2]">Master Menu Name</label>
                  <input
                    value={menu.menuName}
                    onChange={(e) => setMenu({ ...menu, menuName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-sm focus:outline-none focus:border-[#2AFEB7]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9AA6B2]">Category Name</label>
                  <input
                    value={menu.categoryName}
                    onChange={(e) => setMenu({ ...menu, categoryName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-sm focus:outline-none focus:border-[#2AFEB7]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9AA6B2]">Signature Dish</label>
                  <input
                    value={menu.dishName}
                    onChange={(e) => setMenu({ ...menu, dishName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-sm focus:outline-none focus:border-[#2AFEB7]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9AA6B2]">Base Price (₹)</label>
                  <input
                    type="number"
                    value={menu.dishPrice}
                    onChange={(e) => setMenu({ ...menu, dishPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-sm focus:outline-none focus:border-[#2AFEB7]"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">5. Staff & Role Delegation</h3>
                <p className="text-xs text-[#9AA6B2] mt-1">
                  Invite your kitchen and waitstaff team members with tailored permission scopes.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9AA6B2]">Staff Member Email</label>
                  <input
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-sm focus:outline-none focus:border-[#2AFEB7]"
                    placeholder="e.g. chef@restaurant.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9AA6B2]">Role & Access Scope</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-sm focus:outline-none focus:border-[#2AFEB7]"
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
                <h3 className="text-xl font-bold text-white">6. Payment Methods & Go-Live!</h3>
                <p className="text-xs text-[#9AA6B2] mt-1">
                  Select payment channels to accept and launch your live Atlas operations.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 space-y-1">
                  <div className="font-semibold text-sm">💵 Cash at Table / POS</div>
                  <div className="text-xs text-emerald-400/80">Enabled by default</div>
                </div>
                <div className="p-4 rounded-xl border border-[#2AFEB7]/30 bg-[#2AFEB7]/10 text-[#2AFEB7] space-y-1">
                  <div className="font-semibold text-sm">📱 Dynamic UPI Intent</div>
                  <div className="text-xs text-[#2AFEB7]/80">Active for India QR</div>
                </div>
                <div className="p-4 rounded-xl border border-[#2AFEB7]/30 bg-[#2AFEB7]/10 text-[#2AFEB7] space-y-1">
                  <div className="font-semibold text-sm">💳 Card Terminal (POS)</div>
                  <div className="text-xs text-[#2AFEB7]/80">Integrated Settlement</div>
                </div>
              </div>

              {successMessage && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-sm text-emerald-300 font-medium text-center">
                  {successMessage}
                </div>
              )}
            </div>
          )}

          {/* Wizard Footer Buttons */}
          <div className="pt-6 border-t border-[#26313C] flex items-center justify-between">
            <button
              type="button"
              disabled={currentStep === 1 || loading}
              onClick={handlePrev}
              className="px-5 py-2.5 rounded-xl border border-[#26313C] bg-[#18212B] text-xs font-semibold text-[#9AA6B2] hover:text-white disabled:opacity-40"
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#2AFEB7] text-[#0B0F14] text-xs font-black hover:bg-[#20df9f] shadow-lg shadow-[#2AFEB7]/20 transition-all"
            >
              {currentStep === 6 ? '✨ Launch Restaurant Live!' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
