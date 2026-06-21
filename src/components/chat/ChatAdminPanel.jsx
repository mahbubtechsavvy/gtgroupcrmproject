'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, MessageSquare, Users, HardDrive, 
  Megaphone, Send, AlertTriangle, ChevronDown, X, Loader2, Download
} from 'lucide-react';

// Simple sparkline bar chart component
function MiniBarChart({ data }) {
  if (!data || data.length === 0) return <div className="h-16 flex items-end text-[10px] text-text-dim">No activity data</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-16 mt-2">
      {data.slice(-30).map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full bg-gold/40 hover:bg-gold/70 transition-colors rounded-t"
            style={{ height: `${Math.max(4, (d.count / max) * 56)}px` }}
            title={`${d.date}: ${d.count} messages`}
          />
        </div>
      ))}
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChatAdminPanel({ user }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('analytics'); // 'analytics' | 'announce' | 'export'

  // Announcement state
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const isAdmin = ['ceo', 'coo', 'it_manager'].includes(user?.role);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAnalytics();
  }, [isAdmin]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!announcementTitle || !announcementMessage) return;
    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/chat/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: announcementTitle, message: announcementMessage, priority })
      });
      const data = await res.json();
      if (res.ok) {
        setSendResult({ ok: true, count: data.count });
        setAnnouncementTitle('');
        setAnnouncementMessage('');
        setPriority('normal');
      } else {
        setSendResult({ ok: false, error: data.error });
      }
    } catch (err) {
      setSendResult({ ok: false, error: 'Network error' });
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-sm text-text-dim">
        Admin access required.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab Bar */}
      <div className="flex border-b border-border">
        <button
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 flex items-center justify-center gap-2 ${tab === 'analytics' ? 'border-gold text-gold' : 'border-transparent text-text-dim hover:text-text'}`}
          onClick={() => setTab('analytics')}
        >
          <BarChart3 size={12} /> Analytics
        </button>
        <button
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 flex items-center justify-center gap-2 ${tab === 'announce' ? 'border-gold text-gold' : 'border-transparent text-text-dim hover:text-text'}`}
          onClick={() => setTab('announce')}
        >
          <Megaphone size={12} /> Broadcast
        </button>
        <button
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 flex items-center justify-center gap-2 ${tab === 'export' ? 'border-gold text-gold' : 'border-transparent text-text-dim hover:text-text'}`}
          onClick={() => setTab('export')}
        >
          <Download size={12} /> Export
        </button>
      </div>

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 size={24} className="mx-auto animate-spin text-gold mb-3" />
              <p className="text-xs text-text-dim">Loading analytics...</p>
            </div>
          ) : analytics ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: MessageSquare, label: 'Messages (30d)', value: analytics.summary.totalMessages30d?.toLocaleString(), color: 'text-gold' },
                  { icon: Users, label: 'Total Users', value: analytics.summary.totalUsers?.toLocaleString(), color: 'text-blue-400' },
                  { icon: BarChart3, label: 'Groups', value: analytics.summary.totalGroups?.toLocaleString(), color: 'text-purple-400' },
                  { icon: HardDrive, label: 'Storage Used', value: formatBytes(analytics.summary.storageUsedBytes), color: 'text-green-400' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="p-3 rounded-2xl bg-surface-2 border border-border">
                    <Icon size={14} className={`${color} mb-1`} />
                    <div className={`text-base font-bold ${color}`}>{value}</div>
                    <div className="text-[9px] text-text-dim uppercase tracking-widest">{label}</div>
                  </div>
                ))}
              </div>

              {/* Daily Activity Chart */}
              <div className="p-3 rounded-2xl bg-surface-2 border border-border">
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-dim mb-1 flex justify-between">
                  <span>Daily Activity (30 days)</span>
                  <span className="text-gold">{analytics.summary.totalMessages30d} msgs</span>
                </div>
                <MiniBarChart data={analytics.dailyActivity} />
              </div>

              <button
                onClick={fetchAnalytics}
                className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-text-dim hover:text-gold transition-colors border border-border hover:border-gold/40 rounded-xl"
              >
                Refresh
              </button>
            </>
          ) : (
            <div className="text-center text-sm text-text-dim py-8">Failed to load analytics.</div>
          )}
        </div>
      )}

      {/* Broadcast Tab */}
      {tab === 'announce' && (
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleBroadcast} className="space-y-3">
            <div className="p-3 rounded-xl bg-gold/5 border border-gold/20 flex items-start gap-2">
              <AlertTriangle size={14} className="text-gold shrink-0 mt-0.5" />
              <p className="text-[10px] text-gold/80">This will send a notification to ALL active CRM users. Use responsibly.</p>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-text-dim mb-1">Title</label>
              <input
                type="text"
                value={announcementTitle}
                onChange={e => setAnnouncementTitle(e.target.value)}
                placeholder="Important announcement..."
                maxLength={100}
                required
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text placeholder-text-dim/50 outline-none focus:border-gold/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-text-dim mb-1">Message</label>
              <textarea
                value={announcementMessage}
                onChange={e => setAnnouncementMessage(e.target.value)}
                placeholder="Enter full announcement text..."
                rows={4}
                maxLength={1000}
                required
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text placeholder-text-dim/50 outline-none focus:border-gold/50 transition-colors resize-none"
              />
              <div className="text-right text-[9px] text-text-dim mt-0.5">{announcementMessage.length}/1000</div>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-text-dim mb-1">Priority</label>
              <div className="flex gap-2">
                {[
                  { value: 'normal', label: 'Normal', color: 'text-text-dim border-border' },
                  { value: 'high', label: 'High', color: 'text-amber-400 border-amber-400/40' },
                  { value: 'urgent', label: 'Urgent', color: 'text-red-400 border-red-400/40' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-lg transition-all ${priority === opt.value ? `${opt.color} bg-surface-3` : 'border-border text-text-dim hover:bg-surface-2'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {sendResult && (
              <div className={`p-3 rounded-xl text-xs border ${sendResult.ok ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {sendResult.ok ? `✓ Broadcast sent to ${sendResult.count} users` : `Error: ${sendResult.error}`}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !announcementTitle || !announcementMessage}
              className="w-full py-2.5 bg-gold hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? 'Sending...' : 'Broadcast to All Users'}
            </button>
          </form>
        </div>
      )}

      {/* Export Tab */}
      {tab === 'export' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-3 rounded-xl bg-surface-2 border border-border">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-3">Moderation Exports</h4>
            <p className="text-[11px] text-text-dim mb-4 leading-relaxed">
              Export recent message history for compliance, moderation, or backup purposes.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.open('/api/chat/analytics/export?type=group&limit=5000', '_blank')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-3 hover:bg-gold/10 border border-border hover:border-gold/30 transition-all group"
              >
                <div className="text-left">
                  <div className="text-xs font-bold text-text group-hover:text-gold transition-colors">Group Messages</div>
                  <div className="text-[10px] text-text-dim">Last 5,000 messages across all groups</div>
                </div>
                <Download size={14} className="text-text-dim group-hover:text-gold" />
              </button>

              <button
                onClick={() => window.open('/api/chat/analytics/export?type=dm&limit=5000', '_blank')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-3 hover:bg-gold/10 border border-border hover:border-gold/30 transition-all group"
              >
                <div className="text-left">
                  <div className="text-xs font-bold text-text group-hover:text-gold transition-colors">Direct Messages</div>
                  <div className="text-[10px] text-text-dim">Last 5,000 DM exchanges</div>
                </div>
                <Download size={14} className="text-text-dim group-hover:text-gold" />
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-2">
            <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-rose-500/80 uppercase leading-tight font-bold tracking-wider">
              Warning: Exported files contain unencrypted message history. Handle according to company data privacy policies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
