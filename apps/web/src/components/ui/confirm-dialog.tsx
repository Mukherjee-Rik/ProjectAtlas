'use client';

import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmLoadingText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  icon?: React.ReactNode;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmLoadingText = 'Processing...',
  variant = 'danger',
  icon,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-background hover:bg-primary-hover shadow-[0_0_12px_rgba(42,254,183,0.2)]';
      case 'warning':
        return 'bg-atlas-warning text-black hover:bg-atlas-warning';
      case 'danger':
      default:
        return 'bg-atlas-error text-foreground hover:bg-atlas-error shadow-[0_0_12px_rgba(239,68,68,0.2)]';
    }
  };

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4"
      >
        <div className="flex items-start gap-3.5">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary border border-border text-xl">
              {icon}
            </div>
          )}
          <div className="space-y-1 flex-1">
            <h2 className="text-lg font-bold text-foreground">
              {title}
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-border bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary/80 disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${getConfirmButtonClasses()}`}
          >
            {isLoading ? confirmLoadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
