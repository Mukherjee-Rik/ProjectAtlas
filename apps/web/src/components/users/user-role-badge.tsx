import type { UserRole } from '@/types/user';

interface UserRoleBadgeProps {
  role: UserRole;
}

export function UserRoleBadge({
  role,
}: UserRoleBadgeProps) {
  return (
    <span className="inline-flex rounded-full border border-[#26313C] bg-[#18212B] px-2.5 py-1 text-xs font-medium text-[#F5F7FA]">
      {role}
    </span>
  );
}
