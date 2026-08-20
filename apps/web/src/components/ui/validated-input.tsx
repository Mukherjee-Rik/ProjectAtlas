'use client';

import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';

/* -------------------------------------------------------------------------
   ValidatedInput
------------------------------------------------------------------------- */
export interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
  uppercase?: boolean;
  containerClassName?: string;
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      label,
      error,
      helperText,
      showCount,
      uppercase = false,
      maxLength,
      className = '',
      containerClassName = '',
      required,
      value,
      onChange,
      id: customId,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const currentLength = typeof value === 'string' || typeof value === 'number' ? String(value).length : 0;
    const shouldShowCount = showCount !== false && maxLength != null && maxLength > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (uppercase && e.target.value) {
        e.target.value = e.target.value.toUpperCase();
      }
      onChange?.(e);
    };

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]"
            >
              {label} {required && <span className="text-[#EF4444]">*</span>}
            </label>
            {shouldShowCount && (
              <span
                className={`text-[10px] font-mono font-medium ${
                  currentLength > (maxLength || 0)
                    ? 'text-[#EF4444]'
                    : currentLength === maxLength
                    ? 'text-[#EAB308]'
                    : 'text-[#9AA6B2]/70'
                }`}
              >
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full rounded-lg border bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2]/50 transition-colors outline-none ${
              error
                ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]'
                : 'border-[#26313C] focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]'
            } ${uppercase ? 'uppercase font-mono' : ''} ${className}`}
            {...props}
          />
        </div>

        {error ? (
          <p
            id={errorId}
            className="flex items-center gap-1.5 text-xs text-[#EF4444] animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-[#9AA6B2]/70">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

ValidatedInput.displayName = 'ValidatedInput';

/* -------------------------------------------------------------------------
   ValidatedTextarea
------------------------------------------------------------------------- */
export interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
  containerClassName?: string;
}

export const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCount,
      maxLength,
      className = '',
      containerClassName = '',
      required,
      value,
      id: customId,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;

    const currentLength = typeof value === 'string' ? value.length : 0;
    const shouldShowCount = showCount !== false && maxLength != null && maxLength > 0;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]"
            >
              {label} {required && <span className="text-[#EF4444]">*</span>}
            </label>
            {shouldShowCount && (
              <span
                className={`text-[10px] font-mono font-medium ${
                  currentLength > (maxLength || 0)
                    ? 'text-[#EF4444]'
                    : currentLength === maxLength
                    ? 'text-[#EAB308]'
                    : 'text-[#9AA6B2]/70'
                }`}
              >
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          required={required}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-lg border bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2]/50 transition-colors outline-none resize-y min-h-[80px] ${
            error
              ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]'
              : 'border-[#26313C] focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]'
          } ${className}`}
          {...props}
        />

        {error ? (
          <p
            id={errorId}
            className="flex items-center gap-1.5 text-xs text-[#EF4444] animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-[#9AA6B2]/70">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

ValidatedTextarea.displayName = 'ValidatedTextarea';

/* -------------------------------------------------------------------------
   ValidatedSelect
------------------------------------------------------------------------- */
export interface ValidatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

export const ValidatedSelect = React.forwardRef<HTMLSelectElement, ValidatedSelectProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      containerClassName = '',
      required,
      id: customId,
      children,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]"
          >
            {label} {required && <span className="text-[#EF4444]">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-lg border bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] transition-colors outline-none ${
            error
              ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]'
              : 'border-[#26313C] focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]'
          } ${className}`}
          {...props}
        >
          {children}
        </select>

        {error ? (
          <p
            id={errorId}
            className="flex items-center gap-1.5 text-xs text-[#EF4444] animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-[#9AA6B2]/70">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

ValidatedSelect.displayName = 'ValidatedSelect';
