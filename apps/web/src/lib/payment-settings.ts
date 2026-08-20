export interface PaymentSettings {
  upiId: string;
  payeeName: string;
  customQrUrl?: string;
  enablePayFromSeat: boolean;
  enableCashierPayment: boolean;
  enableTableAssistance: boolean;
}

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  upiId: 'atlaspay@okaxis',
  payeeName: 'Atlas Restaurant',
  customQrUrl: '',
  enablePayFromSeat: true,
  enableCashierPayment: true,
  enableTableAssistance: true,
};

const PAYMENT_STORAGE_KEY_PREFIX = 'atlas_payment_settings_';

export function getPaymentSettings(branchId?: string): PaymentSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_PAYMENT_SETTINGS;
  }

  try {
    const key = branchId
      ? `${PAYMENT_STORAGE_KEY_PREFIX}${branchId}`
      : `${PAYMENT_STORAGE_KEY_PREFIX}default`;
    const stored = localStorage.getItem(key);
    if (!stored) {
      // Check default fallback
      const defaultStored = localStorage.getItem(`${PAYMENT_STORAGE_KEY_PREFIX}default`);
      return defaultStored ? { ...DEFAULT_PAYMENT_SETTINGS, ...JSON.parse(defaultStored) } : DEFAULT_PAYMENT_SETTINGS;
    }
    return { ...DEFAULT_PAYMENT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_PAYMENT_SETTINGS;
  }
}

export function savePaymentSettings(settings: PaymentSettings, branchId?: string): void {
  if (typeof window === 'undefined') return;

  try {
    const key = branchId
      ? `${PAYMENT_STORAGE_KEY_PREFIX}${branchId}`
      : `${PAYMENT_STORAGE_KEY_PREFIX}default`;
    localStorage.setItem(key, JSON.stringify(settings));

    // Also update default key as fallback
    if (branchId) {
      localStorage.setItem(`${PAYMENT_STORAGE_KEY_PREFIX}default`, JSON.stringify(settings));
    }
  } catch (err) {
    console.error('Failed to persist payment settings', err);
  }
}
