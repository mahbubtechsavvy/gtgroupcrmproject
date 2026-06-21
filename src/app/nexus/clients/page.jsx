'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  Plus, Search, Filter, Mail, Phone, Globe, 
  MapPin, Briefcase, MoreHorizontal, Edit, 
  Trash2, Building2, ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function NexusClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    industry: 'Technology',
    address: '',
    status: 'active'
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const supabase = getSupabaseClient();
    try {
      const { data, error } = await supabase
        .from('nexus_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      toast.error('Error scanning client infrastructure');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    try {
      if (editItem) {
        const { error } = await supabase
          .from('nexus_clients')
          .update(form)
          .eq('id', editItem.id);
        if (error) throw error;
        toast.success('Client profile updated');
      } else {
        const { error } = await supabase
          .from('nexus_clients')
          .insert([form]);
        if (error) throw error;
        toast.success('New client onboarded');
      }
      setShowForm(false);
      fetchClients();
    } catch (error) {
      toast.error('Sync failed: ' + error.message);
    }
  };

  const filtered = clients.filter(c => 
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-content space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Building2 className="text-gold" />
            Nexus B2B Client Directory
          </h1>
          <p className="page-subtitle">Strategic management of corporate partners and enterprise clients</p>
        </div>
        <button 
          onClick={() => { setForm({ company_name: '', contact_person: '', email: '', phone: '', website: '', industry: 'Technology', address: '', status: 'active' }); setEditItem(null); setShowForm(true); }}
          className="btn btn-primary btn-lg shadow-gold"
        >
          <Plus size={20} /> Register New Client
        </button>
      </div>

      {/* KPI Stats */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><Building2 size={24} /></div>
          <div className="kpi-value">{clients.length}</div>
          <div className="kpi-label">Enterprise Clients</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><Briefcase size={24} /></div>
          <div className="kpi-value">{[...new Set(clients.map(c => c.industry))].length}</div>
          <div className="kpi-label">Market Sectors</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><Globe size={24} /></div>
          <div className="kpi-value">{clients.filter(c => c.status === 'active').length}</div>
          <div className="kpi-label">Active Partnerships</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card glass p-4 flex items-center gap-4">
        <div className="search-input-wrapper flex-1">
          <Search size={18} className="text-gold" />
          <input 
            type="text" 
            placeholder="Search by company or primary contact..." 
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1,2,3,4,5,6].map(i => <div key={i} className="h-[280px] card skeleton"></div>)
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center card glass">
            <Building2 size={48} className="mx-auto text-text-dim opacity-20 mb-4" />
            <h3 className="text-xl font-bold">No Enterprise Clients Detected</h3>
            <p className="text-text-muted">Initialize your first corporate partnership above.</p>
          </div>
        ) : (
          filtered.map(client => (
            <div key={client.id} className="card group hover:border-gold/30 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => { setEditItem(client); setForm(client); setShowForm(true); }} className="btn btn-secondary btn-icon"><Edit size={14} /></button>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-navy transition-all duration-500">
                  <Building2 size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate group-hover:text-gold transition-colors">{client.company_name}</h3>
                  <div className="badge badge-gold mt-1">{client.industry}</div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center"><Briefcase size={14} /></div>
                  <span className="font-semibold text-text">{client.contact_person}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center"><Mail size={14} /></div>
                  <span className="truncate">{client.email}</span>
                </div>
                {client.website && (
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center"><Globe size={14} /></div>
                    <a href={client.website} target="_blank" className="text-blue-400 hover:underline flex items-center gap-1">
                      Visit Website <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-border flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] font-mono text-text-dim uppercase tracking-widest">
                  <MapPin size={12} /> {client.address?.split(',')[0] || 'Global'}
                </div>
                <span className={`badge ${client.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                  {client.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editItem ? 'Configure Client Infrastructure' : 'Initialize Enterprise Client'}</h2>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest">Strategic Partner Onboarding</p>
              </div>
              <button onClick={() => setShowForm(false)} className="modal-close"><Plus className="rotate-45" size={28} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-body space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input required value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="form-input" placeholder="e.g. Acme Innovations" />
                </div>
                <div className="form-group">
                  <label className="form-label">Primary Industry</label>
                  <input value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="form-input" placeholder="e.g. Fintech, Healthcare" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Key Contact Person</label>
                  <input required value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} className="form-input" placeholder="Decision maker's name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="form-input" placeholder="official@company.com" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="form-input" placeholder="+1..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Corporate Website</label>
                  <input value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="form-input" placeholder="https://..." />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Business Address</label>
                <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="form-textarea" placeholder="Headquarters location..." />
              </div>

              <div className="form-group">
                <label className="form-label">Partnership Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="form-select">
                  <option value="active">Active Strategic Partner</option>
                  <option value="inactive">Inactive / On Hold</option>
                  <option value="churned">Churned / Terminated</option>
                </select>
              </div>
            </form>
            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSave} className="btn btn-primary btn-lg shadow-gold min-w-[200px]">Save Configuration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
