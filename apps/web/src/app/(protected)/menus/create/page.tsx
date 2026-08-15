'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MenuForm, type MenuFormValues } from '@/components/menus/menu-form';
import { createMenu } from '@/services/menus.service';

export default function CreateMenuPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: MenuFormValues) => {
    setIsSubmitting(true);
    try {
      await createMenu(values);
      router.push('/menus');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Create Menu</h1>
        <p className="mt-2 text-sm text-[#9AA6B2]">A menu groups your categories and items for the restaurant.</p>
      </div>
      <div className="rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-xl">
        <MenuForm onSubmit={handleSubmit} onCancel={() => router.push('/menus')} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
