'use client';

import { useState } from 'react';
import type { DiningArea } from '@/types/dining-area';
import type { TableStatus } from '@/types/table';
import { ValidatedInput, ValidatedSelect } from '@/components/ui/validated-input';
import { validateText, validateCode, validateNumber } from '@/lib/validation';

export interface TableFormData {
  diningAreaId: string;
  name: string;
  code: string;
  capacity: number;
  status: TableStatus;
}

interface TableFormProps {
  initialValues?: Partial<TableFormData>;
  diningAreas: DiningArea[];
  isEdit?: boolean;
  isLoading?: boolean;
  onSubmit: (data: TableFormData) => Promise<void>;
  onCancel: () => void;
}

export function TableForm({
  initialValues,
  diningAreas,
  isEdit = false,
  isLoading = false,
  onSubmit,
  onCancel,
}: TableFormProps) {
  const [diningAreaId, setDiningAreaId] = useState(
    initialValues?.diningAreaId ?? (diningAreas[0]?.id || ''),
  );
  const [name, setName] = useState(initialValues?.name ?? '');
  const [code, setCode] = useState(initialValues?.code ?? '');
  const [capacity, setCapacity] = useState<number | string>(initialValues?.capacity ?? 4);
  const [status, setStatus] = useState<TableStatus>(
    initialValues?.status ?? 'ACTIVE',
  );

  const [errors, setErrors] = useState<{
    diningAreaId?: string;
    name?: string;
    code?: string;
    capacity?: string;
  }>({});

  const [formError, setFormError] = useState('');

  // Real-time field validation
  const validateField = (field: string, val: any) => {
    const nextErrors = { ...errors };

    switch (field) {
      case 'diningAreaId':
        if (!val) nextErrors.diningAreaId = 'Please select a dining area';
        else delete nextErrors.diningAreaId;
        break;

      case 'name': {
        const res = validateText(val, 'Table name', 2, 50);
        if (!res.isValid) nextErrors.name = res.error;
        else delete nextErrors.name;
        break;
      }

      case 'code': {
        const res = validateCode(val, 1, 10, 'Table code');
        if (!res.isValid) nextErrors.code = res.error;
        else delete nextErrors.code;
        break;
      }

      case 'capacity': {
        const res = validateNumber(val, 'Seating capacity', 1, 50, true);
        if (!res.isValid) nextErrors.capacity = res.error;
        else delete nextErrors.capacity;
        break;
      }
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameRes = validateText(name, 'Table name', 2, 50);
    const codeRes = validateCode(code, 1, 10, 'Table code');
    const capRes = validateNumber(capacity, 'Seating capacity', 1, 50, true);
    const areaValid = Boolean(diningAreaId);

    const validationErrors: typeof errors = {};
    if (!areaValid) validationErrors.diningAreaId = 'Please select a dining area';
    if (!nameRes.isValid) validationErrors.name = nameRes.error;
    if (!codeRes.isValid) validationErrors.code = codeRes.error;
    if (!capRes.isValid) validationErrors.capacity = capRes.error;

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError('Please resolve the highlighted errors before saving.');
      return;
    }

    setFormError('');
    setErrors({});

    await onSubmit({
      diningAreaId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      capacity: Number(capacity),
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {formError && (
        <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444] animate-in fade-in">
          {formError}
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-xl">
        {/* Dining Area */}
        <ValidatedSelect
          label="Dining Area"
          required
          value={diningAreaId}
          error={errors.diningAreaId}
          onChange={(e) => {
            setDiningAreaId(e.target.value);
            validateField('diningAreaId', e.target.value);
          }}
        >
          <option value="" disabled>
            Select a dining area
          </option>
          {diningAreas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name} ({area.code})
            </option>
          ))}
        </ValidatedSelect>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Table Name */}
          <ValidatedInput
            label="Table Name"
            required
            maxLength={50}
            showCount
            placeholder="e.g. Table 1"
            value={name}
            error={errors.name}
            onChange={(e) => {
              setName(e.target.value);
              validateField('name', e.target.value);
            }}
            onBlur={(e) => validateField('name', e.target.value)}
          />

          {/* Table Code */}
          <ValidatedInput
            label="Table Code"
            required
            maxLength={10}
            uppercase
            showCount
            placeholder="e.g. T01"
            value={code}
            error={errors.code}
            helperText="Max 10 chars, uppercase letters, numbers & hyphens"
            onChange={(e) => {
              setCode(e.target.value);
              validateField('code', e.target.value);
            }}
            onBlur={(e) => validateField('code', e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Seating Capacity */}
          <ValidatedInput
            label="Seating Capacity (1 - 50)"
            required
            type="number"
            min={1}
            max={50}
            step={1}
            value={capacity}
            error={errors.capacity}
            onChange={(e) => {
              setCapacity(e.target.value);
              validateField('capacity', e.target.value);
            }}
            onBlur={(e) => validateField('capacity', e.target.value)}
          />

          {/* Status */}
          <ValidatedSelect
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TableStatus)}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </ValidatedSelect>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-sm font-semibold text-[#F5F7FA] transition-all hover:bg-[#26313C]"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-[#2AFEB7] px-6 py-2.5 text-sm font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] disabled:opacity-50 shadow-sm font-bold"
        >
          {isLoading ? 'Saving...' : isEdit ? 'Update Table' : 'Create Table'}
        </button>
      </div>
    </form>
  );
}
