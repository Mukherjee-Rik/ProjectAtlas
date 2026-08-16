'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api-client';

interface DeviceSession {
  id: string;
  deviceName: string;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string;
}

export function SessionsList() {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiClient.get<any>('/auth/sessions');
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setSessions(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load active login sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSessions();
  }, []);

  const handleRevoke = async (id: string) => {
    setActionId(id);
    try {
      await apiClient.delete(`/auth/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err?.message || 'Failed to terminate session');
    } finally {
      setActionId(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm('Are you sure you want to terminate all other active device sessions? You will need to log back in on those devices.')) {
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post('/auth/logout-all');
      // Refresh list (current session will also clear cookies, so this might redirect to login if current session is invalidated,
      // but logoutAll keeps current cookie if called correctly, wait - on backend we clear cookie for the caller response, so caller will logout. That is perfect!)
      window.location.href = '/login';
    } catch (err: any) {
      alert(err?.message || 'Failed to revoke all sessions');
      setIsLoading(false);
    }
  };

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2AFEB7] border-t-transparent" />
        <span className="text-xs text-[#9AA6B2]">Scanning active logins...</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-xl space-y-6 text-left">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#F5F7FA]">Active Login Sessions</h3>
          <p className="text-xs text-[#9AA6B2]">
            Review all active devices authorized to access your account.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRevokeAll}
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all"
        >
          Logout All Devices
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500">
          {error}
        </div>
      )}

      <div className="divide-y divide-[#26313C]/50">
        {(Array.isArray(sessions) ? sessions : []).map((sess) => (
          <div key={sess.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#F5F7FA]">{sess.deviceName}</span>
                <span className="rounded bg-[#18212B] border border-[#26313C] px-2 py-0.5 text-[9px] font-mono text-[#9AA6B2]">
                  IP: {sess.ipAddress || 'Unknown'}
                </span>
              </div>
              <p className="text-[10px] text-[#9AA6B2]">
                Logged in: {new Date(sess.createdAt).toLocaleString()} • Last active: {new Date(sess.lastUsedAt).toLocaleString()}
              </p>
            </div>

            <button
              type="button"
              disabled={actionId !== null}
              onClick={() => void handleRevoke(sess.id)}
              className="rounded-xl border border-[#26313C] bg-[#18212B] hover:border-red-500 hover:text-red-500 px-3 py-1.5 text-xs font-semibold text-[#9AA6B2] transition-colors disabled:opacity-50"
            >
              {actionId === sess.id ? 'Revoking...' : 'Revoke'}
            </button>
          </div>
        ))}

        {(!Array.isArray(sessions) || sessions.length === 0) && (
          <div className="py-8 text-center text-xs text-[#9AA6B2]">
            No active sessions registered.
          </div>
        )}
      </div>
    </div>
  );
}
