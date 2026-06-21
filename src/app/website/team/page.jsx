'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
const supabase = getSupabaseClient();
import { 
  Users, Plus, Edit, 
  Trash2, Mail, Linkedin, 
  MapPin, Loader2, Image as ImageIcon,
  ChevronRight, ExternalLink, ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TeamManager() {
  const [websiteType, setWebsiteType] = useState('study-abroad');
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    name: '', role: '', office_name: '', email: '', linkedin_url: '', image_url: '', order_index: 0
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type) setWebsiteType(type);
    fetchTeam(type || 'study-abroad');
  }, []);

  const fetchTeam = async (type = websiteType) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('website_type', type)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      setTeam(data || []);
    } catch (error) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) throw error;
      toast.success('Member removed');
      fetchTeam();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, website_type: websiteType };
      if (editItem) {
        const { error } = await supabase.from('team_members').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('team_members').insert([payload]);
        if (error) throw error;
      }
      setShowForm(false);
      setEditItem(null);
      fetchTeam();
      toast.success('Member saved');
    } catch (error) {
      toast.error('Save failed');
    }
  };

  return (
    <div className="page-content space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Users className="text-gold" />
            Global Elite Team
          </h1>
          <p className="page-subtitle">Curate the professional profiles of our international education consultants and staff</p>
        </div>
        <button onClick={() => { setEditItem(null); setForm({ name: '', role: '', office_name: '', email: '', linkedin_url: '', image_url: '', order_index: 0 }); setShowForm(true); }} className="btn btn-primary btn-lg shadow-gold">
          <Plus size={20} /> Add Member Profile
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><Users size={24} /></div>
          <div className="kpi-value">{team.length}</div>
          <div className="kpi-label">Active Personnel</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><MapPin size={24} /></div>
          <div className="kpi-value">{[...new Set(team.map(t => t.office_name))].length}</div>
          <div className="kpi-label">Strategic Offices</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><Linkedin size={24} /></div>
          <div className="kpi-value">{team.filter(t => t.linkedin_url).length}</div>
          <div className="kpi-label">LinkedIn Verified</div>
        </div>
      </div>

      {/* Premium Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card h-64 animate-pulse bg-surface-2/50" />
          ))
        ) : team.map((member) => (
          <div key={member.id} className="group relative">
            {/* The Glass Card */}
            <div className="card p-8 h-full bg-surface-1/40 backdrop-blur-xl border border-white/5 hover:border-gold/30 transition-all duration-700 overflow-hidden rounded-[32px] shadow-2xl">
              
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[60px] group-hover:bg-gold/10 transition-all duration-700 rounded-full -mr-16 -mt-16" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden bg-surface-3 border-2 border-gold/20 shadow-2xl group-hover:scale-105 transition-all duration-700">
                      <img 
                        src={member.image_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop'} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-xl bg-emerald-500 border-4 border-[#0F1110] shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => { setEditItem(member); setForm(member); setShowForm(true); }} className="w-10 h-10 rounded-xl bg-surface-3 border border-border flex items-center justify-center text-text-muted hover:text-gold hover:border-gold/30 transition-all">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(member.id)} className="w-10 h-10 rounded-xl bg-surface-3 border border-border flex items-center justify-center text-text-muted hover:text-red-500 hover:border-red-500/30 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">{member.role}</span>
                    <div className="h-px w-8 bg-gold/20" />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-gold transition-colors duration-500">{member.name}</h3>
                  <div className="flex items-center gap-2 text-text-dim text-xs font-bold mt-2 uppercase tracking-widest">
                    <MapPin size={12} className="text-gold" />
                    {member.office_name}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                  <div className="flex gap-3">
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text-dim hover:text-white hover:border-gold/40 transition-all">
                        <Mail size={14} />
                      </a>
                    )}
                    {member.linkedin_url && (
                      <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text-dim hover:text-white hover:border-gold/40 transition-all">
                        <Linkedin size={14} />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-text-dim uppercase tracking-tighter">
                    Rank <span className="text-white ml-1">{member.order_index}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && team.length === 0 && (
        <div className="card border-dashed border-2 border-border p-20 text-center flex flex-col items-center gap-4 bg-transparent">
          <Users size={48} className="text-text-dim/20" />
          <div>
            <h3 className="text-xl font-black text-white">Institutional Roster Empty</h3>
            <p className="text-text-muted text-sm mt-1">Onboard your global staff and consultants to showcase our expertise.</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editItem ? 'Edit Profile' : 'New Member Profile'}</h2>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest">Global Roster Management</p>
              </div>
              <button onClick={() => setShowForm(false)} className="modal-close">
                <Plus className="rotate-45" size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="modal-body space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input required className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Sarah Jenkins" />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation / Role</label>
                  <input required className="form-input" value={form.role} onChange={e => setForm({...form, role: e.target.value})} placeholder="e.g. Senior Admissions Counselor" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Office Location</label>
                  <input className="form-input" value={form.office_name} onChange={e => setForm({...form, office_name: e.target.value})} placeholder="e.g. London Office" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="sarah@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">LinkedIn Profile URL</label>
                  <input type="url" className="form-input" value={form.linkedin_url} onChange={e => setForm({...form, linkedin_url: e.target.value})} placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <input type="number" className="form-input" value={form.order_index} onChange={e => setForm({...form, order_index: e.target.value})} placeholder="0 for highest priority" />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Profile Image URL</label>
                <input type="url" className="form-input" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." />
              </div>
            </form>

            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-lg">Cancel</button>
              <button onClick={handleSave} className="btn btn-primary btn-lg shadow-gold min-w-[180px]">
                {editItem ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
