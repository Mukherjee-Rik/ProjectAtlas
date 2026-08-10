import type { UserStatus } from '@/types/user';

interface UserStatusBadgeProps {
  status: UserStatus;
}

export function UserStatusBadge({
  status,
}: UserStatusBadgeProps) {
  const classes: Record<UserStatus, string> = {
    ACTIVE: 'bg-[#2AFEB7]/15 text-[#2AFEB7] border border-[#2AFEB7]/30',
    INACTIVE: 'bg-[#26313C]/50 text-[#9AA6B2] border border-[#26313C]',
    SUSPENDED: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classes[status]}`}
    >
      {status}
    </span>
  );
}
