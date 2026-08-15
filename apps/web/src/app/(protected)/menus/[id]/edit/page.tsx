'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MenuForm, type MenuFormValues } from '@/components/menus/menu-form';
import { getMenuById, updateMenu } from '@/services/menus.service';
import type { Menu } from '@/types/menu';

export default function EditMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [menu, setMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getMenuById(id);
      setMenu(res.data);
    } catch {
      router.push('/menus');
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => { void load(); }, [load]);

  const handleSubmit = async (values: MenuFormValues) => {
    setIsSubmitting(true);
    try {
      await updateMenu(id, values);
      router.push(`/menus/${id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center text-[#9AA6B2]">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Edit Menu</h1>
        <p className="mt-2 text-sm text-[#9AA6B2]">Update details for <span className="font-semibold text-[#F5F7FA]">{menu?.name}</span>.</p>
      </div>
      <div className="rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-xl">
        {menu && (
          <MenuForm
            initialValues={menu}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/menus/${id}`)}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
