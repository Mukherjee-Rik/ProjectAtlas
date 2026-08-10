'use client';

import { useState } from 'react';
import type { Menu, MenuStatus } from '@/types/menu';

export interface MenuFormValues {
  name: string;
  code: string;
  status: MenuStatus;
}

interface MenuFormProps {
  initialValues?: Menu;
  onSubmit: (values: MenuFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function MenuForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: MenuFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [code, setCode] = useState(initialValues?.code ?? '');
  const [status, setStatus] = useState<MenuStatus>(
    initialValues?.status ?? 'ACTIVE',
  );
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Menu name is required');
      return;
    }
    if (!code.trim()) {
      setError('Menu code is required');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        status,
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'An error occurred while saving the menu');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
          Menu Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Main Menu"
          required
          className="mt-1 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2]/50 focus:border-[#2AFEB7] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
          Menu Code *
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. MAIN"
          required
          className="mt-1 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm font-mono text-[#F5F7FA] placeholder-[#9AA6B2]/50 focus:border-[#2AFEB7] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as MenuStatus)}
          className="mt-1 w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] focus:border-[#2AFEB7] focus:outline-none"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2 text-xs font-semibold text-[#F5F7FA] hover:border-[#2AFEB7] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#2AFEB7] px-4 py-2 text-xs font-semibold text-[#0B0F14] hover:bg-[#22E5A4] disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : initialValues ? 'Update Menu' : 'Create Menu'}
        </button>
      </div>
    </form>
  );
}
