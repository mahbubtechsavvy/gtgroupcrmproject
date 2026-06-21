'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Plus, Edit, Trash2, HelpCircle, GripVertical, CheckCircle2 } from 'lucide-react';
import PublishToggle from '@/components/website/PublishToggle';

const INITIAL_FORM = {
  question: '',
  answer: '',
  category: 'General',
  sort_order: 0,
  is_active: true
};

const CATEGORIES = ['General', 'Study Visa', 'Scholarships', 'University Application', 'Our Services', 'Others'];

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const [websiteType, setWebsiteType] = useState('study-abroad');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type) setWebsiteType(type);
    fetchFaqs(type || 'study-abroad');
  }, []);

  const fetchFaqs = async (type = websiteType) => {
    const supabase = getSupabaseClient();
    try {
      const { data } = await supabase
        .from('web_faqs')
        .select('*')
        .eq('website_type', type)
        .order('sort_order', { ascending: true });
      setFaqs(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (editItem) {
      await supabase.from('web_faqs').update(form).eq('id', editItem.id);
    } else {
      await supabase.from('web_faqs').insert([form]);
    }
    setShowForm(false);
    fetchFaqs();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete FAQ?')) return;
    await getSupabaseClient().from('web_faqs').delete().eq('id', id);
    fetchFaqs();
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="page-content space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <HelpCircle className="text-gold" />
            Knowledge Base (FAQ)
          </h1>
          <p className="page-subtitle">Curate frequently asked questions to reduce support tickets and guide students</p>
        </div>
        <button 
          onClick={() => { setForm(INITIAL_FORM); setEditItem(null); setShowForm(true); }}
          className="btn btn-primary btn-lg shadow-gold"
        >
          <Plus size={20} /> Add New Entry
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><HelpCircle size={24} /></div>
          <div className="kpi-value">{faqs.length}</div>
          <div className="kpi-label">Total Questions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><CheckCircle2 size={24} /></div>
          <div className="kpi-value">{faqs.filter(f => f.is_active).length}</div>
          <div className="kpi-label">Active on Site</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><GripVertical size={24} /></div>
          <div className="kpi-value">{CATEGORIES.length}</div>
          <div className="kpi-label">Knowledge Domains</div>
        </div>
      </div>

      {/* Categorized List */}
      <div className="space-y-10">
        {CATEGORIES.map(cat => {
          const catFaqs = faqs.filter(f => f.category === cat);
          return (
            <div key={cat} className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xs font-bold text-gold uppercase tracking-[0.3em] whitespace-nowrap">{cat} Domain</h2>
                <div className="h-px w-full bg-gradient-to-r from-gold/30 to-transparent" />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {catFaqs.map(faq => (
                  <div key={faq.id} className="card glass p-6 flex items-start gap-6 group hover:border-gold/50 transition-all duration-500">
                    <div className="flex flex-col items-center gap-2 mt-1">
                      <div className="text-gold/30 cursor-grab active:cursor-grabbing hover:text-gold transition-colors">
                        <GripVertical size={20} />
                      </div>
                      <div className={`w-2 h-2 rounded-full ${faq.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-charcoal'}`} />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-gold transition-colors">{faq.question}</h3>
                      <p className="text-sm text-text-muted leading-relaxed">{faq.answer}</p>
                      <div className="flex items-center gap-4 pt-2">
                        <span className="text-[10px] font-mono text-gold/50 uppercase tracking-widest">Order: {faq.sort_order}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${faq.is_active ? 'text-emerald-500' : 'text-text-dim'}`}>
                          {faq.is_active ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => { setEditItem(faq); setForm(faq); setShowForm(true); }} 
                        className="btn btn-secondary btn-sm"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(faq.id)} 
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {catFaqs.length === 0 && (
                  <div className="p-8 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-text-dim gap-2">
                    <span className="text-xs font-medium uppercase tracking-widest italic">No questions curated in this domain</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Premium Entry Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editItem ? 'Refine Knowledge Entry' : 'New Knowledge Entry'}</h2>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest">Expert Systems & Documentation</p>
              </div>
              <button onClick={() => setShowForm(false)} className="modal-close">
                <Plus className="rotate-45" size={28} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-body space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8 space-y-6">
                  <div className="form-group">
                    <label className="form-label">The Question</label>
                    <input 
                      required 
                      className="form-input text-lg font-bold" 
                      value={form.question} 
                      onChange={e => setForm({...form, question: e.target.value})} 
                      placeholder="e.g. What are the requirements for a Tier 4 Visa?"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-gold/70">The Official Answer</label>
                    <textarea 
                      rows={8} 
                      required 
                      className="form-textarea text-base leading-relaxed" 
                      value={form.answer} 
                      onChange={e => setForm({...form, answer: e.target.value})} 
                      placeholder="Provide a clear, concise answer for the student..."
                    />
                  </div>
                </div>

                <div className="md:col-span-4 space-y-6">
                  <div className="card glass p-6 space-y-6">
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em]">Contextual Logic</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Domain Category</label>
                      <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="form-select">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Priority Order</label>
                      <input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})} className="form-input" placeholder="0" />
                      <p className="text-[10px] text-text-dim mt-2 uppercase tracking-tighter italic">Lower numbers appear first</p>
                    </div>

                    <div className="divider" />
                    
                    <div className="space-y-4">
                      <PublishToggle isPublished={form.is_active} onChange={val => setForm({...form, is_active: val})} />
                      <p className="text-[10px] text-text-muted italic leading-tight">Inactive entries are saved but hidden from the public website.</p>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-lg">Discard Entry</button>
              <button onClick={handleSave} className="btn btn-primary btn-lg shadow-gold min-w-[200px]">
                {editItem ? 'Update Entry' : 'Add to Knowledge Base'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
