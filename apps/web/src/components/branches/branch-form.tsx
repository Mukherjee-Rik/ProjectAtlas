'use client';

import { useState } from 'react';
import type { Restaurant } from '@/types/restaurant';
import type { BranchStatus } from '@/types/branch';
import { ValidatedInput, ValidatedSelect } from '@/components/ui/validated-input';
import { validateText, validateCode, validatePhone } from '@/lib/validation';

export interface BranchFormData {
  restaurantId: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  status?: BranchStatus;
}

interface BranchFormProps {
  initialValues?: Partial<BranchFormData>;
  restaurants: Restaurant[];
  isEdit?: boolean;
  isLoading?: boolean;
  onSubmit: (data: BranchFormData) => Promise<void>;
  onCancel: () => void;
}

export function BranchForm({
  initialValues,
  restaurants,
  isEdit = false,
  isLoading = false,
  onSubmit,
  onCancel,
}: BranchFormProps) {
  const [restaurantId, setRestaurantId] = useState(
    initialValues?.restaurantId ?? (restaurants[0]?.id || ''),
  );
  const [name, setName] = useState(initialValues?.name ?? '');
  const [code, setCode] = useState(initialValues?.code ?? '');
  const [address, setAddress] = useState(initialValues?.address ?? '');
  const [city, setCity] = useState(initialValues?.city ?? '');
  const [state, setState] = useState(initialValues?.state ?? '');
  const [postalCode, setPostalCode] = useState(initialValues?.postalCode ?? '');
  const [phone, setPhone] = useState(initialValues?.phone ?? '');
  const [status, setStatus] = useState<BranchStatus>(
    initialValues?.status ?? 'ACTIVE',
  );

  const [errors, setErrors] = useState<{
    restaurantId?: string;
    name?: string;
    code?: string;
    phone?: string;
    postalCode?: string;
  }>({});

  const [formError, setFormError] = useState('');

  const validateField = (field: string, val: any) => {
    const nextErrors = { ...errors };

    switch (field) {
      case 'restaurantId':
        if (!val && !isEdit) nextErrors.restaurantId = 'Please select a restaurant';
        else delete nextErrors.restaurantId;
        break;

      case 'name': {
        const res = validateText(val, 'Branch name', 2, 100);
        if (!res.isValid) nextErrors.name = res.error;
        else delete nextErrors.name;
        break;
      }

      case 'code': {
        const res = validateCode(val, 2, 10, 'Branch code');
        if (!res.isValid) nextErrors.code = res.error;
        else delete nextErrors.code;
        break;
      }

      case 'phone': {
        const res = validatePhone(val, false);
        if (!res.isValid) nextErrors.phone = res.error;
        else delete nextErrors.phone;
        break;
      }

      case 'postalCode': {
        if (val && val.trim().length > 10) nextErrors.postalCode = 'Postal code cannot exceed 10 characters';
        else delete nextErrors.postalCode;
        break;
      }
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameRes = validateText(name, 'Branch name', 2, 100);
    const codeRes = validateCode(code, 2, 10, 'Branch code');
    const phoneRes = validatePhone(phone, false);
    const restValid = Boolean(restaurantId || isEdit);

    const validationErrors: typeof errors = {};
    if (!restValid) validationErrors.restaurantId = 'Please select a restaurant';
    if (!nameRes.isValid) validationErrors.name = nameRes.error;
    if (!codeRes.isValid) validationErrors.code = codeRes.error;
    if (!phoneRes.isValid) validationErrors.phone = phoneRes.error;
    if (postalCode && postalCode.trim().length > 10) validationErrors.postalCode = 'Postal code cannot exceed 10 characters';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError('Please resolve the highlighted errors before saving.');
      return;
    }

    setFormError('');
    setErrors({});

    await onSubmit({
      restaurantId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      phone: phone.trim() || undefined,
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {formError && (
        <div className="rounded-xl border border-atlas-error/40 bg-atlas-error/10 p-4 text-sm text-atlas-error animate-in fade-in">
          {formError}
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        {!isEdit && (
          <ValidatedSelect
            label="Restaurant"
            required
            value={restaurantId}
            error={errors.restaurantId}
            onChange={(e) => {
              setRestaurantId(e.target.value);
              validateField('restaurantId', e.target.value);
            }}
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.slug})
              </option>
            ))}
          </ValidatedSelect>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <ValidatedInput
            label="Branch Name"
            required
            maxLength={100}
            showCount
            placeholder="e.g. Agartala Branch"
            value={name}
            error={errors.name}
            onChange={(e) => {
              setName(e.target.value);
              validateField('name', e.target.value);
            }}
            onBlur={(e) => validateField('name', e.target.value)}
          />

          <ValidatedInput
            label="Branch Code"
            required
            maxLength={10}
            uppercase
            showCount
            placeholder="e.g. AGT-01"
            value={code}
            error={errors.code}
            helperText="2-10 chars, uppercase alphanumeric"
            onChange={(e) => {
              setCode(e.target.value);
              validateField('code', e.target.value);
            }}
            onBlur={(e) => validateField('code', e.target.value)}
          />
        </div>

        <ValidatedInput
          label="Address"
          maxLength={150}
          placeholder="e.g. 123 Central Road"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <ValidatedInput
            label="City"
            maxLength={50}
            placeholder="e.g. Agartala"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <ValidatedInput
            label="State"
            maxLength={50}
            placeholder="e.g. Tripura"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />

          <ValidatedInput
            label="Postal Code"
            maxLength={10}
            placeholder="e.g. 799001"
            value={postalCode}
            error={errors.postalCode}
            onChange={(e) => {
              setPostalCode(e.target.value);
              validateField('postalCode', e.target.value);
            }}
            onBlur={(e) => validateField('postalCode', e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ValidatedInput
            label="Phone Number"
            type="tel"
            maxLength={15}
            placeholder="e.g. +91 9876543210"
            value={phone}
            error={errors.phone}
            helperText="7 to 15 digits with optional country code"
            onChange={(e) => {
              setPhone(e.target.value);
              validateField('phone', e.target.value);
            }}
            onBlur={(e) => validateField('phone', e.target.value)}
          />

          <ValidatedSelect
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as BranchStatus)}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </ValidatedSelect>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-border"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-background transition-all hover:bg-primary-hover disabled:opacity-50 font-bold"
        >
          {isLoading ? 'Saving...' : isEdit ? 'Update Branch' : 'Create Branch'}
        </button>
      </div>
    </form>
  );
}
