'use client';

import { FormEvent, useState } from 'react';
import type {
  CreateUserPayload,
  UpdateUserPayload,
} from '@/services/users.service';
import type {
  User,
  UserRole,
  UserStatus,
} from '@/types/user';
import { ValidatedInput, ValidatedSelect } from '@/components/ui/validated-input';
import { validateText, validateEmail, validatePhone, validatePassword } from '@/lib/validation';

interface UserFormProps {
  user?: User;
  onSubmit: (
    data: CreateUserPayload | UpdateUserPayload,
  ) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function UserForm({
  user,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: UserFormProps) {
  const isEdit = Boolean(user);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(
    user?.role ?? 'WAITER',
  );
  const [status, setStatus] = useState<UserStatus>(
    user?.status ?? 'ACTIVE',
  );

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>({});

  const [formError, setFormError] = useState('');

  const validateField = (field: string, val: any) => {
    const nextErrors = { ...errors };

    switch (field) {
      case 'name': {
        const res = validateText(val, 'Full name', 2, 100);
        if (!res.isValid) nextErrors.name = res.error;
        else delete nextErrors.name;
        break;
      }

      case 'email': {
        const res = validateEmail(val, true);
        if (!res.isValid) nextErrors.email = res.error;
        else delete nextErrors.email;
        break;
      }

      case 'phone': {
        const res = validatePhone(val, false);
        if (!res.isValid) nextErrors.phone = res.error;
        else delete nextErrors.phone;
        break;
      }

      case 'password': {
        if (!isEdit) {
          const res = validatePassword(val, 8, true);
          if (!res.isValid) nextErrors.password = res.error;
          else delete nextErrors.password;
        }
        break;
      }
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const nameRes = validateText(name, 'Full name', 2, 100);
    const emailRes = validateEmail(email, true);
    const phoneRes = validatePhone(phone, false);
    const passwordRes = !isEdit ? validatePassword(password, 8, true) : { isValid: true };

    const validationErrors: typeof errors = {};
    if (!nameRes.isValid) validationErrors.name = nameRes.error;
    if (!emailRes.isValid) validationErrors.email = emailRes.error;
    if (!phoneRes.isValid) validationErrors.phone = phoneRes.error;
    if (!passwordRes.isValid) validationErrors.password = passwordRes.error;

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError('Please resolve the highlighted errors before saving.');
      return;
    }

    setFormError('');
    setErrors({});

    if (isEdit) {
      await onSubmit({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        role,
        status,
      } as UpdateUserPayload);

      return;
    }

    await onSubmit({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      password,
      role,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      noValidate
    >
      {formError && (
        <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444] animate-in fade-in">
          {formError}
        </div>
      )}

      <ValidatedInput
        label="Staff Full Name"
        required
        maxLength={100}
        showCount
        placeholder="e.g. Rahul Sharma"
        value={name}
        error={errors.name}
        onChange={(e) => {
          setName(e.target.value);
          validateField('name', e.target.value);
        }}
        onBlur={(e) => validateField('name', e.target.value)}
      />

      <ValidatedInput
        label="Email Address"
        required
        type="email"
        maxLength={255}
        placeholder="waiter@spicegarden.com"
        value={email}
        error={errors.email}
        helperText="Strict email address (e.g. name@restaurant.com)"
        onChange={(e) => {
          setEmail(e.target.value);
          validateField('email', e.target.value);
        }}
        onBlur={(e) => validateField('email', e.target.value)}
      />

      <ValidatedInput
        label="Phone Number"
        type="tel"
        maxLength={15}
        placeholder="9876543210"
        value={phone}
        error={errors.phone}
        helperText="7 to 15 digits with optional country code"
        onChange={(e) => {
          setPhone(e.target.value);
          validateField('phone', e.target.value);
        }}
        onBlur={(e) => validateField('phone', e.target.value)}
      />

      {!isEdit && (
        <ValidatedInput
          label="Password"
          required
          type="password"
          minLength={8}
          maxLength={100}
          placeholder="••••••••"
          value={password}
          error={errors.password}
          helperText="Must be at least 8 characters"
          onChange={(e) => {
            setPassword(e.target.value);
            validateField('password', e.target.value);
          }}
          onBlur={(e) => validateField('password', e.target.value)}
        />
      )}

      <ValidatedSelect
        label="Restaurant Role"
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
      >
        <option value="CASHIER">Cashier (POS & Kitchen)</option>
        <option value="WAITER">Waiter / Floor Staff</option>
        <option value="KITCHEN">Kitchen Staff</option>
        <option value="MANAGER">Restaurant Manager</option>
        <option value="STAFF">General Staff</option>
        <option value="OWNER">Restaurant Owner</option>
        <option value="ADMIN">Administrator</option>
      </ValidatedSelect>

      {isEdit && (
        <ValidatedSelect
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as UserStatus)}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </ValidatedSelect>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2 text-sm font-medium text-[#F5F7FA] transition-colors hover:border-[#2AFEB7]"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#2AFEB7] px-4 py-2 text-sm font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99] disabled:opacity-50 font-bold"
        >
          {isSubmitting
            ? 'Saving...'
            : isEdit
              ? 'Save changes'
              : 'Add Staff Member'}
        </button>
      </div>
    </form>
  );
}
