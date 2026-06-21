'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  Plus, Edit, Trash2, Settings, Search, 
  Layers, Zap, CheckCircle2, Layout, Monitor
} from 'lucide-react';
import SlugGenerator from '@/components/website/SlugGenerator';
import PublishToggle from '@/components/website/PublishToggle';

const INITIAL_FORM = {
  name: '',
  slug: '',
  icon_name: 'Settings',
  short_description: '',
  description_html: '',
  category: 'Software Development',
  price_info: '',
  is_published: true,
  sort_order: 0,
  website_type: 'nexus'
};

const CATEGORIES = [
  'Software Development',
  'AI & Automation',
  'Digital Branding',
  'Cloud Solutions',
  'Cyber Security',
  'E-Commerce'
];

export default function NexusServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const supabase = getSupabaseClient();
    try {
      const { data } = await supabase
        .from('web_nexus_services')
        .select('*')
        .order('sort_order', { ascending: true });
      setServices(data || []);
    } catch (err) {
      console.error(err);
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
          .from('web_nexus_services')
          .update({ ...form, updated_at: new Date() })
          .eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('web_nexus_services')
          .insert([form]);
        if (error) throw error;
      }
      setShowForm(false);
      fetchServices();
    } catch (err) {
      alert('Database error: Make sure web_nexus_services table exists. Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this service?')) return;
    const supabase = getSupabaseClient();
    await supabase.from('web_nexus_services').delete().eq('id', id);
    fetchServices();
  };

  const filtered = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center animate-pulse text-gold uppercase tracking-[0.3em] font-bold">Scanning Nexus Infrastructure...</div>;

  return (
    <div className="page-content space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Layers className="text-gold" />
            Nexus Service Architecture
          </h1>
          <p className="page-subtitle">Design and deploy high-performance digital services for B2B enterprise clients</p>
        </div>
        <button 
          onClick={() => { setForm(INITIAL_FORM); setEditItem(null); setShowForm(true); }}
          className="btn btn-primary btn-lg shadow-gold"
        >
          <Plus size={20} /> Deploy New Service
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><Settings size={24} /></div>
          <div className="kpi-value">{services.length}</div>
          <div className="kpi-label">Active Services</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><Zap size={24} /></div>
          <div className="kpi-value">{CATEGORIES.length}</div>
          <div className="kpi-label">Service Verticals</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><CheckCircle2 size={24} /></div>
          <div className="kpi-value">{services.filter(s => s.is_published).length}</div>
          <div className="kpi-label">Live Protocols</div>
        </div>
      </div>

      <div className="search-filter-bar card glass p-4">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text"
            placeholder="Filter service catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(service => (
          <div key={service.id} className="card group hover:border-gold/30 transition-all duration-500">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-surface-2 rounded-2xl flex items-center justify-center text-gold border border-border group-hover:bg-gold group-hover:text-navy transition-all duration-500">
                <Monitor size={24} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditItem(service); setForm(service); setShowForm(true); }} className="btn btn-secondary btn-sm"><Edit size={14} /></button>
                <button onClick={() => handleDelete(service.id)} className="btn btn-danger btn-sm"><Trash2 size={14} /></button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors mb-2">{service.name}</h3>
            <div className="badge badge-secondary mb-4">{service.category}</div>
            <p className="text-sm text-text-muted leading-relaxed line-clamp-3 mb-6">
              {service.short_description || 'No description provided for this service protocol.'}
            </p>
            <div className="pt-6 border-t border-border flex justify-between items-center">
              <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest">{service.slug}</span>
              <PublishToggle isPublished={service.is_published} onChange={() => {}} />
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-xl">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editItem ? 'Configure Service Protocol' : 'Initialize New Service'}</h2>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest">Enterprise Solution Architect</p>
              </div>
              <button onClick={() => setShowForm(false)} className="modal-close"><Plus className="rotate-45" size={28} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-body space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="form-group">
                  <label className="form-label">Service Name</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="form-input" placeholder="e.g. AI Automation Engine" />
                </div>
                <SlugGenerator title={form.name} value={form.slug} onChange={slug => setForm({...form, slug})} prefix="services/" />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="form-select">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pricing Info (Optional)</label>
                  <input value={form.price_info} onChange={e => setForm({...form, price_info: e.target.value})} className="form-input" placeholder="e.g. Starting from $2,500" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Short Tagline</label>
                <input value={form.short_description} onChange={e => setForm({...form, short_description: e.target.value})} className="form-input" placeholder="Brief one-liner for cards..." />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Documentation (HTML)</label>
                <textarea rows={10} value={form.description_html} onChange={e => setForm({...form, description_html: e.target.value})} className="form-textarea font-mono text-xs" />
              </div>

              <div className="flex items-center gap-8 card glass p-6">
                <PublishToggle isPublished={form.is_published} onChange={val => setForm({...form, is_published: val})} />
                <div className="form-group flex-1">
                  <label className="form-label">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: Number(e.target.value)})} className="form-input" />
                </div>
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
