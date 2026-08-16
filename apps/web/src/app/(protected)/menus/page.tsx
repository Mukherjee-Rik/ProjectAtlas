'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRestaurant } from '@/hooks/use-restaurant';
import { getMenus, deleteMenu } from '@/services/menus.service';
import type { Menu } from '@/types/menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function MenusPage() {
  const router = useRouter();
  const { currentRestaurant } = useRestaurant();

  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingMenu, setDeletingMenu] = useState<Menu | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentRestaurant) {
      setMenus([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await getMenus();
      setMenus(res.data ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load menus');
    } finally {
      setIsLoading(false);
    }
  }, [currentRestaurant]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleDeleteConfirm = async () => {
    if (!deletingMenu) return;
    setIsDeleting(true);
    try {
      await deleteMenu(deletingMenu.id);
      setDeletingMenu(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message ?? 'Failed to delete menu');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentRestaurant) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center shadow-xl space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#18212B] text-2xl">🍽️</div>
        <h2 className="text-xl font-bold text-[#F5F7FA]">Select a restaurant to continue</h2>
        <p className="text-sm text-[#9AA6B2]">Choose the restaurant you are operating in from the header selector.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F7FA]">Menus</h1>
          <p className="mt-2 text-sm text-[#9AA6B2]">
            Manage menus for <span className="font-semibold text-[#F5F7FA]">{currentRestaurant.name}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/menus/create')}
          className="rounded-lg bg-[#2AFEB7] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99]"
        >
          + Create Menu
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center text-[#9AA6B2]">Loading menus...</div>
      ) : error ? (
        <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-6 text-center text-[#EF4444]"><p>{error}</p></div>
      ) : menus.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#111820] p-16 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#18212B] text-3xl">📋</div>
          <h2 className="text-lg font-bold text-[#F5F7FA]">No menus yet</h2>
          <p className="text-sm text-[#9AA6B2]">Create your first menu to start adding categories and items.</p>
          <button
            type="button"
            onClick={() => router.push('/menus/create')}
            className="rounded-lg bg-[#2AFEB7] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] hover:bg-[#22E5A4]"
          >
            Create your first menu
          </button>
        </div>
      ) : (
        <div className="table-responsive rounded-xl border border-[#26313C] bg-[#111820] shadow-xl">
          <table className="w-full min-w-[600px] text-left">
            <thead className="border-b border-[#26313C] bg-[#18212B]">
              <tr>
                {['Menu Name', 'Code', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26313C]">
              {menus.map((menu) => (
                <tr
                  key={menu.id}
                  onClick={() => router.push(`/menus/${menu.id}`)}
                  className="cursor-pointer transition-colors hover:bg-[#18212B]"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-[#F5F7FA]">{menu.name}</td>
                  <td className="px-6 py-4 font-mono text-sm text-[#2AFEB7]">{menu.code}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${menu.status === 'ACTIVE' ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30' : 'bg-[#9AA6B2]/15 text-[#9AA6B2] border-[#9AA6B2]/30'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${menu.status === 'ACTIVE' ? 'bg-[#22C55E]' : 'bg-[#9AA6B2]'}`} />
                      {menu.status}
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/menus/${menu.id}/edit`)}
                        className="rounded-lg border border-[#26313C] bg-[#18212B] px-2.5 py-1 text-xs text-[#F5F7FA] hover:border-[#2AFEB7]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingMenu(menu)}
                        className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-2.5 py-1 text-xs text-[#EF4444] hover:bg-[#EF4444]/20"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingMenu)}
        title="Delete Menu?"
        description={`Delete "${deletingMenu?.name}"? All categories and items will be permanently removed.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingMenu(null)}
      />
    </div>
  );
}
