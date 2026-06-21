'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  Plus, Edit, Trash2, Globe, MapPin, 
  DollarSign, GraduationCap, Info, Search 
} from 'lucide-react';
import SlugGenerator from '@/components/website/SlugGenerator';
import SEOFields from '@/components/website/SEOFields';
import PublishToggle from '@/components/website/PublishToggle';
import ImageUploader from '@/components/website/ImageUploader';

const INITIAL_FORM = {
  name: '',
  slug: '',
  flag_url: '',
  hero_image_url: '',
  description: '',
  overview_html: '',
  why_study_here: '',
  living_cost_min: '',
  living_cost_max: '',
  currency: 'USD',
  popular_cities: [],
  popular_programs: [],
  visa_overview: '',
  scholarships_available: true,
  is_published: false,
  is_featured: false,
  seo_title: '',
  seo_description: '',
  sort_order: 0
};

export default function DestinationsPage() {
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
    if (websiteType) fetchDestinations();
  }, [websiteType]);

  const fetchDestinations = async () => {
    const supabase = getSupabaseClient();
    try {
      const { data } = await supabase
        .from('web_destinations')
        .select('*')
        .eq('website_type', websiteType)
        .order('sort_order', { ascending: true });
      setDestinations(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    
    // Clean up numeric values
    const payload = {
      ...form,
      living_cost_min: form.living_cost_min ? Number(form.living_cost_min) : null,
      living_cost_max: form.living_cost_max ? Number(form.living_cost_max) : null,
      updated_at: new Date().toISOString()
    };

    try {
      if (editItem) {
        const { error } = await supabase
          .from('web_destinations')
          .update(payload)
          .eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('web_destinations')
          .insert([payload]);
        if (error) throw error;
      }
      setShowForm(false);
      setEditItem(null);
      fetchDestinations();
    } catch (err) {
      alert('Error saving: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this destination? This will affect linked universities.')) return;
    const supabase = getSupabaseClient();
    await supabase.from('web_destinations').delete().eq('id', id);
    fetchDestinations();
  };

  const filteredDestinations = destinations.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
    </div>
  );

  return (
    <div className="page-content space-y-8">
      {/* Header with KPI Cards */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Globe className="text-gold" />
            Study Destinations
          </h1>
          <p className="page-subtitle">Configure countries, study guides, and visa requirements for global students</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setForm({ ...INITIAL_FORM, website_type: websiteType }); setEditItem(null); setShowForm(true); }}
            className="btn btn-primary btn-lg shadow-gold"
          >
            <Plus size={20} /> Add Destination
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><Globe size={24} /></div>
          <div className="kpi-value">{destinations.length}</div>
          <div className="kpi-label">Active Destinations</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><Plus size={24} /></div>
          <div className="kpi-value">{destinations.filter(d => d.is_published).length}</div>
          <div className="kpi-label">Published Guides</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><GraduationCap size={24} /></div>
          <div className="kpi-value">{destinations.filter(d => d.scholarships_available).length}</div>
          <div className="kpi-label">Scholarship Enabled</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="search-filter-bar card glass p-4">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text"
            placeholder="Search countries by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
        <select className="form-select w-48">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDestinations.map((dest) => (
          <div key={dest.id} className="card group p-0 overflow-hidden border-border hover:border-gold-dim">
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={dest.hero_image_url || 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f2?q=80&w=800'} 
                alt={dest.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <div className="w-10 h-6 overflow-hidden rounded-sm shadow-lg border border-white/20">
                  <img src={dest.flag_url} className="w-full h-full object-cover" alt="" />
                </div>
                <h3 className="text-lg font-bold text-white drop-shadow-md">{dest.name}</h3>
              </div>

              <div className="absolute top-4 right-4">
                <span className={`badge ${dest.is_published ? 'badge-success' : 'badge-muted'}`}>
                  {dest.is_published ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                <div className="flex gap-3">
                  <div className="flex items-center gap-1 text-white/80 text-xs bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg">
                    <MapPin size={12} className="text-gold" />
                    {dest.popular_cities?.length || 0} Cities
                  </div>
                  <div className="flex items-center gap-1 text-white/80 text-xs bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg">
                    <GraduationCap size={12} className="text-gold" />
                    {dest.scholarships_available ? 'Scholarships' : 'No Grant'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-text-muted mb-6 line-clamp-2 leading-relaxed">
                {dest.description || 'No description provided for this study destination yet.'}
              </p>
              
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span className="text-[10px] font-mono text-gold uppercase tracking-tighter opacity-60">
                  ID: {dest.slug}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditItem(dest); setForm(dest); setShowForm(true); }}
                    className="btn btn-secondary btn-sm"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(dest.id)}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredDestinations.length === 0 && (
          <div className="col-span-full py-32 card glass flex flex-col items-center justify-center text-center">
            <Globe className="text-text-dim mb-6 animate-pulse" size={64} />
            <h3 className="text-xl font-bold mb-2">No Destinations Found</h3>
            <p className="text-text-muted max-w-md">Try searching for a different country or create a new destination to start managing study guides.</p>
          </div>
        )}
      </div>

      {/* Premium Modal Form */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-xl">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editItem ? 'Edit Study Destination' : 'Configure New Destination'}</h2>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest">Guide & Visa Configuration Portal</p>
              </div>
              <button onClick={() => setShowForm(false)} className="modal-close">
                <Plus className="rotate-45" size={28} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-body">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Side: Meta & Visuals (4 cols) */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="space-y-6 bg-surface-2 p-6 rounded-3xl border border-border">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Visual Identity</h3>
                    <ImageUploader 
                      label="Country Flag" 
                      value={form.flag_url} 
                      onChange={url => setForm({...form, flag_url: url})} 
                      aspect="flag"
                    />
                    <ImageUploader 
                      label="Hero Destination Shot" 
                      value={form.hero_image_url} 
                      onChange={url => setForm({...form, hero_image_url: url})} 
                      aspect="video"
                    />
                  </div>

                  <div className="space-y-6 bg-surface-2 p-6 rounded-3xl border border-border">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Settings & Visibility</h3>
                    <PublishToggle 
                      isPublished={form.is_published} 
                      onChange={val => setForm({...form, is_published: val})} 
                    />
                    <div className="divider" />
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-12 h-6 bg-charcoal rounded-full relative transition-all group-hover:bg-charcoal/80">
                        <input 
                          type="checkbox" 
                          className="sr-only"
                          checked={form.is_featured}
                          onChange={e => setForm({...form, is_featured: e.target.checked})}
                        />
                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-all ${form.is_featured ? 'translate-x-6 bg-gold' : 'bg-text-muted'}`} />
                      </div>
                      <span className="text-sm font-semibold text-text group-hover:text-gold transition-colors">Feature on Home</span>
                    </label>
                  </div>

                  <SEOFields 
                    seoTitle={form.seo_title}
                    setSeoTitle={val => setForm({...form, seo_title: val})}
                    seoDescription={form.seo_description}
                    setSeoDescription={val => setForm({...form, seo_description: val})}
                    titleHint={`Study in ${form.name || '...'}`}
                  />
                </div>

                {/* Right Side: Content & Details (8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="card glass p-8 space-y-6">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-4">Core Directory Info</h3>
                    <div className="grid grid-2">
                      <div className="form-group">
                        <label className="form-label">Country Name</label>
                        <input 
                          required 
                          className="form-input"
                          value={form.name}
                          onChange={e => setForm({...form, name: e.target.value})}
                          placeholder="e.g. United Kingdom"
                        />
                      </div>
                      <SlugGenerator 
                        title={form.name} 
                        value={form.slug} 
                        onChange={slug => setForm({...form, slug})} 
                        prefix="destinations/" 
                      />
                    </div>

                    <div className="grid grid-3">
                      <div className="form-group">
                        <label className="form-label">Currency</label>
                        <input className="form-input" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} placeholder="USD / GBP" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Min Living Cost</label>
                        <input type="number" className="form-input" value={form.living_cost_min} onChange={e => setForm({...form, living_cost_min: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Max Living Cost</label>
                        <input type="number" className="form-input" value={form.living_cost_max} onChange={e => setForm({...form, living_cost_max: e.target.value})} />
                      </div>
                    </div>

                    <div className="grid grid-2">
                      <div className="form-group">
                        <label className="form-label">Popular Cities (Comma Separated)</label>
                        <input 
                          className="form-input"
                          value={form.popular_cities?.join(', ')}
                          onChange={e => setForm({...form, popular_cities: e.target.value.split(',').map(s => s.trim())})}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Popular Programs</label>
                        <input 
                          className="form-input"
                          value={form.popular_programs?.join(', ')}
                          onChange={e => setForm({...form, popular_programs: e.target.value.split(',').map(s => s.trim())})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="card glass p-8 space-y-6">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-4">Content & Rich Guides</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Quick Intro (For Card)</label>
                      <textarea className="form-textarea" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Full Country Overview (HTML Supported)</label>
                      <textarea className="form-textarea font-mono text-xs" rows={8} value={form.overview_html} onChange={e => setForm({...form, overview_html: e.target.value})} />
                    </div>

                    <div className="grid grid-2">
                      <div className="form-group">
                        <label className="form-label">Why Study Here?</label>
                        <textarea className="form-textarea" rows={5} value={form.why_study_here} onChange={e => setForm({...form, why_study_here: e.target.value})} placeholder="One point per line..." />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Visa Requirements</label>
                        <textarea className="form-textarea" rows={5} value={form.visa_overview} onChange={e => setForm({...form, visa_overview: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-lg">Discard Changes</button>
              <button onClick={handleSave} className="btn btn-primary btn-lg shadow-gold min-w-[200px]">
                {editItem ? 'Save Updates' : 'Launch Destination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
