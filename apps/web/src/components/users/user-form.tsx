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
    user?.role ?? 'USER',
  );
  const [status, setStatus] = useState<UserStatus>(
    user?.status ?? 'ACTIVE',
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isEdit) {
      await onSubmit({
        name,
        email,
        phone: phone || undefined,
        role,
        status,
      });

      return;
    }

    await onSubmit({
      name,
      email,
      phone: phone || undefined,
      password,
      role,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-[#F5F7FA]"
        >
          Name
        </label>

        <input
          id="name"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          required
          minLength={2}
          maxLength={100}
          placeholder="Full Name"
          className="w-full rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-[#F5F7FA] placeholder-[#9AA6B2] transition-colors outline-none focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-[#F5F7FA]"
        >
          Email
        </label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
          maxLength={255}
          placeholder="user@example.com"
          className="w-full rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-[#F5F7FA] placeholder-[#9AA6B2] transition-colors outline-none focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-2 block text-sm font-medium text-[#F5F7FA]"
        >
          Phone
        </label>

        <input
          id="phone"
          value={phone}
          onChange={(event) =>
            setPhone(event.target.value)
          }
          maxLength={20}
          placeholder="+1 234 567 8900"
          className="w-full rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-[#F5F7FA] placeholder-[#9AA6B2] transition-colors outline-none focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]"
        />
      </div>

      {!isEdit && (
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-[#F5F7FA]"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
            minLength={8}
            placeholder="••••••••"
            className="w-full rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-[#F5F7FA] placeholder-[#9AA6B2] transition-colors outline-none focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="role"
          className="mb-2 block text-sm font-medium text-[#F5F7FA]"
        >
          Role
        </label>

        <select
          id="role"
          value={role}
          onChange={(event) =>
            setRole(event.target.value as UserRole)
          }
          className="w-full rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-[#F5F7FA] outline-none focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]"
        >
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {isEdit && (
        <div>
          <label
            htmlFor="status"
            className="mb-2 block text-sm font-medium text-[#F5F7FA]"
          >
            Status
          </label>

          <select
            id="status"
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as UserStatus,
              )
            }
            className="w-full rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-[#F5F7FA] outline-none focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
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
          className="rounded-lg bg-[#2AFEB7] px-4 py-2 text-sm font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting
            ? 'Saving...'
            : isEdit
              ? 'Save changes'
              : 'Create user'}
        </button>
      </div>
    </form>
  );
}
