'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  Plus, Search, Filter, Calendar, DollarSign, 
  Code2, Rocket, Clock, CheckCircle2, 
  MoreHorizontal, Edit, Trash2, Cpu, 
  Github, Layout, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PROJECT_TYPES = [
  { value: 'web_dev', label: 'Web Architecture', icon: <Layout size={16} /> },
  { value: 'app_dev', label: 'Mobile Engineering', icon: <Cpu size={16} /> },
  { value: 'ai_automation', label: 'AI & Automation', icon: <Cpu size={16} /> },
  { value: 'seo', label: 'Search Optimization', icon: <Search size={16} /> },
  { value: 'branding', label: 'Digital Branding', icon: <Rocket size={16} /> },
  { value: 'other', label: 'Custom Protocol', icon: <Layers size={16} /> }
];

const STATUS_MAP = {
  planning: { label: 'Strategic Planning', color: 'badge-gold' },
  in_progress: { label: 'Active Development', color: 'badge-blue' },
  testing: { label: 'Quality Assurance', color: 'badge-purple' },
  completed: { label: 'Deployed / Live', color: 'badge-success' },
  on_hold: { label: 'Suspended', color: 'badge-muted' }
};

export default function NexusProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    client_id: '',
    project_name: '',
    project_type: 'web_dev',
    status: 'planning',
    start_date: '',
    target_launch_date: '',
    budget: '',
    currency: 'USD',
    github_repo: '',
    live_url: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = getSupabaseClient();
    try {
      const [pRes, cRes] = await Promise.all([
        supabase.from('nexus_projects').select('*, nexus_clients(company_name)').order('created_at', { ascending: false }),
        supabase.from('nexus_clients').select('id, company_name').eq('status', 'active')
      ]);

      if (pRes.error) throw pRes.error;
      if (cRes.error) throw cRes.error;

      setProjects(pRes.data || []);
      setClients(cRes.data || []);
    } catch (error) {
      toast.error('Error connecting to project infrastructure');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    try {
      const payload = { ...form, budget: parseFloat(form.budget) || 0 };
      if (editItem) {
        const { error } = await supabase
          .from('nexus_projects')
          .update(payload)
          .eq('id', editItem.id);
        if (error) throw error;
        toast.success('Project parameters updated');
      } else {
        const { error } = await supabase
          .from('nexus_projects')
          .insert([payload]);
        if (error) throw error;
        toast.success('New project initialized');
      }
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error('Sync failed: ' + error.message);
    }
  };

  const filtered = projects.filter(p => 
    p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nexus_clients?.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-content space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Rocket className="text-gold" />
            Nexus Project Console
          </h1>
          <p className="page-subtitle">Mission control for enterprise digital solutions and engineering projects</p>
        </div>
        <button 
          onClick={() => { setForm({ client_id: '', project_name: '', project_type: 'web_dev', status: 'planning', start_date: '', target_launch_date: '', budget: '', currency: 'USD', github_repo: '', live_url: '', description: '' }); setEditItem(null); setShowForm(true); }}
          className="btn btn-primary btn-lg shadow-gold"
        >
          <Plus size={20} /> Initialize Project
        </button>
      </div>

      {/* KPI Stats */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><Rocket size={24} /></div>
          <div className="kpi-value">{projects.length}</div>
          <div className="kpi-label">Active Missions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><DollarSign size={24} /></div>
          <div className="kpi-value">{projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0).toLocaleString()}</div>
          <div className="kpi-label">Pipeline Value (USD)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><Clock size={24} /></div>
          <div className="kpi-value">{projects.filter(p => p.status === 'in_progress').length}</div>
          <div className="kpi-label">Under Development</div>
        </div>
      </div>

      {/* Table Section */}
      <div className="card glass overflow-hidden border-border">
        <div className="p-4 border-b border-border flex justify-between items-center gap-4 flex-wrap">
          <div className="search-input-wrapper max-w-md">
            <Search size={18} className="text-gold" />
            <input 
              type="text" 
              placeholder="Search by project or client name..." 
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm"><Filter size={14} /> Filter</button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project Intel</th>
                <th>Client Partner</th>
                <th>Execution Status</th>
                <th>Timeline</th>
                <th>Financials</th>
                <th className="text-right">Operations</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => <tr key={i}><td colSpan={6} className="py-8"><div className="h-10 skeleton w-full"></div></td></tr>)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-text-muted">No active missions detected.</td></tr>
              ) : (
                filtered.map(project => (
                  <tr key={project.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-gold border border-border group-hover:bg-gold group-hover:text-navy transition-all">
                          {PROJECT_TYPES.find(t => t.value === project.project_type)?.icon || <Code2 size={20} />}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-gold transition-colors">{project.project_name}</div>
                          <div className="text-[10px] text-text-dim uppercase tracking-widest mt-1">
                            {PROJECT_TYPES.find(t => t.value === project.project_type)?.label || 'Other'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-text">{project.nexus_clients?.company_name}</div>
                      <div className="text-xs text-text-muted mt-1 italic">Enterprise B2B</div>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_MAP[project.status]?.color || 'badge-muted'}`}>
                        {STATUS_MAP[project.status]?.label || project.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <div className="text-xs flex items-center gap-2"><Clock size={12} className="text-gold" /> {project.start_date || 'TBD'}</div>
                        <div className="text-[10px] text-text-muted uppercase tracking-tighter">Deadline: {project.target_launch_date || 'Flexible'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="font-mono text-emerald-500 font-bold">{project.currency} {Number(project.budget).toLocaleString()}</div>
                    </td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button onClick={() => { setEditItem(project); setForm(project); setShowForm(true); }} className="btn btn-secondary btn-sm"><Edit size={14} /></button>
                        {project.github_repo && <a href={project.github_repo} target="_blank" className="btn btn-secondary btn-sm"><Github size={14} /></a>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-xl">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editItem ? 'Reconfigure Project Parameters' : 'Initialize Engineering Mission'}</h2>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest">Enterprise Digital Architecture</p>
              </div>
              <button onClick={() => setShowForm(false)} className="modal-close"><Plus className="rotate-45" size={28} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Core Identity */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">Client Partner</label>
                      <select required value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="form-select">
                        <option value="">Select Enterprise Client...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Project Name</label>
                      <input required value={form.project_name} onChange={e => setForm({...form, project_name: e.target.value})} className="form-input" placeholder="e.g. AI-Powered Dashboard" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">Technology Vertical</label>
                      <select value={form.project_type} onChange={e => setForm({...form, project_type: e.target.value})} className="form-select">
                        {PROJECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Initial Status</label>
                      <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="form-select">
                        {Object.entries(STATUS_MAP).map(([val, info]) => <option key={val} value={val}>{info.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Project Documentation / Scope</label>
                    <textarea rows={6} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="form-textarea" placeholder="Detailed engineering requirements..." />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">GitHub Repository URL</label>
                      <input value={form.github_repo} onChange={e => setForm({...form, github_repo: e.target.value})} className="form-input" placeholder="https://github.com/..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Production / Live URL</label>
                      <input value={form.live_url} onChange={e => setForm({...form, live_url: e.target.value})} className="form-input" placeholder="https://..." />
                    </div>
                  </div>
                </div>

                {/* Right Column: Timelines & Budget */}
                <div className="space-y-6">
                  <div className="card glass p-6 space-y-6">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em] flex items-center gap-2">
                      <Calendar size={14} /> Schedule & Value
                    </h3>
                    
                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="form-input" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Target Launch</label>
                      <input type="date" value={form.target_launch_date} onChange={e => setForm({...form, target_launch_date: e.target.value})} className="form-input" />
                    </div>

                    <div className="divider opacity-10"></div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="form-label">Currency</label>
                        <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="form-select">
                          <option value="USD">USD</option>
                          <option value="KRW">KRW</option>
                          <option value="BDT">BDT</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Total Budget</label>
                        <input type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className="form-input" placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSave} className="btn btn-primary btn-lg shadow-gold min-w-[200px]">Deploy Infrastructure</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
