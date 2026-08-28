'use client';

import { useTenant } from '@/hooks/use-tenant';

export function TenantSelector() {
  const { currentTenant, memberships, setCurrentTenant } = useTenant();

  if (memberships.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-muted-foreground" />
        <span>Mukherjee Restaurant Group</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center">
      <select
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
        className="appearance-none rounded-lg border border-border bg-secondary py-1.5 pl-3 pr-8 text-xs font-semibold text-foreground transition-all hover:border-primary focus:border-primary focus:outline-none"
      >
        {memberships.map((m) => {
          const tenant = m.tenant;
          if (!tenant) return null;
          return (
            <option key={tenant.id} value={tenant.id}>
              🏢 {tenant.name}
            </option>
          );
        })}
      </select>

      <div className="pointer-events-none absolute right-2 text-xs text-muted-foreground">
        ▼
      </div>
    </div>
  );
}
