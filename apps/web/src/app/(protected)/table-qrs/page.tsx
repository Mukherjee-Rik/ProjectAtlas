'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';
import { getTables, getTableQr } from '@/services/tables.service';
import { getDiningAreas } from '@/services/dining-areas.service';
import type { RestaurantTable } from '@/types/table';
import type { DiningArea } from '@/types/dining-area';

interface TableWithQr extends RestaurantTable {
  qrCodeSvg?: string;
  qrUrl?: string;
}

export default function TableQrsDashboard() {
  const { currentRestaurant } = useRestaurant();
  const { currentBranch } = useBranch();

  const [diningAreas, setDiningAreas] = useState<DiningArea[]>([]);
  const [tables, setTables] = useState<TableWithQr[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQrs, setLoadingQrs] = useState(false);
  const [error, setError] = useState('');
  const [detectedBaseUrl, setDetectedBaseUrl] = useState<string | null>(null);
  const [detectedIp, setDetectedIp] = useState<string | null>(null);

  // Auto-detect the laptop's LAN IP on mount
  useEffect(() => {
    fetch('/api/server-ip')
      .then((r) => r.json())
      .then((data: { ip: string | null; baseUrl: string | null }) => {
        setDetectedIp(data.ip);
        setDetectedBaseUrl(data.baseUrl);
      })
      .catch(() => {
        // silent — will fall back to Origin header on backend
      });
  }, []);

  const loadData = useCallback(async () => {
    if (!currentBranch) {
      setTables([]);
      setDiningAreas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const [areasRes, tablesRes] = await Promise.all([
        getDiningAreas(),
        getTables(),
      ]);

      setDiningAreas(areasRes.data ?? []);
      const activeTables = (tablesRes.data ?? []).filter((t) => t.status === 'ACTIVE');
      setTables(activeTables);

      // Trigger parallel loading of QR codes with auto-detected IP
      void loadQrsInParallel(activeTables, detectedBaseUrl ?? undefined);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to load tables data.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBranch, detectedBaseUrl]);

  const loadQrsInParallel = async (tableList: RestaurantTable[], baseUrl?: string) => {
    setLoadingQrs(true);
    try {
      const qrPromises = tableList.map(async (table) => {
        try {
          const res = await getTableQr(table.id, baseUrl);
          return {
            tableId: table.id,
            qrCodeSvg: res.data?.qrCodeSvg,
            qrUrl: res.data?.url,
          };
        } catch (e) {
          console.error(`Failed to load QR for table ${table.name}`, e);
          return { tableId: table.id, qrCodeSvg: undefined, qrUrl: undefined };
        }
      });

      const qrResults = await Promise.all(qrPromises);

      setTables((prev) =>
        prev.map((t) => {
          const match = qrResults.find((r) => r.tableId === t.id);
          return match
            ? { ...t, qrCodeSvg: match.qrCodeSvg, qrUrl: match.qrUrl }
            : t;
        }),
      );
    } catch (err) {
      console.error('Error loading QR codes in parallel', err);
    } finally {
      setLoadingQrs(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleDownloadQr = (table: TableWithQr) => {
    if (!table.qrCodeSvg) return;
    const blob = new Blob([table.qrCodeSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${table.name.replace(/\s+/g, '-').toLowerCase()}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!currentRestaurant || !currentBranch) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center shadow-xl space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#18212B] text-2xl">
          📱
        </div>
        <h2 className="text-xl font-bold text-[#F5F7FA]">
          Select restaurant & branch
        </h2>
        <p className="text-sm text-[#9AA6B2]">
          Please select your restaurant workspace and branch to manage Table QR codes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Printable styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, main, html {
            background: white !important;
            color: black !important;
          }
          header, .no-print {
            display: none !important;
          }
          .print-area {
            display: block !important;
            width: 100% !important;
          }
          .print-card-grid {
            display: grid !important;
            grid-template-cols: repeat(2, 1fr) !important;
            gap: 20px !important;
            page-break-inside: avoid !important;
          }
          .print-card {
            border: 2px solid black !important;
            padding: 20px !important;
            background: white !important;
            color: black !important;
            text-align: center !important;
            page-break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .print-qr-svg svg {
            width: 180px !important;
            height: 180px !important;
            fill: black !important;
          }
        }
      `}} />

      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#26313C] pb-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F7FA]">Table QR Codes</h1>
          <p className="text-xs text-[#9AA6B2]">
            Grouped by Dining Area inside branch:{' '}
            <span className="font-semibold text-[#F5F7FA]">{currentBranch.name}</span>
          </p>
          {/* IP auto-detection status badge */}
          <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-1.5">
            {detectedIp ? (
              <>
                <span className="h-2 w-2 rounded-full bg-[#2AFEB7] shadow-[0_0_6px_#2AFEB7]" />
                <span className="text-[10px] font-mono text-[#2AFEB7]">
                  📶 QR codes point to: <strong>{detectedBaseUrl}</strong>
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-[#F59E0B] animate-pulse" />
                <span className="text-[10px] font-mono text-[#F59E0B]">
                  ⚠️ LAN IP not detected — QRs may use localhost
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={tables.length === 0}
            onClick={() => window.print()}
            className="rounded-lg bg-[#2AFEB7] px-4 py-2.5 text-xs font-semibold text-[#0B0F14] hover:bg-[#22E5A4]"
          >
            🖨️ Print All QRs
          </button>
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-xs text-[#F5F7FA]"
          >
            Reload
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center text-sm text-[#9AA6B2] no-print">
          Loading dining area maps and configurations...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-6 text-center text-xs text-[#EF4444] no-print">
          {error}
        </div>
      ) : tables.length === 0 ? (
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center text-sm text-[#9AA6B2] no-print">
          No active tables found in this branch. Go to Tables section to configure rooms.
        </div>
      ) : (
        <div className="space-y-10 print-area">
          {diningAreas.map((area) => {
            const areaTables = tables.filter((t) => t.diningAreaId === area.id);
            if (areaTables.length === 0) return null;

            return (
              <div key={area.id} className="space-y-4 page-break-after-avoid">
                <h2 className="text-lg font-bold text-[#F5F7FA] border-b border-[#26313C] pb-2 print:text-black print:border-black print:mt-6">
                  {area.name} ({area.code})
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 print-card-grid">
                  {areaTables.map((table) => (
                    <div
                      key={table.id}
                      className="flex flex-col items-center justify-between rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-lg print-card"
                    >
                      <div className="text-center">
                        <h3 className="text-base font-black text-[#F5F7FA] print:text-black">
                          Table {table.name}
                        </h3>
                        <p className="text-[10px] font-mono text-[#9AA6B2] mt-0.5 print:text-black/70">
                          Cap: {table.capacity} | Code: {table.code}
                        </p>
                      </div>

                      {/* QR Display */}
                      <div className="my-6 flex h-48 w-48 items-center justify-center rounded-xl bg-white p-4 shadow-inner print:my-4 print-qr-svg">
                        {table.qrCodeSvg ? (
                          <div
                            className="w-full h-full text-black flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: table.qrCodeSvg }}
                          />
                        ) : (
                          <div className="text-[10px] text-gray-400 animate-pulse">
                            Loading QR…
                          </div>
                        )}
                      </div>

                      {/* Download button */}
                      <div className="w-full flex flex-col gap-2 no-print">
                        {table.qrUrl && (
                          <a
                            href={table.qrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full text-center rounded bg-[#18212B] border border-[#26313C] py-1.5 text-[10px] font-bold text-[#9AA6B2] hover:text-[#2AFEB7] hover:border-[#2AFEB7]"
                          >
                            🔗 Scan Link
                          </a>
                        )}
                        <button
                          type="button"
                          disabled={!table.qrCodeSvg}
                          onClick={() => handleDownloadQr(table)}
                          className="w-full rounded bg-[#2AFEB7] py-2 text-[10px] font-bold text-[#0B0F14] hover:bg-[#22E5A4]"
                        >
                          📥 Download SVG
                        </button>
                      </div>

                      <div className="hidden print:block text-[9px] text-center text-black/60 font-bold uppercase tracking-wider mt-2">
                        Scan to View Menu & Order
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
