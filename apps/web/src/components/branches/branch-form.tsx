'use client';

import { useState } from 'react';
import type { Restaurant } from '@/types/restaurant';
import type { BranchStatus } from '@/types/branch';

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

  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setFormError('Branch name is required.');
      return;
    }

    if (!code.trim()) {
      setFormError('Branch code is required.');
      return;
    }

    if (!restaurantId && !isEdit) {
      setFormError('Please select a restaurant.');
      return;
    }

    setFormError('');
    await onSubmit({
      restaurantId,
      name: name.trim(),
      code: code.trim(),
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      phone: phone.trim() || undefined,
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444]">
          {formError}
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-xl">
        {!isEdit && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              Restaurant *
            </label>
            <select
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2.5 text-sm text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.slug})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              Branch Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Agartala Branch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2] outline-none focus:border-[#2AFEB7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              Branch Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AGT-01"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2] outline-none focus:border-[#2AFEB7]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
            Address
          </label>
          <input
            type="text"
            placeholder="e.g. 123 Central Road"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2] outline-none focus:border-[#2AFEB7]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              City
            </label>
            <input
              type="text"
              placeholder="e.g. Agartala"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2] outline-none focus:border-[#2AFEB7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              State
            </label>
            <input
              type="text"
              placeholder="e.g. Tripura"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2] outline-none focus:border-[#2AFEB7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              Postal Code
            </label>
            <input
              type="text"
              placeholder="e.g. 799001"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2] outline-none focus:border-[#2AFEB7]"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              Phone
            </label>
            <input
              type="text"
              placeholder="e.g. +91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2] outline-none focus:border-[#2AFEB7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BranchStatus)}
              className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-sm font-semibold text-[#F5F7FA] transition-all hover:bg-[#26313C]"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-[#2AFEB7] px-6 py-2.5 text-sm font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : isEdit ? 'Update Branch' : 'Create Branch'}
        </button>
      </div>
    </form>
  );
}
