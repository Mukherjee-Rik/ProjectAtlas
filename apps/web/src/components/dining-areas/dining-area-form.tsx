'use client';

import { useState } from 'react';
import type { DiningAreaStatus } from '@/types/dining-area';
import { ValidatedInput, ValidatedSelect } from '@/components/ui/validated-input';
import { validateText, validateCode } from '@/lib/validation';

export interface DiningAreaFormData {
  name: string;
  code: string;
  status: DiningAreaStatus;
}

interface DiningAreaFormProps {
  initialValues?: Partial<DiningAreaFormData>;
  isEdit?: boolean;
  isLoading?: boolean;
  onSubmit: (data: DiningAreaFormData) => Promise<void>;
  onCancel: () => void;
}

export function DiningAreaForm({
  initialValues,
  isEdit = false,
  isLoading = false,
  onSubmit,
  onCancel,
}: DiningAreaFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [code, setCode] = useState(initialValues?.code ?? '');
  const [status, setStatus] = useState<DiningAreaStatus>(
    initialValues?.status ?? 'ACTIVE',
  );

  const [errors, setErrors] = useState<{
    name?: string;
    code?: string;
  }>({});

  const [formError, setFormError] = useState('');

  const validateField = (field: string, val: any) => {
    const nextErrors = { ...errors };

    switch (field) {
      case 'name': {
        const res = validateText(val, 'Dining area name', 2, 50);
        if (!res.isValid) nextErrors.name = res.error;
        else delete nextErrors.name;
        break;
      }

      case 'code': {
        const res = validateCode(val, 2, 10, 'Dining area code');
        if (!res.isValid) nextErrors.code = res.error;
        else delete nextErrors.code;
        break;
      }
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameRes = validateText(name, 'Dining area name', 2, 50);
    const codeRes = validateCode(code, 2, 10, 'Dining area code');

    const validationErrors: typeof errors = {};
    if (!nameRes.isValid) validationErrors.name = nameRes.error;
    if (!codeRes.isValid) validationErrors.code = codeRes.error;

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError('Please resolve the highlighted errors before saving.');
      return;
    }

    setFormError('');
    setErrors({});

    await onSubmit({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {formError && (
        <div className="rounded-xl border border-atlas-error/40 bg-atlas-error/10 p-4 text-sm text-atlas-error animate-in fade-in">
          {formError}
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <ValidatedInput
            label="Dining Area Name"
            required
            maxLength={50}
            showCount
            placeholder="e.g. Indoor Dining"
            value={name}
            error={errors.name}
            onChange={(e) => {
              setName(e.target.value);
              validateField('name', e.target.value);
            }}
            onBlur={(e) => validateField('name', e.target.value)}
          />

          <ValidatedInput
            label="Code"
            required
            maxLength={10}
            uppercase
            showCount
            placeholder="e.g. INDOOR"
            value={code}
            error={errors.code}
            helperText="2-10 chars, uppercase alphanumeric"
            onChange={(e) => {
              setCode(e.target.value);
              validateField('code', e.target.value);
            }}
            onBlur={(e) => validateField('code', e.target.value)}
          />
        </div>

        <ValidatedSelect
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as DiningAreaStatus)}
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </ValidatedSelect>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-border"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-background transition-all hover:bg-primary-hover disabled:opacity-50 font-bold"
        >
          {isLoading
            ? 'Saving...'
            : isEdit
            ? 'Update Dining Area'
            : 'Create Dining Area'}
        </button>
      </div>
    </form>
  );
}
