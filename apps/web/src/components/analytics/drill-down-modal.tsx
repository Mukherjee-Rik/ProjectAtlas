'use client';

import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Receipt, ShoppingBag } from 'lucide-react';
import { analyticsService, type DrillDownResponse } from '@/services/analytics.service';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  dimension: 'BRANCH' | 'CATEGORY' | 'MENU_ITEM' | 'ORDER';
  targetId?: string;
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
}

export function DrillDownModal({
  isOpen,
  onClose,
  title,
  dimension,
  targetId,
  dateFrom,
  dateTo,
  branchId,
}: DrillDownModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DrillDownResponse['data'] | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    analyticsService
      .getDrillDown({
        dimension,
        targetId,
        dateFrom,
        dateTo,
        branchId,
      })
      .then((res) => {
        setData(res?.data ?? null);
      })
      .catch((err) => {
        console.error('Failed to load drill-down data:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, dimension, targetId, dateFrom, dateTo, branchId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-bold text-base text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground">Detailed underlying transaction records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="space-y-3 py-12">
              <div className="h-12 bg-muted/40 animate-pulse rounded-lg" />
              <div className="h-12 bg-muted/40 animate-pulse rounded-lg" />
              <div className="h-12 bg-muted/40 animate-pulse rounded-lg" />
            </div>
          ) : !data || (!data.transactions && !data.results) ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No matching records found for this drill-down filter.
            </div>
          ) : data.transactions ? (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">
                Showing {data.transactions.length} matching transactions:
              </div>
              {data.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-card border border-border/80 rounded-xl p-4 hover:border-primary/50 transition-all space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{tx.orderNumber}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                        {tx.status}
                      </span>
                      <span className="text-muted-foreground">• {tx.tableName} ({tx.branchName})</span>
                    </div>
                    <div className="font-bold text-sm text-foreground">
                      ₹{tx.totalAmount.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="pt-2 border-t border-border/40 flex flex-wrap gap-2">
                    {tx.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-muted/60 text-foreground text-[11px] font-medium"
                      >
                        {it.name} × {it.quantity} (₹{it.totalPrice})
                      </span>
                    ))}
                  </div>

                  <div className="text-[10px] text-muted-foreground flex justify-between pt-1">
                    <span>Placed: {new Date(tx.createdAt).toLocaleString()}</span>
                    <span>
                      Sub: ₹{tx.subtotal} | Tax: ₹{tx.taxAmount} | Disc: ₹{tx.discountAmount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {data.results?.map((res: any) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50 text-xs"
                >
                  <div className="font-semibold text-foreground">{res.name}</div>
                  <div className="font-bold text-foreground">₹{res.grossRevenue?.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-all"
          >
            Close Drill-down
          </button>
        </div>
      </div>
    </div>
  );
}
