'use client';

import { useState } from 'react';
import type { DiningArea } from '@/types/dining-area';
import type { TableStatus } from '@/types/table';

export interface TableFormData {
  diningAreaId: string;
  name: string;
  code: string;
  capacity: number;
  status: TableStatus;
}

interface TableFormProps {
  initialValues?: Partial<TableFormData>;
  diningAreas: DiningArea[];
  isEdit?: boolean;
  isLoading?: boolean;
  onSubmit: (data: TableFormData) => Promise<void>;
  onCancel: () => void;
}

export function TableForm({
  initialValues,
  diningAreas,
  isEdit = false,
  isLoading = false,
  onSubmit,
  onCancel,
}: TableFormProps) {
  const [diningAreaId, setDiningAreaId] = useState(
    initialValues?.diningAreaId ?? (diningAreas[0]?.id || ''),
  );
  const [name, setName] = useState(initialValues?.name ?? '');
  const [code, setCode] = useState(initialValues?.code ?? '');
  const [capacity, setCapacity] = useState(initialValues?.capacity ?? 4);
  const [status, setStatus] = useState<TableStatus>(
    initialValues?.status ?? 'ACTIVE',
  );

  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!diningAreaId) {
      setFormError('Please select a dining area.');
      return;
    }

    if (!name.trim()) {
      setFormError('Table name is required.');
      return;
    }

    if (!code.trim()) {
      setFormError('Table code is required.');
      return;
    }

    if (capacity < 1 || capacity > 50) {
      setFormError('Capacity must be between 1 and 50 people.');
      return;
    }

    setFormError('');
    await onSubmit({
      diningAreaId,
      name: name.trim(),
      code: code.trim(),
      capacity: Number(capacity),
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
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
            Dining Area *
          </label>
          <select
            value={diningAreaId}
            onChange={(e) => setDiningAreaId(e.target.value)}
            required
            className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
          >
            {diningAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name} ({area.code})
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              Table Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Table 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2] outline-none focus:border-[#2AFEB7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              Table Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. T01"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2] outline-none focus:border-[#2AFEB7]"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              Seating Capacity (1 - 50) *
            </label>
            <input
              type="number"
              min={1}
              max={50}
              required
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TableStatus)}
              className="mt-1.5 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
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
          {isLoading ? 'Saving...' : isEdit ? 'Update Table' : 'Create Table'}
        </button>
      </div>
    </form>
  );
}
