'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Announced while `isLoading` so the state change is not silent. */
  loadingText?: string;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[#2AFEB7] text-[#0B0F14] hover:bg-[#22E5A4] font-bold shadow-sm disabled:hover:bg-[#2AFEB7]',
  secondary:
    'border border-[#26313C] bg-[#18212B] text-[#F5F7FA] hover:border-[#2AFEB7] hover:text-[#2AFEB7] disabled:hover:border-[#26313C] disabled:hover:text-[#F5F7FA]',
  ghost:
    'text-[#9AA6B2] hover:bg-[#18212B] hover:text-[#F5F7FA] disabled:hover:bg-transparent',
  danger:
    'border border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 disabled:hover:bg-[#EF4444]/10',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    isLoading = false,
    loadingText,
    leftIcon,
    fullWidth = false,
    className = '',
    disabled,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      // A button that is busy must not be clickable twice.
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={`inline-flex items-center justify-center rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </button>
  );
});
