'use client';

import React, { useId, useRef, useState } from 'react';
import { AlertCircle, Check, Link as LinkIcon, Upload, X } from 'lucide-react';

interface ImageUploadProps {
  label?: string;
  helperText?: string;
  value?: string;
  onChange: (value: string) => void;
  maxSizeMb?: number;
  accept?: string;
}

export function ImageUpload({
  label = 'Upload Image',
  helperText = 'Upload a PNG, JPG, or WEBP photo (up to 5MB)',
  value = '',
  onChange,
  maxSizeMb = 5,
  accept = 'image/png, image/jpeg, image/webp, image/svg+xml',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState(value);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Image size must be less than ${maxSizeMb}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
        setUrlInput(result);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {label}
        </label>

        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
        >
          {isUrlMode ? (
            <>
              <Upload className="h-3 w-3" /> Switch to File Upload
            </>
          ) : (
            <>
              <LinkIcon className="h-3 w-3" /> Enter Image URL
            </>
          )}
        </button>
      </div>

      {isUrlMode ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              id={inputId}
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/payment-qr.png"
              className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onChange(urlInput)}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-background hover:bg-primary-hover flex items-center gap-1"
            >
              <Check className="h-3.5 w-3.5" /> Apply
            </button>
          </div>
          {helperText && (
            <p className="text-[11px] text-muted-foreground">{helperText}</p>
          )}
        </div>
      ) : (
        <div>
          {value ? (
            /* Uploaded Image Preview Box */
            <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-secondary p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-16 w-16 rounded-xl bg-foreground p-1 flex items-center justify-center overflow-hidden border border-border shrink-0 shadow-md">
                  <img
                    src={value}
                    alt="Uploaded QR Preview"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="space-y-0.5 min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                    Custom QR Uploaded
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Image ready &amp; active for customer table payments
                  </p>
                </div>
              </div>

              {/* On a phone the buttons take their own row: the coarse-pointer
                  minimum makes them wide enough to crush the label otherwise. */}
              <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-all"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="rounded-lg border border-atlas-error/30 bg-atlas-error/10 p-1.5 text-xs text-atlas-error hover:bg-atlas-error/20 transition-all"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Drag & Drop Upload Zone. A real button, because the file input
               it opens is visually hidden — as a div this was unreachable by
               keyboard, so there was no way to upload at all. */
            <button
              type="button"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={[
                'flex w-full flex-col items-center justify-center space-y-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors',
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background/60 hover:border-primary/60 hover:bg-secondary/40',
              ].join(' ')}
            >
              <span className="rounded-full border border-border bg-secondary p-3 text-primary">
                <Upload className="h-5 w-5" aria-hidden="true" />
              </span>

              <span className="block space-y-1">
                <span className="block text-xs font-bold text-foreground">
                  Click to upload or drag &amp; drop QR Code photo
                </span>
                <span className="block text-[11px] text-muted-foreground">{helperText}</span>
              </span>
            </button>
          )}

          {/* sr-only rather than hidden: a hidden input is out of the tab
              order, which also detached it from the label above. */}
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-xs font-semibold text-atlas-error"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
