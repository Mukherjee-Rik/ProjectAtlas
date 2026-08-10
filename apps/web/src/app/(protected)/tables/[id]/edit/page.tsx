'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTableById, updateTable } from '@/services/tables.service';
import { getDiningAreas } from '@/services/dining-areas.service';
import { TableForm, type TableFormData } from '@/components/tables/table-form';
import type { RestaurantTable } from '@/types/table';
import type { DiningArea } from '@/types/dining-area';

export default function EditTablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [diningAreas, setDiningAreas] = useState<DiningArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [tableRes, areasRes] = await Promise.all([
        getTableById(id),
        getDiningAreas(),
      ]);

      setTable(tableRes.data);
      setDiningAreas(areasRes.data ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Table not found.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmit = async (data: TableFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      await updateTable(id, {
        diningAreaId: data.diningAreaId,
        name: data.name,
        code: data.code,
        capacity: data.capacity,
        status: data.status,
      });
      router.push(`/tables/${id}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to update table.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Edit Table</h1>
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center text-[#9AA6B2]">
          Loading table information...
        </div>
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Edit Table</h1>
        <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-8 text-center text-[#EF4444]">
          <p>{error || 'Table not found.'}</p>
          <button
            type="button"
            onClick={() => router.push('/tables')}
            className="mt-4 rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2 text-sm text-[#F5F7FA]"
          >
            Back to Tables
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Edit Table</h1>
        <p className="mt-2 text-[#9AA6B2]">
          Updating <span className="font-semibold text-[#F5F7FA]">{table.name}</span> ({table.code}).
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444]">
          {error}
        </div>
      )}

      <TableForm
        isEdit
        initialValues={{
          diningAreaId: table.diningAreaId,
          name: table.name,
          code: table.code,
          capacity: table.capacity,
          status: table.status,
        }}
        diningAreas={diningAreas}
        isLoading={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/tables/${id}`)}
      />
    </div>
  );
}
