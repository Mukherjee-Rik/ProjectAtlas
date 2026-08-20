'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Check } from 'lucide-react';

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
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
          {label}
        </label>

        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="text-[11px] text-[#2AFEB7] hover:underline flex items-center gap-1 font-medium"
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
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/payment-qr.png"
              className="flex-1 rounded-xl border border-[#26313C] bg-[#0B0F14] px-3.5 py-2.5 text-xs text-[#F5F7FA] placeholder-[#64748B] focus:border-[#2AFEB7] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onChange(urlInput)}
              className="rounded-xl bg-[#2AFEB7] px-4 py-2 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4] flex items-center gap-1"
            >
              <Check className="h-3.5 w-3.5" /> Apply
            </button>
          </div>
          {helperText && (
            <p className="text-[11px] text-[#9AA6B2]">{helperText}</p>
          )}
        </div>
      ) : (
        <div>
          {value ? (
            /* Uploaded Image Preview Box */
            <div className="relative rounded-2xl border border-[#2AFEB7]/40 bg-[#18212B] p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden border border-[#26313C] shrink-0 shadow-md">
                  <img
                    src={value}
                    alt="Uploaded QR Preview"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-bold text-[#F5F7FA] flex items-center gap-1.5">
                    <span className="text-[#2AFEB7]">✓</span> Custom QR Uploaded
                  </p>
                  <p className="text-[11px] text-[#9AA6B2]">
                    Image ready & active for customer table payments
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-[#26313C] bg-[#111820] px-3 py-1.5 text-xs font-semibold text-[#F5F7FA] hover:border-[#2AFEB7] hover:text-[#2AFEB7] transition-all"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-1.5 text-xs text-[#EF4444] hover:bg-[#EF4444]/20 transition-all"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Drag & Drop Upload Zone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={[
                'cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 flex flex-col items-center justify-center space-y-2',
                isDragging
                  ? 'border-[#2AFEB7] bg-[#2AFEB7]/10 scale-[1.01]'
                  : 'border-[#26313C] bg-[#0B0F14]/60 hover:border-[#2AFEB7]/60 hover:bg-[#18212B]/40',
              ].join(' ')}
            >
              <div className="rounded-full bg-[#18212B] p-3 text-[#2AFEB7] border border-[#26313C] shadow-inner">
                <Upload className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-[#F5F7FA]">
                  Click to upload or drag & drop QR Code photo
                </p>
                <p className="text-[11px] text-[#9AA6B2]">{helperText}</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="text-xs font-semibold text-[#EF4444] animate-fadeIn">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
