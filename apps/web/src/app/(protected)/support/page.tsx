'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRestaurant } from '@/hooks/use-restaurant';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export default function SupportPage() {
  const { user } = useAuth();
  const { currentRestaurant } = useRestaurant();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);

  // Form State
  const [form, setForm] = useState({
    category: 'TECHNICAL',
    priority: 'NORMAL',
    subject: '',
    description: '',
    contactEmail: user?.email || '',
    contactPhone: '',
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTickets = async () => {
    if (!currentRestaurant?.id) return;
    try {
      setLoading(true);
      const res = await fetch('/api/proxy/support/tickets', {
        headers: {
          'x-restaurant-id': currentRestaurant.id,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTickets(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [currentRestaurant?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant?.id) return;
    setSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch('/api/proxy/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-restaurant-id': currentRestaurant.id,
        },
        body: JSON.stringify({
          ...form,
          restaurantId: currentRestaurant.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: `Ticket ${data.data.ticketNumber} created successfully! Our engineering team has been notified.`,
        });
        setForm({
          category: 'TECHNICAL',
          priority: 'NORMAL',
          subject: '',
          description: '',
          contactEmail: user?.email || '',
          contactPhone: '',
        });
        setShowNewTicket(false);
        fetchTickets();
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to submit support ticket',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Network error submitting ticket',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ✓ Resolved
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            ⏳ In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            🔔 Open / Under Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            🆘 Atlas Support & Incident Desk
          </h1>
          <p className="text-sm text-[#9AA6B2] mt-1">
            Report issues, request menu assistance, or ask for operational help directly from Atlas engineers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewTicket(!showNewTicket)}
          className="px-4 py-2.5 rounded-xl bg-[#2AFEB7] text-[#0B0F14] text-xs font-black hover:bg-[#20df9f] shadow-lg shadow-[#2AFEB7]/20 transition-all self-start sm:self-auto"
        >
          {showNewTicket ? 'Cancel' : '+ Create Support Ticket'}
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/40 border-red-500/30 text-red-300'
          }`}
        >
          <span>{notification.type === 'success' ? '🛡️' : '⚠️'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* New Ticket Form */}
      {showNewTicket && (
        <div className="bg-[#121922] border border-[#26313C] rounded-2xl p-6 shadow-2xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">New Support Incident</h3>
            <p className="text-xs text-[#9AA6B2] mt-0.5">
              Provide specific details. You will receive an incident reference code for live tracking.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9AA6B2]">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-xs focus:outline-none focus:border-[#2AFEB7]"
                >
                  <option value="TECHNICAL">⚙️ Technical / Bug</option>
                  <option value="BILLING">💳 Billing & Invoicing</option>
                  <option value="HARDWARE">🖨️ POS / Hardware / Printer</option>
                  <option value="MENU_SETUP">🍽️ Menu / Category Setup</option>
                  <option value="FEATURE_REQUEST">💡 Feature Request</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9AA6B2]">Urgency Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-xs focus:outline-none focus:border-[#2AFEB7]"
                >
                  <option value="LOW">Low (Questions / Suggestions)</option>
                  <option value="NORMAL">Normal (Minor issue)</option>
                  <option value="HIGH">High (Impacts order taking)</option>
                  <option value="URGENT">🔥 Urgent (KDS / Payment blocked)</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[#9AA6B2]">Subject Summary</label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief description of the problem"
                  className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-xs focus:outline-none focus:border-[#2AFEB7]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[#9AA6B2]">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What happened? What screen were you on? What did you expect to happen?"
                  className="w-full p-3 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-xs focus:outline-none focus:border-[#2AFEB7]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9AA6B2]">Contact Email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-xs focus:outline-none focus:border-[#2AFEB7]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9AA6B2]">Contact Phone (Optional)</label>
                <input
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full p-2.5 rounded-xl bg-[#0B0F14] border border-[#26313C] text-white text-xs focus:outline-none focus:border-[#2AFEB7]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowNewTicket(false)}
                className="px-4 py-2 rounded-xl border border-[#26313C] bg-[#18212B] text-xs font-semibold text-[#9AA6B2] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-[#2AFEB7] text-[#0B0F14] text-xs font-black hover:bg-[#20df9f]"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Your Support Incident History</h2>

        {loading ? (
          <div className="p-8 text-center text-[#9AA6B2] text-xs">Loading support records...</div>
        ) : tickets.length === 0 ? (
          <div className="bg-[#121922] border border-[#26313C] rounded-2xl text-center py-12 px-4 space-y-2">
            <div className="text-3xl mb-1">🛟</div>
            <h3 className="text-sm font-semibold text-[#F5F7FA]">No Support Tickets Filed</h3>
            <p className="text-xs text-[#9AA6B2] max-w-sm mx-auto">
              Everything is running smoothly! If you ever face an operational issue, file a ticket here for rapid resolution.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-[#121922] border border-[#26313C] rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#26313C] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#0B0F14] border border-[#26313C] text-[#2AFEB7] font-bold">
                      {ticket.ticketNumber}
                    </span>
                    <span className="text-xs text-[#9AA6B2] font-medium">{ticket.category}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#18212B] text-[#9AA6B2]">
                      {ticket.priority} PRIORITY
                    </span>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{ticket.subject}</h3>
                  <p className="text-xs text-[#9AA6B2] mt-1 whitespace-pre-wrap">{ticket.description}</p>
                </div>

                {ticket.resolutionNotes && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                      Engineering Resolution
                    </div>
                    <div className="text-xs text-emerald-300">{ticket.resolutionNotes}</div>
                  </div>
                )}

                <div className="text-[10px] text-[#9AA6B2] flex justify-between pt-1">
                  <span>Filed: {new Date(ticket.createdAt).toLocaleString()}</span>
                  {ticket.resolvedAt && (
                    <span>Resolved: {new Date(ticket.resolvedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
