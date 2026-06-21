'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Plus, Edit, Trash2, Eye, Newspaper, CheckCircle2, Search, Star, Info } from 'lucide-react';
import PublishToggle from '@/components/website/PublishToggle';
import SlugGenerator from '@/components/website/SlugGenerator';
import ImageUploader from '@/components/website/ImageUploader';

export default function NewsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '', image_url: '', category: 'News', is_published: false, is_featured: false,
    website_type: '' 
  });
  const [websiteType, setWebsiteType] = useState('main');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'main';
    setWebsiteType(type);
    fetchPosts(type);
  }, []);

  const fetchPosts = async (typeOverride) => {
    const type = typeOverride || websiteType;
    const supabase = getSupabaseClient();
    try {
      const { data } = await supabase
        .from('news_posts')
        .select('*')
        .eq('website_type', type)
        .order('created_at', { ascending: false });
      setPosts(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    
    const payload = { ...form, website_type: websiteType };
    if (payload.is_published && !editItem?.is_published) {
      payload.published_at = new Date().toISOString();
    }

    if (editItem) {
      await supabase.from('news_posts').update(payload).eq('id', editItem.id);
    } else {
      await supabase.from('news_posts').insert([payload]);
    }
    setShowForm(false);
    setEditItem(null);
    fetchPosts();
  };

  const deletePost = async (id) => {
    if (!confirm('Delete post?')) return;
    const supabase = getSupabaseClient();
    await supabase.from('news_posts').delete().eq('id', id);
    fetchPosts();
  };

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'published' ? p.is_published : !p.is_published);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="page-content space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Newspaper className="text-gold" />
            Editorial Center - {websiteType.replace('_', ' ').toUpperCase()}
          </h1>
          <p className="page-subtitle">Manage news and announcements for {websiteType.replace('_', ' ')} website</p>
        </div>
        <button 
          onClick={() => { setForm({ title: '', slug: '', excerpt: '', content: '', image_url: '', category: 'News', is_published: false, is_featured: false }); setEditItem(null); setShowForm(true); }}
          className="btn btn-primary btn-lg shadow-gold"
        >
          <Plus size={20} /> Create New Post
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><Newspaper size={24} /></div>
          <div className="kpi-value">{posts.length}</div>
          <div className="kpi-label">Total Articles</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><CheckCircle2 size={24} /></div>
          <div className="kpi-value">{posts.filter(p => p.is_published).length}</div>
          <div className="kpi-label">Published Live</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><Eye size={24} /></div>
          <div className="kpi-value">{posts.filter(p => p.is_featured).length}</div>
          <div className="kpi-label">Featured Highlights</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="search-filter-bar card glass p-4">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text"
            placeholder="Search articles by title, category, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-select w-44"
          >
            <option value="all">All Categories</option>
            <option value="News">News</option>
            <option value="Blog">Blog</option>
            <option value="Success Story">Success Story</option>
            <option value="Announcement">Announcement</option>
          </select>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select w-40"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* Modern Content Table */}
      <div className="table-wrapper card p-0 overflow-hidden border-border">
        <table className="data-table">
          <thead>
            <tr>
              <th>Article & Identification</th>
              <th>Category</th>
              <th>Engagement</th>
              <th>Status</th>
              <th>Date Created</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border overflow-hidden shrink-0">
                      <img src={p.image_url || 'https://placehold.co/100x100?text=News'} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-gold transition-colors line-clamp-1">{p.title}</div>
                      <div className="text-[10px] font-mono text-text-dim mt-1">slug: {p.slug}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${
                    p.category === 'News' ? 'badge-info' : 
                    p.category === 'Announcement' ? 'badge-purple' : 'badge-gold'
                  }`}>
                    {p.category}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    {p.is_featured && <span className="badge badge-gold"><Star size={10} fill="currentColor" /> Featured</span>}
                    {!p.is_featured && <span className="text-text-dim italic text-xs">Standard</span>}
                  </div>
                </td>
                <td>
                  <span className={`badge ${p.is_published ? 'badge-success' : 'badge-warning'}`}>
                    {p.is_published ? 'Live' : 'Draft'}
                  </span>
                </td>
                <td>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">
                      {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-text-dim">Last Updated</span>
                  </div>
                </td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => { setEditItem(p); setForm(p); setShowForm(true); }} 
                      className="btn btn-secondary btn-sm"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => deletePost(p.id)} 
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

        {filteredPosts.length === 0 && (
          <div className="empty-state">
            <Newspaper size={48} className="text-text-dim" />
            <h3>No Articles Found</h3>
            <p>Your newsroom is empty. Start writing your first story to reach your audience.</p>
          </div>
        )}
      </div>

      {/* Premium Content Editor Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-xl">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editItem ? 'Refine Article' : 'Draft New Story'}</h2>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest">Global Content Publishing Platform</p>
              </div>
              <button onClick={() => setShowForm(false)} className="modal-close">
                <Plus className="rotate-45" size={28} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-body">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left side: Assets & Metadata */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="card glass space-y-6">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Publication Assets</h3>
                    <ImageUploader label="Main Featured Image" value={form.image_url} onChange={url => setForm({...form, image_url: url})} aspect="video" />
                  </div>

                  <div className="card glass space-y-6">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Publishing Logic</h3>
                    <div className="space-y-4">
                      <div className="form-group">
                        <label className="form-label">Classification</label>
                        <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                          <option value="News">Corporate News</option>
                          <option value="Blog">Educational Blog</option>
                          <option value="Success Story">Success Story</option>
                          <option value="Announcement">Announcement</option>
                        </select>
                      </div>
                      <div className="divider" />
                      <div className="space-y-4">
                        <PublishToggle isPublished={form.is_published} onChange={val => setForm({...form, is_published: val})} />
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="w-5 h-5 accent-gold bg-charcoal border-none rounded" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} />
                          <span className="text-sm font-semibold text-text group-hover:text-gold transition-colors">Pin to Featured Highlights</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="card glass space-y-6">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Search Optimization</h3>
                    <div className="form-group">
                      <label className="form-label">Article Excerpt</label>
                      <textarea rows={4} value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} className="form-textarea" placeholder="Short teaser for search results..." />
                    </div>
                  </div>
                </div>

                {/* Right side: Editorial Content */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="card glass space-y-8">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Headline & Routing</h3>
                    <div className="form-group">
                      <label className="form-label text-lg">Main Headline</label>
                      <input 
                        required 
                        className="form-input text-xl font-bold py-4 border-b-2 border-transparent focus:border-gold bg-surface-1/50" 
                        value={form.title} 
                        onChange={e => {
                          const newTitle = e.target.value;
                          setForm(prev => ({...prev, title: newTitle, slug: !editItem ? generateSlug(newTitle) : prev.slug}));
                        }} 
                        placeholder="Enter article title..."
                      />
                    </div>
                    <SlugGenerator title={form.title} value={form.slug} onChange={slug => setForm({...form, slug})} prefix="news/" />
                  </div>

                  <div className="card glass space-y-8 min-h-[500px] flex flex-col">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Rich Article Content</h3>
                      <div className="flex gap-2">
                        <button type="button" className="btn btn-secondary btn-xs">Visual Editor</button>
                        <button type="button" className="btn btn-ghost btn-xs text-gold">Markdown</button>
                      </div>
                    </div>
                    <textarea 
                      required 
                      className="form-textarea flex-1 font-serif text-lg leading-relaxed bg-surface-1/30" 
                      value={form.content} 
                      onChange={e => setForm({...form, content: e.target.value})} 
                      placeholder="Start writing your story here. Use HTML tags for formatting..."
                    />
                    <div className="text-[10px] text-text-dim uppercase tracking-tighter flex items-center gap-2 mt-4">
                      <Info size={12} /> Supporting &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;img&gt; tags
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-lg">Discard Changes</button>
              <button onClick={handleSave} className="btn btn-primary btn-lg shadow-gold min-w-[240px]">
                {editItem ? 'Update Publication' : 'Launch Publication'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
