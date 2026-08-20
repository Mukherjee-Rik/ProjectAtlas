'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBranch } from '@/hooks/use-branch';
import { useRestaurant } from '@/hooks/use-restaurant';
import { getPaymentSettings, savePaymentSettings, type PaymentSettings } from '@/lib/payment-settings';
import { ValidatedInput } from '@/components/ui/validated-input';
import { ImageUpload } from '@/components/ui/image-upload';

export default function PaymentSettingsPage() {
  const { currentBranch } = useBranch();
  const { currentRestaurant } = useRestaurant();

  const [settings, setSettings] = useState<PaymentSettings>({
    upiId: '',
    payeeName: '',
    customQrUrl: '',
    enablePayFromSeat: true,
    enableCashierPayment: true,
    enableTableAssistance: true,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const loaded = getPaymentSettings(currentBranch?.id);
    // If empty payee name, default to active restaurant name
    if (!loaded.payeeName && currentRestaurant?.name) {
      loaded.payeeName = currentRestaurant.name;
    }
    setSettings(loaded);
  }, [currentBranch?.id, currentRestaurant?.name]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    savePaymentSettings(settings, currentBranch?.id);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Preview QR code URL
  const previewUpiUri = `upi://pay?pa=${settings.upiId || 'yourname@upi'}&pn=${encodeURIComponent(settings.payeeName || 'Restaurant')}&am=500.00&cu=INR&tn=Table_Bill_Preview`;
  const previewQrImg = settings.customQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(previewUpiUri)}&margin=8`;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9AA6B2] mb-1">
            <Link href="/settings" className="hover:text-[#2AFEB7]">Settings</Link>
            <span>/</span>
            <span className="text-[#F5F7FA]">Payment & UPI QR</span>
          </div>
          <h1 className="text-3xl font-black text-[#F5F7FA]">
            Payment & QR Settings
          </h1>
          <p className="mt-1 text-sm text-[#9AA6B2]">
            Configure your restaurant&apos;s UPI ID, QR code, and customer seat payment options.
          </p>
        </div>

        <Link
          href="/table-qrs"
          className="rounded-xl border border-[#26313C] bg-[#18212B] px-4 py-2 text-xs font-bold text-[#2AFEB7] hover:border-[#2AFEB7]/40"
        >
          View Table QRs →
        </Link>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/10 p-4 text-sm font-bold text-[#22C55E] flex items-center justify-between animate-fadeIn">
          <span>✓ Payment & QR settings saved successfully for {currentBranch?.name || 'active branch'}!</span>
          <span className="text-xs font-normal">Active for customer orders</span>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="overflow-hidden rounded-2xl border border-[#26313C] bg-[#111820] shadow-xl">
            <div className="border-b border-[#26313C] p-6 bg-[#18212B]/40">
              <h2 className="text-lg font-bold text-[#F5F7FA]">
                UPI & Merchant Details
              </h2>
              <p className="text-xs text-[#9AA6B2] mt-0.5">
                This UPI ID will receive direct payments when customers scan the QR code from their seat.
              </p>
            </div>

            <div className="p-6 space-y-5">
              <ValidatedInput
                id="upiId"
                label="UPI ID / VPA Address"
                value={settings.upiId}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                placeholder="e.g. swetarestaurant@okaxis, merchant@paytm, 9876543210@upi"
                helperText="Your Google Pay, PhonePe, Paytm, BHIM, or Bank Merchant UPI ID"
                required
              />

              <ValidatedInput
                id="payeeName"
                label="Merchant / Business Name"
                value={settings.payeeName}
                onChange={(e) => setSettings({ ...settings, payeeName: e.target.value })}
                placeholder="e.g. Cafe Rizz"
                helperText="Name displayed on the customer's UPI payment screen"
                required
              />

              <ImageUpload
                label="Custom Payment QR Code Photo (Optional)"
                helperText="Upload a photo or screenshot of your counter QR standee (GPay / PhonePe / Paytm / BHIM)"
                value={settings.customQrUrl || ''}
                onChange={(val) => setSettings({ ...settings, customQrUrl: val })}
              />

              <div className="border-t border-[#26313C] pt-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#9AA6B2]">
                  Customer Ordering & Payment Options
                </h3>

                <label className="flex items-start gap-3 rounded-xl border border-[#26313C] bg-[#18212B]/50 p-4 cursor-pointer hover:border-[#2AFEB7]/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enablePayFromSeat}
                    onChange={(e) => setSettings({ ...settings, enablePayFromSeat: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-[#26313C] text-[#2AFEB7] focus:ring-[#2AFEB7]"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#F5F7FA]">
                      Display &quot;Pay From Seat&quot; QR Code After Meal
                    </p>
                    <p className="text-[11px] text-[#9AA6B2]">
                      When food status changes to &quot;Served&quot;, show the payment QR with enlargement popup.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-[#26313C] bg-[#18212B]/50 p-4 cursor-pointer hover:border-[#2AFEB7]/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enableCashierPayment}
                    onChange={(e) => setSettings({ ...settings, enableCashierPayment: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-[#26313C] text-[#2AFEB7] focus:ring-[#2AFEB7]"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#F5F7FA]">
                      Allow &quot;Pay at Cashier Counter&quot; Option
                    </p>
                    <p className="text-[11px] text-[#9AA6B2]">
                      Allows customers to request the bill or pay via Cash / Card at the reception desk.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="rounded-xl bg-[#2AFEB7] px-6 py-3 text-xs font-bold text-[#0B0F14] shadow-lg transition-all hover:bg-[#22E5A4] active:scale-95"
                >
                  💾 Save Payment & QR Settings
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Live Customer Preview Card */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#2AFEB7]">
                Live Customer Preview
              </span>
              <span className="h-2 w-2 rounded-full bg-[#2AFEB7] animate-pulse" />
            </div>

            <p className="text-xs text-[#9AA6B2]">
              Here is how your payment QR will appear to customers on their phone:
            </p>

            <div className="rounded-xl border border-[#26313C] bg-[#0B0F14] p-4 flex flex-col items-center text-center space-y-3">
              <span className="text-xs font-bold text-[#F5F7FA]">
                {settings.payeeName || 'Restaurant Name'}
              </span>

              <div className="rounded-xl bg-white p-2.5 shadow-md">
                <img
                  src={previewQrImg}
                  alt="QR Preview"
                  className="h-40 w-40 object-contain"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-black text-[#2AFEB7]">
                  ₹500.00 <span className="text-[10px] font-normal text-[#9AA6B2]">(Sample Bill)</span>
                </p>
                <p className="text-[10px] font-mono text-[#9AA6B2] truncate max-w-[200px]">
                  {settings.upiId || 'not configured'}
                </p>
              </div>

              <div className="w-full rounded-lg bg-[#2AFEB7]/10 border border-[#2AFEB7]/30 py-1.5 text-[10px] font-bold text-[#2AFEB7]">
                🔍 Click to Enlarge & Screenshot
              </div>
            </div>

            <div className="rounded-xl border border-[#26313C] bg-[#18212B]/40 p-3 text-[11px] text-[#9AA6B2] leading-relaxed">
              📲 <strong>Instant Testing:</strong> Open Google Pay or PhonePe on your phone right now and scan the QR above to verify your merchant name!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
