'use client';

import React, { useState, useEffect } from 'react';

interface AdminSupportTicket {
  id: string;
  ticketNumber: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  contactEmail?: string;
  contactPhone?: string;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
  restaurant?: {
    id: string;
    name: string;
    slug: string;
  };
}

export function PlatformSupportDashboard() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED' | 'IN_PROGRESS' | 'CLOSED'>('RESOLVED');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminTickets = async () => {
    try {
      setLoading(true);
      const url = filterStatus !== 'ALL'
        ? `/api/proxy/support/admin/tickets?status=${filterStatus}`
        : '/api/proxy/support/admin/tickets';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTickets(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminTickets();
  }, [filterStatus]);

  const handleResolve = async (ticketId: string) => {
    if (!resolutionText) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/proxy/support/tickets/${ticketId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: resolutionStatus,
          resolutionNotes: resolutionText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResolvingId(null);
        setResolutionText('');
        fetchAdminTickets();
      }
    } catch (err) {
      console.error('Resolution error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = tickets.filter(
    (t) =>
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.restaurant?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterStatus === st
                  ? 'bg-primary text-background border-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket or restaurant..."
            className="w-full sm:w-64 px-3 py-1.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={fetchAdminTickets}
            className="px-3 py-1.5 rounded-xl bg-secondary border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            ⟳
          </button>
        </div>
      </div>

      {/* Tickets Feed */}
      {loading ? (
        <div className="p-8 text-center text-muted-foreground text-xs">Loading customer incident queue...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl text-center py-12 px-4 space-y-2">
          <div className="text-3xl mb-1">🛟</div>
          <p className="text-xs text-muted-foreground">No incidents matching the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <div key={ticket.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-background border border-border text-primary font-bold">
                    {ticket.ticketNumber}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    🏢 {ticket.restaurant?.name || 'Unknown Restaurant'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                    {ticket.priority}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                    {ticket.status}
                  </span>
                  {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                    <button
                      type="button"
                      onClick={() => {
                        setResolvingId(ticket.id);
                        setResolutionText('');
                      }}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-primary hover:bg-primary text-foreground"
                    >
                      Respond & Resolve
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-foreground">{ticket.subject}</h4>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {ticket.resolutionNotes && (
                <div className="p-3 bg-primary/20 border border-primary/20 rounded-xl text-xs text-primary">
                  <span className="font-bold text-primary">Resolution Note: </span>
                  {ticket.resolutionNotes}
                </div>
              )}

              {/* Inline Resolver Form */}
              {resolvingId === ticket.id && (
                <div className="p-4 bg-background border border-primary/30 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-primary">
                    <span>Engineer Incident Response</span>
                    <select
                      value={resolutionStatus}
                      onChange={(e: any) => setResolutionStatus(e.target.value)}
                      className="bg-secondary border border-border text-foreground text-xs rounded-lg px-2 py-1"
                    >
                      <option value="RESOLVED">Mark RESOLVED</option>
                      <option value="IN_PROGRESS">Mark IN_PROGRESS</option>
                      <option value="CLOSED">Mark CLOSED</option>
                    </select>
                  </div>

                  <textarea
                    rows={2}
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Enter operational fix notes, customer response, or resolution details..."
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs focus:border-primary focus:outline-none"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setResolvingId(null)}
                      className="px-3 py-1 text-xs rounded-xl bg-secondary border border-border text-muted-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading || !resolutionText}
                      onClick={() => handleResolve(ticket.id)}
                      className="px-4 py-1 text-xs rounded-xl bg-primary text-background font-bold hover:bg-primary"
                    >
                      Send Resolution
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
