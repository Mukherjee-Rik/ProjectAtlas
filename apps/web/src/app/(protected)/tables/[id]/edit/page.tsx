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
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Edit Table</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Loading table information...
        </div>
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Edit Table</h1>
        <div className="rounded-xl border border-atlas-error/40 bg-atlas-error/10 p-8 text-center text-atlas-error">
          <p>{error || 'Table not found.'}</p>
          <button
            type="button"
            onClick={() => router.push('/tables')}
            className="mt-4 rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground"
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
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Edit Table</h1>
        <p className="mt-2 text-muted-foreground">
          Updating <span className="font-semibold text-foreground">{table.name}</span> ({table.code}).
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-atlas-error/40 bg-atlas-error/10 p-4 text-sm text-atlas-error">
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
