'use client';

import { useState } from 'react';
import type { Menu, MenuStatus } from '@/types/menu';
import { ValidatedInput, ValidatedSelect } from '@/components/ui/validated-input';
import { validateText, validateCode } from '@/lib/validation';

export interface MenuFormValues {
  name: string;
  code: string;
  status: MenuStatus;
}

interface MenuFormProps {
  initialValues?: Menu;
  onSubmit: (values: MenuFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function MenuForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: MenuFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [code, setCode] = useState(initialValues?.code ?? '');
  const [status, setStatus] = useState<MenuStatus>(
    initialValues?.status ?? 'ACTIVE',
  );

  const [errors, setErrors] = useState<{
    name?: string;
    code?: string;
  }>({});

  const [error, setError] = useState('');

  const validateField = (field: string, val: any) => {
    const nextErrors = { ...errors };

    switch (field) {
      case 'name': {
        const res = validateText(val, 'Menu name', 2, 100);
        if (!res.isValid) nextErrors.name = res.error;
        else delete nextErrors.name;
        break;
      }

      case 'code': {
        const res = validateCode(val, 2, 10, 'Menu code');
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
    setError('');

    const nameRes = validateText(name, 'Menu name', 2, 100);
    const codeRes = validateCode(code, 2, 10, 'Menu code');

    const validationErrors: typeof errors = {};
    if (!nameRes.isValid) validationErrors.name = nameRes.error;
    if (!codeRes.isValid) validationErrors.code = codeRes.error;

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError('Please resolve the highlighted errors before saving.');
      return;
    }

    setErrors({});

    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        status,
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'An error occurred while saving the menu');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="rounded-lg border border-atlas-error/40 bg-atlas-error/10 p-3 text-xs text-atlas-error animate-in fade-in">
          {error}
        </div>
      )}

      <ValidatedInput
        label="Menu Name"
        required
        maxLength={100}
        showCount
        placeholder="e.g. Main Menu"
        value={name}
        error={errors.name}
        onChange={(e) => {
          setName(e.target.value);
          validateField('name', e.target.value);
        }}
        onBlur={(e) => validateField('name', e.target.value)}
      />

      <ValidatedInput
        label="Menu Code"
        required
        maxLength={10}
        uppercase
        showCount
        placeholder="e.g. MAIN"
        value={code}
        error={errors.code}
        helperText="2-10 chars, uppercase alphanumeric"
        onChange={(e) => {
          setCode(e.target.value);
          validateField('code', e.target.value);
        }}
        onBlur={(e) => validateField('code', e.target.value)}
      />

      <ValidatedSelect
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as MenuStatus)}
      >
        <option value="ACTIVE">ACTIVE</option>
        <option value="INACTIVE">INACTIVE</option>
      </ValidatedSelect>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:border-primary disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-background hover:bg-primary-hover disabled:opacity-50 font-bold"
        >
          {isSubmitting ? 'Saving...' : initialValues ? 'Update Menu' : 'Create Menu'}
        </button>
      </div>
    </form>
  );
}
