'use client';

import { useState } from 'react';
import type { DiningAreaStatus } from '@/types/dining-area';

export interface DiningAreaFormData {
  name: string;
  code: string;
  status: DiningAreaStatus;
}

interface DiningAreaFormProps {
  initialValues?: Partial<DiningAreaFormData>;
  isEdit?: boolean;
  isLoading?: boolean;
  onSubmit: (data: DiningAreaFormData) => Promise<void>;
  onCancel: () => void;
}

export function DiningAreaForm({
  initialValues,
  isEdit = false,
  isLoading = false,
  onSubmit,
  onCancel,
}: DiningAreaFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [code, setCode] = useState(initialValues?.code ?? '');
  const [status, setStatus] = useState<DiningAreaStatus>(
    initialValues?.status ?? 'ACTIVE',
  );

  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setFormError('Dining area name is required.');
      return;
    }

    if (!code.trim()) {
      setFormError('Dining area code is required.');
      return;
    }

    setFormError('');
    await onSubmit({
      name: name.trim(),
      code: code.trim(),
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              Dining Area Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Indoor Dining"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2] outline-none focus:border-[#2AFEB7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. INDOOR"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2] outline-none focus:border-[#2AFEB7]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DiningAreaStatus)}
            className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
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
          {isLoading
            ? 'Saving...'
            : isEdit
            ? 'Update Dining Area'
            : 'Create Dining Area'}
        </button>
      </div>
    </form>
  );
}
