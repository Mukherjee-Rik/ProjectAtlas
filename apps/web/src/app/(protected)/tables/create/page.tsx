'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDiningAreas } from '@/services/dining-areas.service';
import { createTable, type CreateTablePayload } from '@/services/tables.service';
import { TableForm } from '@/components/tables/table-form';
import type { DiningArea } from '@/types/dining-area';

export default function CreateTablePage() {
  const router = useRouter();

  const [diningAreas, setDiningAreas] = useState<DiningArea[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAreas() {
      try {
        const response = await getDiningAreas();
        setDiningAreas(response.data ?? []);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load dining areas.');
      } finally {
        setIsLoadingAreas(false);
      }
    }

    void loadAreas();
  }, []);

  const handleSubmit = async (data: CreateTablePayload) => {
    setIsSubmitting(true);
    setError('');

    try {
      await createTable(data);
      router.push('/tables');
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to create table.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAreas) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Create Table</h1>
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center text-[#9AA6B2]">
          Loading available dining areas...
        </div>
      </div>
    );
  }

  if (diningAreas.length === 0) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Create Table</h1>
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center text-[#9AA6B2] space-y-4">
          <p>You must create at least one dining area before adding tables.</p>
          <button
            type="button"
            onClick={() => router.push('/dining-areas')}
            className="rounded-lg bg-[#2AFEB7] px-4 py-2 text-sm font-semibold text-[#0B0F14]"
          >
            Go to Dining Areas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Create Table</h1>
        <p className="mt-2 text-[#9AA6B2]">Add a new operating table to a dining area.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444]">
          {error}
        </div>
      )}

      <TableForm
        diningAreas={diningAreas}
        isLoading={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/tables')}
      />
    </div>
  );
}
