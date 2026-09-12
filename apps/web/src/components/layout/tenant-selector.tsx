'use client';

import { Building2, ChevronDown } from 'lucide-react';

import { useTenant } from '@/hooks/use-tenant';

export function TenantSelector() {
  const { currentTenant, memberships, setCurrentTenant } = useTenant();

  if (memberships.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
        <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Mukherjee Restaurant Group</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center">
      <select
        aria-label="Switch workspace"
        value={currentTenant?.id ?? ''}
        onChange={(e) => {
          const selectedId = e.target.value;
          const membership = memberships.find(
            (m) => m.tenantId === selectedId || m.tenant?.id === selectedId,
          );
          if (membership?.tenant) {
            setCurrentTenant(membership.tenant);
          }
        }}
        className="min-w-0 max-w-[180px] truncate appearance-none rounded-lg border border-border bg-secondary py-1.5 pl-3 pr-8 text-xs font-semibold text-foreground transition-all hover:border-primary focus:border-primary focus:outline-none"
      >
        {memberships.map((m) => {
          const tenant = m.tenant;
          if (!tenant) return null;
          return (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          );
        })}
      </select>

      <div className="pointer-events-none absolute right-2 text-muted-foreground">
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
    </div>
  );
}
