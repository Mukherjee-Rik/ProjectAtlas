'use client';

import React, { useState } from 'react';
import { X, Clock, Calendar, Mail, Check } from 'lucide-react';
import { reportsService } from '@/services/reports.service';

interface ReportScheduleModalProps {
  reportId: string;
  reportName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReportScheduleModal({
  reportId,
  reportName,
  isOpen,
  onClose,
  onSuccess,
}: ReportScheduleModalProps) {
  const [scheduleName, setScheduleName] = useState(`${reportName} Schedule`);
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [recipients, setRecipients] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailList = recipients
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    try {
      await reportsService.createSchedule(reportId, {
        name: scheduleName,
        frequency,
        timeOfDay,
        dayOfWeek: frequency === 'WEEKLY' ? Number(dayOfWeek) : undefined,
        dayOfMonth: frequency === 'MONTHLY' ? Number(dayOfMonth) : undefined,
        recipients: emailList.length > 0 ? emailList : ['owner@atlas.internal'],
        deliveryFormat: 'CSV',
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create automated report schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-base text-foreground">Schedule Automated Report</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">Schedule Name</label>
            <input
              type="text"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFrequency(freq)}
                  className={`py-2 rounded-lg border font-semibold transition-all ${
                    frequency === freq
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Time of Day</label>
              <input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              />
            </div>

            {frequency === 'WEEKLY' && (
              <div>
                <label className="block font-semibold text-foreground mb-1">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={0}>Sunday</option>
                </select>
              </div>
            )}

            {frequency === 'MONTHLY' && (
              <div>
                <label className="block font-semibold text-foreground mb-1">Day of Month</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">
              Recipient Email Addresses (comma separated)
            </label>
            <input
              type="text"
              placeholder="manager@restaurant.com, owner@restaurant.com"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Creating...' : 'Activate Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
