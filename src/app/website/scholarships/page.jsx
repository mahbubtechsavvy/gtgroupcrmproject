'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  Plus, Edit, Trash2, GraduationCap, Search, 
  MapPin, Calendar, DollarSign, School, CheckCircle2,
  Zap, Sparkles
} from 'lucide-react';
import SlugGenerator from '@/components/website/SlugGenerator';
import PublishToggle from '@/components/website/PublishToggle';

const INITIAL_FORM = {
  title: '',
  slug: '',
  university_id: '',
  destination_id: '',
  amount_min: '',
  amount_max: '',
  currency: 'USD',
  deadline: '',
  eligibility: '',
  description: '',
  apply_url: '',
  is_published: false,
  is_featured: false
};

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [websiteType, setWebsiteType] = useState('study-abroad');
  const [form, setForm] = useState({ ...INITIAL_FORM, website_type: 'study-abroad' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'study-abroad';
    setWebsiteType(type);
    setForm(prev => ({ ...prev, website_type: type }));
  }, []);

  useEffect(() => {
    if (websiteType) fetchData();
  }, [websiteType]);

  const fetchData = async () => {
    const supabase = getSupabaseClient();
    try {
      const [schRes, uniRes, destRes] = await Promise.all([
        supabase.from('web_scholarships').select('*, web_universities(name), web_destinations(name)').eq('website_type', websiteType).order('created_at', { ascending: false }),
        supabase.from('web_universities').select('id, name').eq('website_type', websiteType).order('name', { ascending: true }),
        supabase.from('web_destinations').select('id, name').eq('website_type', websiteType).order('name', { ascending: true })
      ]);
      setScholarships(schRes.data || []);
      setUniversities(uniRes.data || []);
      setDestinations(destRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    const payload = {
      ...form,
      amount_min: form.amount_min ? Number(form.amount_min) : null,
      amount_max: form.amount_max ? Number(form.amount_max) : null,
      university_id: form.university_id || null,
      destination_id: form.destination_id || null,
      updated_at: new Date().toISOString()
    };

    try {
      if (editItem) {
        await supabase.from('web_scholarships').update(payload).eq('id', editItem.id);
      } else {
        await supabase.from('web_scholarships').insert([payload]);
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete scholarship?')) return;
    await getSupabaseClient().from('web_scholarships').delete().eq('id', id);
    fetchData();
  };

  const filteredSchols = scholarships.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="page-content space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <GraduationCap className="text-gold" />
            Grants & Scholarships
          </h1>
          <p className="page-subtitle">Curate and manage elite funding opportunities to attract top-tier global talent</p>
        </div>
        <button 
          onClick={() => { setForm({ ...INITIAL_FORM, website_type: websiteType }); setEditItem(null); setShowForm(true); }}
          className="btn btn-primary btn-lg shadow-gold"
        >
          <Plus size={20} /> New Grant Opportunity
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><DollarSign size={24} /></div>
          <div className="kpi-value">{scholarships.length}</div>
          <div className="kpi-label">Active Grants</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><School size={24} /></div>
          <div className="kpi-value">{[...new Set(scholarships.map(s => s.university_id))].filter(Boolean).length}</div>
          <div className="kpi-label">Partner Institutions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><Zap size={24} /></div>
          <div className="kpi-value">{scholarships.filter(s => s.is_featured).length}</div>
          <div className="kpi-label">Featured Highlights</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="search-filter-bar card glass p-4">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text"
            placeholder="Search by scholarship title, university or criteria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredSchols.map(s => (
          <div key={s.id} className="card glass p-6 group hover:border-gold/50 transition-all duration-500">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-5">
                <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center text-gold border border-gold/20 shadow-inner group-hover:bg-gold group-hover:text-navy transition-all duration-500">
                  <GraduationCap size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-gold transition-colors">{s.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-text-dim mt-2 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><MapPin size={12} className="text-gold" /> {s.web_destinations?.name || 'Global'}</span>
                    {s.web_universities && <span className="flex items-center gap-1.5"><School size={12} className="text-blue-500" /> {s.web_universities.name}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditItem(s); setForm(s); setShowForm(true); }} className="btn btn-secondary btn-sm"><Edit size={14} /></button>
                <button onClick={() => handleDelete(s.id)} className="btn btn-danger btn-sm"><Trash2 size={14} /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border">
              <div>
                <p className="text-[10px] text-gold uppercase font-bold tracking-[0.2em] mb-2">Benefit Value</p>
                <p className="text-sm font-black text-white">{s.amount_min ? `${s.currency} ${s.amount_min.toLocaleString()}` : 'Variable Funding'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gold uppercase font-bold tracking-[0.2em] mb-2">Application Cut-off</p>
                <p className="text-sm font-bold text-text-dim">{s.deadline ? new Date(s.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Ongoing Cycle'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gold uppercase font-bold tracking-[0.2em] mb-2">Live Status</p>
                <span className={`badge ${s.is_published ? 'badge-success' : 'badge-muted'}`}>
                  {s.is_published ? 'Published' : 'Draft Mode'}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredSchols.length === 0 && (
          <div className="col-span-full empty-state">
            <GraduationCap size={48} className="text-text-dim" />
            <h3>No Scholarship Opportunities</h3>
            <p>Your institutional database is empty. Add new funding programs to assist students.</p>
          </div>
        )}
      </div>

      {/* Premium Scholarship Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-xl">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editItem ? 'Refine Grant Protocol' : 'New Funding Opportunity'}</h2>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest">Financial Aid & Institutional Support Console</p>
              </div>
              <button onClick={() => setShowForm(false)} className="modal-close">
                <Plus className="rotate-45" size={28} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-body space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar pr-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Primary Data */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="form-group">
                    <label className="form-label">Scholarship Title</label>
                    <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="form-input text-lg font-bold" placeholder="e.g. Commonwealth Master's Scholarship" />
                  </div>
                  
                  <SlugGenerator title={form.title} value={form.slug} onChange={slug => setForm({...form, slug})} prefix="scholarships/" />

                  <div className="grid grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">Destination Country</label>
                      <select value={form.destination_id} onChange={e => setForm({...form, destination_id: e.target.value})} className="form-select">
                        <option value="">Global / Any Country</option>
                        {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Host University</label>
                      <select value={form.university_id} onChange={e => setForm({...form, university_id: e.target.value})} className="form-select">
                        <option value="">Multi-Institutional / Independent</option>
                        {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Eligibility Criteria</label>
                    <textarea rows={4} value={form.eligibility} onChange={e => setForm({...form, eligibility: e.target.value})} className="form-textarea" placeholder="Outline GPA, language requirements, and nationality restrictions..." />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Program Description & Benefits</label>
                    <textarea rows={8} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="form-textarea" placeholder="Detail the coverage (tuition, living, airfare) and application process..." />
                  </div>
                </div>

                {/* Configuration Panel */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="card glass p-6 space-y-6">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Financial Architecture</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="form-label">Currency</label>
                        <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="form-select">
                          <option value="USD">USD ($)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="AUD">AUD (A$)</option>
                          <option value="CAD">CAD (C$)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Base Value</label>
                        <input type="number" value={form.amount_min} onChange={e => setForm({...form, amount_min: e.target.value})} className="form-input" placeholder="0.00" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Application Deadline</label>
                      <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="form-input" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Portal / Application Link</label>
                      <input type="url" value={form.apply_url} onChange={e => setForm({...form, apply_url: e.target.value})} className="form-input" placeholder="https://university.edu/apply" />
                    </div>

                    <div className="divider" />
                    
                    <div className="space-y-4">
                      <PublishToggle isPublished={form.is_published} onChange={val => setForm({...form, is_published: val})} />
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-text-muted">Feature on Homepage</label>
                        <input type="checkbox" className="w-5 h-5 accent-gold" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-gold/5 border border-gold/10">
                    <div className="flex gap-4 items-start">
                      <Sparkles className="text-gold shrink-0" size={20} />
                      <p className="text-[11px] text-text-muted leading-relaxed italic">
                        Elite funding opportunities are highlighted across the global student network, increasing institutional visibility by up to 40%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-lg">Discard Draft</button>
              <button onClick={handleSave} className="btn btn-primary btn-lg shadow-gold min-w-[200px]">
                {editItem ? 'Confirm Refinement' : 'Release Opportunity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
