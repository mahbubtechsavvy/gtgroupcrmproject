'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Mail, Users, Zap, CheckCircle2, Send, FileDown, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [websiteType, setWebsiteType] = useState('study-abroad');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type) setWebsiteType(type);
    fetchSubscribers(type || 'study-abroad');
  }, []);

  const fetchSubscribers = async (type = websiteType) => {
    const supabase = getSupabaseClient();
    try {
      const { data } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('website_type', type)
        .order('created_at', { ascending: false });
      setSubscribers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscriber = async (id) => {
    if (!confirm('Remove subscriber?')) return;
    const supabase = getSupabaseClient();
    await supabase.from('newsletter_subscribers').delete().eq('id', id);
    fetchSubscribers();
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(subscribers.map(s => ({
      'Email': s.email,
      'Subscribed At': new Date(s.subscribed_at).toLocaleString(),
      'Status': s.is_active ? 'Active' : 'Unsubscribed'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Subscribers');
    XLSX.writeFile(wb, `Newsletter_Subscribers_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="page-content space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Mail className="text-gold" />
            Audience & Subscribers
          </h1>
          <p className="page-subtitle">Analyze audience growth and manage your newsletter distribution lists</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="btn btn-secondary btn-lg">
            <FileDown size={20} /> Export Dataset
          </button>
          <button className="btn btn-primary btn-lg shadow-gold">
            <Send size={20} /> Broadcast Newsletter
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><Users size={24} /></div>
          <div className="kpi-value">{subscribers.length}</div>
          <div className="kpi-label">Total Audience</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><Zap size={24} /></div>
          <div className="kpi-value">{subscribers.filter(s => new Date(s.subscribed_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</div>
          <div className="kpi-label">New (30 Days)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><CheckCircle2 size={24} /></div>
          <div className="kpi-value">{subscribers.filter(s => s.is_active).length}</div>
          <div className="kpi-label">Verified Emails</div>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="table-wrapper card p-0 overflow-hidden border-border">
        <table className="data-table">
          <thead>
            <tr>
              <th>Subscriber Identity</th>
              <th>Onboarding Date</th>
              <th>Domain Accuracy</th>
              <th>Engagement Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-gold">
                      <Mail size={18} />
                    </div>
                    <div className="font-bold text-white group-hover:text-gold transition-colors">
                      {s.email}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">
                      {new Date(s.subscribed_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-text-dim mt-1">
                      {new Date(s.subscribed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                    {s.email.split('@')[1]}
                  </span>
                </td>
                <td>
                  <span className="badge badge-success">Subscribed</span>
                </td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => deleteSubscriber(s.id)} 
                      className="btn btn-danger btn-sm"
                      title="Unsubscribe Member"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {subscribers.length === 0 && (
          <div className="empty-state">
            <Mail size={48} className="text-text-dim" />
            <h3>No Audience Members</h3>
            <p>Once students subscribe to your newsletter, they will appear here for management.</p>
          </div>
        )}
      </div>
    </div>
  );
}
