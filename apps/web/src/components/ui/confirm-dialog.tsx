'use client';

import React, { useEffect, useId, useRef } from 'react';

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
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape closes, the page behind stops scrolling, Tab stays inside the two
  // choices, and focus starts on the safe one — a destructive dialog should
  // never open with the confirm button under a stray Enter press.
  useEffect(() => {
    if (!open) return;

    cancelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-background hover:bg-primary-hover';
      case 'warning':
        // --background inverts per mode; `text-black` could not, and lost
        // contrast against the light-mode amber.
        return 'bg-atlas-warning text-background hover:bg-atlas-warning/90';
      case 'danger':
      default:
        // --destructive holds the same value as --color-error in both modes,
        // so --destructive-foreground is this fill's matching label colour.
        return 'bg-atlas-error text-destructive-foreground hover:bg-atlas-error/90';
    }
  };

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4"
      >
        <div className="flex items-start gap-3.5">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary border border-border text-muted-foreground">
              {icon}
            </div>
          )}
          <div className="space-y-1 flex-1">
            <h2 id={titleId} className="text-lg font-bold text-foreground">
              {title}
            </h2>
            <p id={descriptionId} className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${getConfirmButtonClasses()}`}
          >
            {isLoading ? confirmLoadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
