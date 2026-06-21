'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  Plus, Edit, Trash2, Briefcase, Search, 
  ExternalLink, Code, Target, Image as ImageIcon,
  Rocket, Globe
} from 'lucide-react';
import SlugGenerator from '@/components/website/SlugGenerator';
import PublishToggle from '@/components/website/PublishToggle';
import ImageUploader from '@/components/website/ImageUploader';

const INITIAL_FORM = {
  project_name: '',
  client_name: '',
  slug: '',
  category: 'Software Architecture',
  technologies: [],
  short_description: '',
  case_study_html: '',
  main_image_url: '',
  live_url: '',
  results_metrics: '',
  is_featured: false,
  is_published: true,
  sort_order: 0,
  website_type: 'nexus'
};

const CATEGORIES = [
  'Software Architecture',
  'AI Integration',
  'Enterprise Web',
  'Mobile Ecosystems',
  'Brand Transformation',
  'Automation Systems'
];

export default function NexusPortfolioPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const supabase = getSupabaseClient();
    try {
      const { data } = await supabase
        .from('web_nexus_portfolio')
        .select('*')
        .order('sort_order', { ascending: true });
      setProjects(data || []);
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
          .from('web_nexus_portfolio')
          .update({ ...form, updated_at: new Date() })
          .eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('web_nexus_portfolio')
          .insert([form]);
        if (error) throw error;
      }
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      alert('Database error: Make sure web_nexus_portfolio table exists. Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this case study?')) return;
    const supabase = getSupabaseClient();
    await supabase.from('web_nexus_portfolio').delete().eq('id', id);
    fetchProjects();
  };

  const filtered = projects.filter(p => 
    p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center animate-pulse text-gold font-black uppercase tracking-widest">Accessing Nexus High-Value Portfolio...</div>;

  return (
    <div className="page-content space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Briefcase className="text-gold" />
            Nexus Global Portfolio
          </h1>
          <p className="page-subtitle">Showcase world-class digital transformations and enterprise-grade case studies</p>
        </div>
        <button 
          onClick={() => { setForm(INITIAL_FORM); setEditItem(null); setShowForm(true); }}
          className="btn btn-primary btn-lg shadow-gold"
        >
          <Plus size={20} /> Archive New Project
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><Target size={24} /></div>
          <div className="kpi-value">{projects.length}</div>
          <div className="kpi-label">Case Studies</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><Rocket size={24} /></div>
          <div className="kpi-value">{projects.filter(p => p.is_featured).length}</div>
          <div className="kpi-label">Featured Projects</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><Code size={24} /></div>
          <div className="kpi-value">{[...new Set(projects.flatMap(p => p.technologies))].length}</div>
          <div className="kpi-label">Tech Stack Depth</div>
        </div>
      </div>

      <div className="search-filter-bar card glass p-4">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text"
            placeholder="Search by client, project, or technology..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map(project => (
          <div key={project.id} className="card group p-0 overflow-hidden border-border hover:border-gold/40 transition-all duration-700">
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={project.main_image_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800'} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="badge badge-gold uppercase text-[10px] tracking-widest">{project.category}</span>
                  {project.is_featured && <span className="badge badge-primary"><Rocket size={10} className="mr-1" /> Featured</span>}
                </div>
                <h3 className="text-2xl font-black text-white leading-tight">{project.project_name}</h3>
                <p className="text-white/60 text-sm font-bold uppercase tracking-widest mt-1">Client: {project.client_name}</p>
              </div>
            </div>
            <div className="p-8">
              <p className="text-text-muted leading-relaxed mb-6 line-clamp-2">{project.short_description}</p>
              <div className="flex flex-wrap gap-2 mb-8">
                {project.technologies?.map(tech => (
                  <span key={tech} className="px-3 py-1 bg-surface-2 border border-border rounded-lg text-[10px] font-bold text-gold uppercase tracking-tighter">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-border">
                <div className="flex gap-4">
                   <button onClick={() => { setEditItem(project); setForm(project); setShowForm(true); }} className="btn btn-secondary btn-sm"><Edit size={14} /> Edit Case</button>
                   <button onClick={() => handleDelete(project.id)} className="btn btn-danger btn-sm"><Trash2 size={14} /></button>
                </div>
                {project.live_url && (
                  <a href={project.live_url} target="_blank" className="text-gold hover:text-white transition-colors">
                    <ExternalLink size={20} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-xl">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editItem ? 'Edit Portfolio Case' : 'Archive New Masterpiece'}</h2>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest">Creative & Technical Excellence Vault</p>
              </div>
              <button onClick={() => setShowForm(false)} className="modal-close"><Plus className="rotate-45" size={28} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-body space-y-8 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
              <div className="grid grid-cols-2 gap-8">
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input required value={form.project_name} onChange={e => setForm({...form, project_name: e.target.value})} className="form-input" placeholder="e.g. AI-Powered CRM Ecosystem" />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Name</label>
                  <input required value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} className="form-input" placeholder="e.g. Fortune 500 Enterprise" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <SlugGenerator title={form.project_name} value={form.slug} onChange={slug => setForm({...form, slug})} prefix="portfolio/" />
                <div className="form-group">
                  <label className="form-label">Vertical Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="form-select">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <ImageUploader label="Primary Showcase Image" value={form.main_image_url} onChange={url => setForm({...form, main_image_url: url})} aspect="video" />
                <div className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">Technologies (Comma Separated)</label>
                    <input value={form.technologies?.join(', ')} onChange={e => setForm({...form, technologies: e.target.value.split(',').map(s => s.trim())})} className="form-input" placeholder="React, Python, AWS, OpenAI..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Live Project URL</label>
                    <input type="url" value={form.live_url} onChange={e => setForm({...form, live_url: e.target.value})} className="form-input" placeholder="https://project-live.com" />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Brief Summary (For Cards)</label>
                <textarea rows={2} value={form.short_description} onChange={e => setForm({...form, short_description: e.target.value})} className="form-textarea" />
              </div>

              <div className="form-group">
                <label className="form-label">Key Results & Metrics</label>
                <input value={form.results_metrics} onChange={e => setForm({...form, results_metrics: e.target.value})} className="form-input" placeholder="e.g. 40% Increase in efficiency, $1M cost savings..." />
              </div>

              <div className="form-group">
                <label className="form-label">Deep Case Study (HTML)</label>
                <textarea rows={10} value={form.case_study_html} onChange={e => setForm({...form, case_study_html: e.target.value})} className="form-textarea font-mono text-xs" />
              </div>

              <div className="flex items-center gap-12 card glass p-8">
                <PublishToggle isPublished={form.is_published} onChange={val => setForm({...form, is_published: val})} />
                <label className="flex items-center gap-4 cursor-pointer group">
                  <input type="checkbox" className="w-6 h-6 accent-gold" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} />
                  <span className="font-bold text-white group-hover:text-gold transition-colors">Showcase on Elite Wall (Featured)</span>
                </label>
                <div className="form-group flex-1">
                  <label className="form-label">Exhibition Priority (Sort)</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: Number(e.target.value)})} className="form-input" />
                </div>
              </div>
            </form>
            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost">Discard</button>
              <button onClick={handleSave} className="btn btn-primary btn-lg shadow-gold min-w-[250px]">Archive Case Study</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
