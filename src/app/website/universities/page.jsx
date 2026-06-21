'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  Plus, Edit, Trash2, School, Search, 
  MapPin, ExternalLink, Award, DollarSign,
  CheckCircle2, Star
} from 'lucide-react';
import SlugGenerator from '@/components/website/SlugGenerator';
import SEOFields from '@/components/website/SEOFields';
import PublishToggle from '@/components/website/PublishToggle';
import ImageUploader from '@/components/website/ImageUploader';

const INITIAL_FORM = {
  name: '',
  slug: '',
  destination_id: '',
  logo_url: '',
  cover_image_url: '',
  ranking: '',
  tuition_min: '',
  tuition_max: '',
  currency: 'USD',
  programs: [],
  website_url: '',
  description: '',
  content_html: '',
  is_partner: false,
  is_published: false,
  is_featured: false,
  seo_title: '',
  seo_description: '',
  sort_order: 0
};

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [destFilter, setDestFilter] = useState('all');
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
    setLoading(true);
    try {
      const [uniRes, destRes] = await Promise.all([
        supabase.from('web_universities').select('*, web_destinations(name)').eq('website_type', websiteType).order('name', { ascending: true }),
        supabase.from('web_destinations').select('id, name').eq('website_type', websiteType).order('name', { ascending: true })
      ]);
      setUniversities(uniRes.data || []);
      setDestinations(destRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.destination_id) return alert('Please select a destination country');
    
    const supabase = getSupabaseClient();
    const payload = {
      ...form,
      ranking: form.ranking ? Number(form.ranking) : null,
      tuition_min: form.tuition_min ? Number(form.tuition_min) : null,
      tuition_max: form.tuition_max ? Number(form.tuition_max) : null,
      updated_at: new Date().toISOString()
    };

    try {
      if (editItem) {
        const { error } = await supabase.from('web_universities').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('web_universities').insert([payload]);
        if (error) throw error;
      }
      setShowForm(false);
      setEditItem(null);
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this university?')) return;
    const supabase = getSupabaseClient();
    await supabase.from('web_universities').delete().eq('id', id);
    fetchData();
  };

  const filteredUnis = universities.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDest = destFilter === 'all' || u.destination_id === destFilter;
    return matchesSearch && matchesDest;
  });

  if (loading) return <div className="p-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto"></div></div>;

  return (
    <div className="page-content space-y-8">
      {/* Header with KPI Cards */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <School className="text-gold" />
            University Partners
          </h1>
          <p className="page-subtitle">Manage institutional profiles, global rankings, and official partnerships</p>
        </div>
        <button 
          onClick={() => { setForm({ ...INITIAL_FORM, website_type: websiteType }); setEditItem(null); setShowForm(true); }}
          className="btn btn-primary btn-lg shadow-gold"
        >
          <Plus size={20} /> Add University
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><School size={24} /></div>
          <div className="kpi-value">{universities.length}</div>
          <div className="kpi-label">Total Institutions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><CheckCircle2 size={24} /></div>
          <div className="kpi-value">{universities.filter(u => u.is_partner).length}</div>
          <div className="kpi-label">Official Partners</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><Award size={24} /></div>
          <div className="kpi-value">{universities.filter(u => u.ranking && u.ranking <= 100).length}</div>
          <div className="kpi-label">Top 100 Ranked</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="search-filter-bar card glass p-4">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text"
            placeholder="Search institutions by name or program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
        <select 
          value={destFilter} 
          onChange={(e) => setDestFilter(e.target.value)}
          className="form-select w-64"
        >
          <option value="all">All Destination Countries</option>
          {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Modern Data Table */}
      <div className="table-wrapper card p-0 overflow-hidden border-border">
        <table className="data-table">
          <thead>
            <tr>
              <th>University & Identity</th>
              <th>Country</th>
              <th>Global Rank</th>
              <th>Tuition Range</th>
              <th>Partnership</th>
              <th>Visibility</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUnis.map((uni) => (
              <tr key={uni.id}>
                <td>
                  <div className="flex items-center gap-4">
                    <div className="avatar avatar-lg rounded-2xl bg-surface-2 border border-border p-1">
                      <img src={uni.logo_url || 'https://placehold.co/100x100?text=U'} className="object-contain" alt="" />
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-gold transition-colors">{uni.name}</div>
                      <div className="text-[10px] font-mono text-text-dim mt-1">ID: {uni.slug}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2 text-text-muted">
                    <MapPin size={14} className="text-gold" />
                    {uni.web_destinations?.name || 'Unassigned'}
                  </div>
                </td>
                <td>
                  {uni.ranking ? (
                    <div className="flex items-center gap-2 font-bold text-gold">
                      <Award size={16} />
                      #{uni.ranking}
                    </div>
                  ) : (
                    <span className="text-text-dim italic text-xs">Unranked</span>
                  )}
                </td>
                <td>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">
                      {uni.currency} {uni.tuition_min?.toLocaleString()} - {uni.tuition_max?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-text-dim uppercase tracking-tighter">Per Academic Year</span>
                  </div>
                </td>
                <td>
                  {uni.is_partner ? (
                    <span className="badge badge-gold">
                      <Star size={10} fill="currentColor" /> Premium Partner
                    </span>
                  ) : (
                    <span className="badge badge-muted">Standard Listing</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${uni.is_published ? 'badge-success' : 'badge-warning'}`}>
                    {uni.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => { setEditItem(uni); setForm(uni); setShowForm(true); }} 
                      className="btn btn-secondary btn-sm"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(uni.id)} 
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUnis.length === 0 && (
          <div className="empty-state">
            <School size={48} className="text-text-dim" />
            <h3>No Universities Found</h3>
            <p>We couldn&apos;t find any institutions matching your search or filters.</p>
          </div>
        )}
      </div>

      {/* Premium Modal Form */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-xl">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editItem ? 'Update University Profile' : 'Register New University Partner'}</h2>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest">Global Academic Partnership Console</p>
              </div>
              <button onClick={() => setShowForm(false)} className="modal-close">
                <Plus className="rotate-45" size={28} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-body">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left side: Assets & Stats */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="card glass space-y-6">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Institutional Assets</h3>
                    <ImageUploader label="Official University Logo" value={form.logo_url} onChange={url => setForm({...form, logo_url: url})} aspect="square" />
                    <ImageUploader label="Campus Cover Photo" value={form.cover_image_url} onChange={url => setForm({...form, cover_image_url: url})} aspect="video" />
                  </div>

                  <div className="card glass space-y-6">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Partner Status</h3>
                    <PublishToggle isPublished={form.is_published} onChange={val => setForm({...form, is_published: val})} />
                    <div className="divider" />
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-5 h-5 accent-gold bg-charcoal border-none rounded" checked={form.is_partner} onChange={e => setForm({...form, is_partner: e.target.checked})} />
                        <span className="text-sm font-semibold text-text group-hover:text-gold transition-colors">Official Strategic Partner</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-5 h-5 accent-gold bg-charcoal border-none rounded" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} />
                        <span className="text-sm font-semibold text-text group-hover:text-gold transition-colors">Featured on Homepage</span>
                      </label>
                    </div>
                  </div>

                  <SEOFields seoTitle={form.seo_title} setSeoTitle={val => setForm({...form, seo_title: val})} seoDescription={form.seo_description} setSeoDescription={val => setForm({...form, seo_description: val})} titleHint={form.name} />
                </div>

                {/* Right side: Core Configuration */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="card glass space-y-8">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Identity & Locality</h3>
                    <div className="grid grid-2">
                      <div className="form-group">
                        <label className="form-label">University Name</label>
                        <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="form-input" placeholder="e.g. Oxford University" />
                      </div>
                      <SlugGenerator title={form.name} value={form.slug} onChange={slug => setForm({...form, slug})} prefix="universities/" />
                    </div>

                    <div className="grid grid-2">
                      <div className="form-group">
                        <label className="form-label">Destination Country</label>
                        <select required value={form.destination_id} onChange={e => setForm({...form, destination_id: e.target.value})} className="form-select">
                          <option value="">Select Country Context...</option>
                          {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Official Website URL</label>
                        <div className="flex items-center gap-2">
                          <input type="url" value={form.website_url} onChange={e => setForm({...form, website_url: e.target.value})} className="form-input" placeholder="https://www.uni.edu" />
                          <a href={form.website_url} target="_blank" className="btn btn-secondary btn-sm"><ExternalLink size={14} /></a>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-3">
                      <div className="form-group">
                        <label className="form-label">Global Ranking (QS/THE)</label>
                        <input type="number" value={form.ranking} onChange={e => setForm({...form, ranking: e.target.value})} className="form-input" placeholder="e.g. 42" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Min Tuition/Year ({form.currency})</label>
                        <input type="number" value={form.tuition_min} onChange={e => setForm({...form, tuition_min: e.target.value})} className="form-input" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Max Tuition/Year ({form.currency})</label>
                        <input type="number" value={form.tuition_max} onChange={e => setForm({...form, tuition_max: e.target.value})} className="form-input" />
                      </div>
                    </div>
                  </div>

                  <div className="card glass space-y-8">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Academic Content</h3>
                    <div className="form-group">
                      <label className="form-label">Popular Program Clusters (Comma Separated)</label>
                      <input className="form-input" value={form.programs?.join(', ')} onChange={e => setForm({...form, programs: e.target.value.split(',').map(s => s.trim())})} placeholder="Business, Engineering, Arts, Medicine..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Marketing Bio / Intro</label>
                      <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="form-textarea" placeholder="Brief summary for search results..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Rich Campus Guide (HTML Template)</label>
                      <textarea rows={10} value={form.content_html} onChange={e => setForm({...form, content_html: e.target.value})} className="form-textarea font-mono text-xs" />
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-lg">Close Without Saving</button>
              <button onClick={handleSave} className="btn btn-primary btn-lg shadow-gold min-w-[220px]">
                {editItem ? 'Commit Changes' : 'Register Institution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
