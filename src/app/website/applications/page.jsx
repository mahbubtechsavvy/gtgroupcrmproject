'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
const supabase = getSupabaseClient();
import { 
  Inbox, Search, Filter, 
  ExternalLink, UserCheck, 
  MoreVertical, Clock, CheckCircle, 
  XCircle, ArrowRight 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ApplicationsInbox() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('web_applications')
        .select(`
          *,
          web_destinations(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      toast.error('Failed to load applications');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('web_applications')
        .update({ status: newStatus, updated_at: new Date() })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Status updated to ${newStatus}`);
      fetchApplications();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const filtered = applications.filter(app => {
    const matchesSearch = app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.tracking_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-content space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Inbox className="text-gold" />
            Admissions Intel
          </h1>
          <p className="page-subtitle">Real-time tracking and processing of student applications from the global digital portal</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="search-input-wrapper min-w-[300px]">
            <Search size={18} className="text-gold" />
            <input 
              type="text" 
              placeholder="Filter by name or tracking ID..." 
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="search-input-wrapper">
            <Filter size={18} className="text-gold" />
            <select 
              className="form-select bg-transparent border-none focus:ring-0 text-white font-bold"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Global Pipeline</option>
              <option value="submitted">Initial Submissions</option>
              <option value="reviewing">Under Evaluation</option>
              <option value="contacted">Engagement Phase</option>
              <option value="admitted">Selection Success</option>
              <option value="rejected">Unsuccessful</option>
            </select>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><Inbox size={24} /></div>
          <div className="kpi-value">{applications.length}</div>
          <div className="kpi-label">Total Submissions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><Clock size={24} /></div>
          <div className="kpi-value">{applications.filter(a => a.status === 'reviewing').length}</div>
          <div className="kpi-label">Active Evaluations</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><CheckCircle size={24} /></div>
          <div className="kpi-value">{Math.round((applications.filter(a => a.status === 'admitted').length / (applications.length || 1)) * 100)}%</div>
          <div className="kpi-label">Acceptance Rate</div>
        </div>
      </div>

      <div className="card glass overflow-hidden border-border">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant Intelligence</th>
                <th>Strategic Interest</th>
                <th>Academic Profile</th>
                <th>Pipeline Status</th>
                <th>Submission Date</th>
                <th className="text-right">Intelligence Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}><td colSpan={6}><div className="h-12 bg-surface-2/50 rounded-xl w-full animate-pulse"></div></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="empty-state">
                      <Inbox size={48} className="text-text-dim opacity-20" />
                      <p className="text-text-muted mt-4">No applications detected in the current filter parameters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(app => (
                  <tr key={app.id} className="group">
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-navy/50 border border-border flex items-center justify-center text-gold font-bold">
                          {app.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-gold transition-colors">{app.full_name}</div>
                          <div className="text-[10px] text-gold font-mono uppercase tracking-widest mt-1 italic">{app.tracking_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-xs font-bold text-text-dim uppercase tracking-widest">
                        <ArrowRight size={12} className="text-gold" />
                        {app.web_destinations?.name || 'Global'}
                      </div>
                      <div className="text-[10px] text-text-muted mt-1 font-semibold">{app.program_interest}</div>
                    </td>
                    <td>
                      <div className="text-xs font-bold text-white uppercase tracking-tight">{app.highest_degree}</div>
                      <div className="text-[10px] text-emerald-500 font-mono mt-1 font-black">QUALIFIED: {app.gpa || 'N/A'}</div>
                    </td>
                    <td>
                      <span className={`badge ${
                        app.status === 'submitted' ? 'badge-gold' :
                        app.status === 'reviewing' ? 'badge-primary' :
                        app.status === 'contacted' ? 'badge-blue' :
                        app.status === 'admitted' ? 'badge-success' :
                        'badge-muted'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <div className="text-[10px] font-mono text-text-dim uppercase tracking-widest">
                        {new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={() => updateStatus(app.id, 'reviewing')}
                          className="btn btn-secondary btn-sm"
                          title="Begin Evaluation"
                        >
                          <Clock size={14} />
                        </button>
                        <button 
                          className="btn btn-primary btn-sm shadow-gold"
                          title="Execute Enrollment"
                        >
                          <UserCheck size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
