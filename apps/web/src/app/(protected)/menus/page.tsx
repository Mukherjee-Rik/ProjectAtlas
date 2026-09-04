'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRestaurant } from '@/hooks/use-restaurant';
import { getMenus, deleteMenu } from '@/services/menus.service';
import type { Menu } from '@/types/menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';

export default function MenusPage() {
  const router = useRouter();
  const { currentRestaurant } = useRestaurant();

  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingMenu, setDeletingMenu] = useState<Menu | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-2xl">🍽️</div>
        <h2 className="text-xl font-bold text-foreground">Select a restaurant to continue</h2>
        <p className="text-sm text-muted-foreground">Choose the restaurant you are operating in from the header selector.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(menus.length / pageSize) || 1;
  const paginatedMenus = menus.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Menus</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage menus for <span className="font-semibold text-foreground">{currentRestaurant.name}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/menus/create')}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-background transition-all hover:bg-primary-hover active:scale-[0.99]"
        >
          + Create Menu
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Loading menus...</div>
      ) : error ? (
        <div className="rounded-xl border border-atlas-error/40 bg-atlas-error/10 p-6 text-center text-atlas-error"><p>{error}</p></div>
      ) : menus.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-16 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-3xl">📋</div>
          <h2 className="text-lg font-bold text-foreground">No menus yet</h2>
          <p className="text-sm text-muted-foreground">Create your first menu to start adding categories and items.</p>
          <button
            type="button"
            onClick={() => router.push('/menus/create')}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-background hover:bg-primary-hover"
          >
            Create your first menu
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="table-responsive rounded-xl border border-border bg-card">
            <table className="w-full min-w-[600px] text-left">
              <thead className="border-b border-border bg-secondary">
                <tr>
                  {['Menu Name', 'Code', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedMenus.map((menu) => (
                  <tr
                    key={menu.id}
                    onClick={() => router.push(`/menus/${menu.id}`)}
                    className="cursor-pointer transition-colors hover:bg-secondary"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{menu.name}</td>
                    <td className="px-6 py-4 font-mono text-sm text-primary">{menu.code}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${menu.status === 'ACTIVE' ? 'bg-atlas-success/15 text-atlas-success border-atlas-success/30' : 'bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${menu.status === 'ACTIVE' ? 'bg-atlas-success' : 'bg-muted-foreground'}`} />
                        {menu.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/menus/${menu.id}/edit`)}
                          className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs text-foreground hover:border-primary"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingMenu(menu)}
                          className="rounded-lg border border-atlas-error/40 bg-atlas-error/10 px-2.5 py-1 text-xs text-atlas-error hover:bg-atlas-error/20"
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

          {menus.length > 0 && (
            <div className="pt-2">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={menus.length}
                pageSize={pageSize}
                pageSizeOptions={[10, 25, 50]}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
              />
            </div>
          )}
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
