'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api-client';

interface AuditLog {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  restaurantId: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export function AuditDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [action, setAction] = useState('');
  const [actorEmail, setActorEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError('');
    try {
      let query = `?action=${action}&actorEmail=${actorEmail}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;
      
      const res = await apiClient.get<any>(`/audit${query}`);
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setLogs(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch platform security logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, [action, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchLogs();
  };

  return (
    <div className="space-y-6 text-left">
      {/* Search Filter Header */}
      <form onSubmit={handleSearchSubmit} className="rounded-2xl border border-[#26313C] bg-[#111820] p-4 flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2]">Actor Email</span>
          <input
            type="text"
            placeholder="Search email..."
            value={actorEmail}
            onChange={(e) => setActorEmail(e.target.value)}
            className="rounded-xl border border-[#26313C] bg-[#18212B] px-3 py-2 text-xs text-[#F5F7FA] outline-none hover:border-[#2AFEB7] focus:border-[#2AFEB7] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1 w-44">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2]">Action Type</span>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-xl border border-[#26313C] bg-[#18212B] px-3 py-2 text-xs text-[#F5F7FA] outline-none hover:border-[#2AFEB7] focus:border-[#2AFEB7] transition-colors"
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="LOGOUT_ALL">LOGOUT_ALL</option>
            <option value="REFRESH_TOKEN_REUSE">REFRESH_TOKEN_REUSE</option>
            <option value="RESTAURANT_CREATED">RESTAURANT_CREATED</option>
            <option value="SESSION_REVOKED">SESSION_REVOKED</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 w-36">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2]">Start Date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-[#26313C] bg-[#18212B] px-3 py-2 text-xs text-[#F5F7FA] outline-none hover:border-[#2AFEB7] focus:border-[#2AFEB7] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1 w-36">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2]">End Date</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-[#26313C] bg-[#18212B] px-3 py-2 text-xs text-[#F5F7FA] outline-none hover:border-[#2AFEB7] focus:border-[#2AFEB7] transition-colors"
          />
        </div>

        <button
          type="submit"
          className="self-end rounded-xl bg-[#2AFEB7] hover:bg-[#2AFEB7]/80 px-4 py-2.5 text-xs font-bold text-[#0B0F14] transition-colors h-[38px] mt-auto"
        >
          Filter
        </button>
      </form>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-[#26313C] bg-[#111820] shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2AFEB7] border-t-transparent" />
            <span className="text-xs text-[#9AA6B2]">Loading security database...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#26313C] bg-[#18212B]/40 text-[#9AA6B2] uppercase tracking-wider">
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26313C]/50">
                {logs.map((log) => {
                  const isSuspicious = log.action === 'REFRESH_TOKEN_REUSE' || log.action === 'LOGIN_FAILED';
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-[#18212B]/50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-bold">
                        <span className={isSuspicious ? 'text-red-500' : 'text-[#2AFEB7]'}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#F5F7FA]">{log.actorEmail || 'Unknown'}</td>
                      <td className="py-3 px-4 text-[#9AA6B2]">{log.resourceType}</td>
                      <td className="py-3 px-4 font-mono text-[#9AA6B2]">{log.ipAddress || '—'}</td>
                      <td className="py-3 px-4 text-[#9AA6B2]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}

                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#9AA6B2]">
                      No security audit log matches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070B0E]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#26313C] pb-4">
              <h3 className="text-base font-bold text-[#F5F7FA]">Security Event Details</h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-xs text-[#9AA6B2] hover:text-[#F5F7FA]"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[#9AA6B2]">Event Action:</span>
                <span className="col-span-2 font-bold text-[#2AFEB7]">{selectedLog.action}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[#9AA6B2]">Actor Email:</span>
                <span className="col-span-2 text-[#F5F7FA]">{selectedLog.actorEmail || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[#9AA6B2]">Resource:</span>
                <span className="col-span-2 text-[#F5F7FA]">{selectedLog.resourceType} ({selectedLog.resourceId || '—'})</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[#9AA6B2]">IP Address:</span>
                <span className="col-span-2 font-mono text-[#F5F7FA]">{selectedLog.ipAddress || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[#9AA6B2]">User Agent:</span>
                <span className="col-span-2 text-[#9AA6B2]">{selectedLog.userAgent || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[#9AA6B2]">Timestamp:</span>
                <span className="col-span-2 text-[#F5F7FA]">{new Date(selectedLog.createdAt).toLocaleString()}</span>
              </div>
              <div className="border-t border-[#26313C] pt-4 space-y-2">
                <span className="font-bold text-[#9AA6B2] block">Event Metadata Payload:</span>
                <pre className="rounded-xl border border-[#26313C] bg-[#070B0E] p-4 text-[10px] text-[#2AFEB7] font-mono overflow-x-auto max-h-32">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
