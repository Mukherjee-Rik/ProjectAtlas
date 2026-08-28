'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getTableById,
  getTableQr,
  regenerateTableQr,
  deleteTable,
  type TableQrResponse,
} from '@/services/tables.service';
import type { RestaurantTable } from '@/types/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function TableDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [qrData, setQrData] = useState<TableQrResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQr, setIsLoadingQr] = useState(true);
  const [error, setError] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [detectedBaseUrl, setDetectedBaseUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setDetectedBaseUrl(window.location.origin);
    } else {
      fetch('/api/server-ip')
        .then((r) => r.json())
        .then((data: { ip: string | null; baseUrl: string | null }) => {
          setDetectedBaseUrl(data.baseUrl || window.location.origin);
        })
        .catch(() => {
          setDetectedBaseUrl(window.location.origin);
        });
    }
  }, []);

  const loadTable = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getTableById(id);
      setTable(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Table not found.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const loadQr = useCallback(async (baseUrl?: string) => {
    setIsLoadingQr(true);
    try {
      const response = await getTableQr(id, baseUrl);
      setQrData(response.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingQr(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTable();
    void loadQr(detectedBaseUrl ?? undefined);
  }, [loadTable, loadQr, detectedBaseUrl]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTable(id);
      router.push('/tables');
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Failed to delete table');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegenerateQr = async () => {
    setIsRegenerating(true);
    try {
      const response = await regenerateTableQr(id, detectedBaseUrl ?? undefined);
      setQrData(response.data);
      setShowRegenerateConfirm(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Failed to regenerate QR code');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrData?.qrCodeSvg || !table) return;

    const blob = new Blob([qrData.qrCodeSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${table.code.toLowerCase()}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Table Details</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Loading table information...
        </div>
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Table Details</h1>
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
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">
            {table.name}
          </h1>
          <p className="mt-1 text-sm font-mono text-primary">
            Code: {table.code}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/tables/${table.id}/edit`)}
            className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-semibold text-foreground hover:border-primary"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-atlas-error/40 bg-atlas-error/10 px-4 py-2 text-sm font-semibold text-atlas-error hover:bg-atlas-error/20"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Grid: Properties + Digital QR Code */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Table Properties Card */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-6 bg-secondary/40">
            <h2 className="text-xl font-bold text-foreground">Table Properties</h2>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dining Area
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {table.diningArea?.name ?? '—'} ({table.diningArea?.code ?? '—'})
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </p>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-atlas-success/15 px-3 py-1 text-xs font-semibold text-atlas-success border border-atlas-success/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-atlas-success" />
                  {table.status}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Seating Capacity
              </p>
              <p className="mt-1 text-lg font-bold text-primary">
                👥 {table.capacity} people
              </p>
            </div>
          </div>
        </div>

        {/* Table QR Code Management Card */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-6 bg-secondary/40 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Table Digital QR Code</h2>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
              ACTIVE
            </span>
          </div>

          <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            {isLoadingQr ? (
              <div className="h-44 w-44 rounded-lg bg-secondary animate-pulse flex items-center justify-center text-xs text-muted-foreground">
                Generating QR...
              </div>
            ) : qrData?.qrCodeSvg ? (
              <div className="bg-foreground p-3 rounded-xl shadow-lg border border-border">
                <div
                  className="h-44 w-44"
                  dangerouslySetInnerHTML={{ __html: qrData.qrCodeSvg }}
                />
              </div>
            ) : (
              <div className="h-44 w-44 rounded-lg bg-secondary flex items-center justify-center text-xs text-atlas-error">
                Failed to load QR
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Public Access Link
              </p>
              <p className="mt-1 text-xs font-mono text-primary break-all">
                {qrData?.url ?? 'http://localhost:3001/t/...'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 w-full justify-center pt-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={!qrData}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-background transition-all hover:bg-primary-hover disabled:opacity-50"
              >
                Download QR SVG
              </button>

              <button
                type="button"
                onClick={() => setShowRegenerateConfirm(true)}
                disabled={!qrData}
                className="rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:border-primary disabled:opacity-50"
              >
                Regenerate Token
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Table?"
        description={`Are you sure you want to delete "${table.name}" (${table.code})? This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Regenerate QR Confirmation Modal */}
      <ConfirmDialog
        open={showRegenerateConfirm}
        title="Regenerate QR Token?"
        description={`Are you sure you want to regenerate the QR code for "${table.name}"? The existing QR code will be immediately invalidated and cannot be scanned.`}
        confirmText={isRegenerating ? 'Regenerating...' : 'Regenerate'}
        cancelText="Cancel"
        onConfirm={handleRegenerateQr}
        onCancel={() => setShowRegenerateConfirm(false)}
      />
    </div>
  );
}
