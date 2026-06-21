'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { CheckCircle, XCircle, Star, Trash2, Quote } from 'lucide-react';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [websiteType, setWebsiteType] = useState('study-abroad');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type) setWebsiteType(type);
    fetchTestimonials(type || 'study-abroad');
  }, []);

  const fetchTestimonials = async (type = websiteType) => {
    const supabase = getSupabaseClient();
    try {
      const { data } = await supabase
        .from('testimonials')
        .select(`*, students (first_name, last_name, email)`)
        .eq('website_type', type)
        .order('created_at', { ascending: false });
      setTestimonials(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateTestimonial = async (id, updates) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('testimonials').update(updates).eq('id', id);
    if (!error) fetchTestimonials();
  };

  const deleteTestimonial = async (id) => {
    if (!confirm('Delete testimonial?')) return;
    const supabase = getSupabaseClient();
    await supabase.from('testimonials').delete().eq('id', id);
    fetchTestimonials();
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="page-content space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Quote className="text-gold" />
            Success Stories & Reviews
          </h1>
          <p className="page-subtitle">Moderate and feature student feedback to build trust and institutional credibility</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><Quote size={24} /></div>
          <div className="kpi-value">{testimonials.length}</div>
          <div className="kpi-label">Total Submissions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><CheckCircle size={24} /></div>
          <div className="kpi-value">{testimonials.filter(t => t.is_approved).length}</div>
          <div className="kpi-label">Approved Reviews</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><Star size={24} fill="currentColor" /></div>
          <div className="kpi-value">{testimonials.filter(t => t.is_featured).length}</div>
          <div className="kpi-label">Featured Highlights</div>
        </div>
      </div>

      {/* Modern Feedback Table */}
      <div className="table-wrapper card p-0 overflow-hidden border-border">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student Identity</th>
              <th>Review Content</th>
              <th>Satisfaction</th>
              <th>Moderation</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {testimonials.map((t) => (
              <tr key={t.id}>
                <td>
                  <div className="flex items-center gap-4">
                    <div className="avatar avatar-md rounded-full bg-surface-2 border border-gold/20 flex items-center justify-center font-bold text-gold">
                      {t.students?.first_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-gold transition-colors">
                        {t.students?.first_name} {t.students?.last_name}
                      </div>
                      <div className="text-[10px] text-text-dim mt-1">{t.students?.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="relative group">
                    <p className="text-xs text-text-muted italic leading-relaxed line-clamp-2 max-w-[400px]">
                      &quot;{t.content}&quot;
                    </p>
                    <div className="absolute inset-0 bg-surface-1/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-xs text-text border border-border pointer-events-none">
                      {t.content}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        fill={i < t.rating ? 'var(--gold)' : 'none'} 
                        className={i < t.rating ? 'text-gold' : 'text-charcoal'} 
                      />
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    <span className={`badge ${t.is_approved ? 'badge-success' : 'badge-warning'}`}>
                      {t.is_approved ? 'Approved' : 'Pending Review'}
                    </span>
                    {t.is_featured && (
                      <span className="badge badge-gold">
                        <Star size={10} fill="currentColor" /> Featured
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex gap-2 justify-end">
                    {!t.is_approved ? (
                      <button 
                        onClick={() => updateTestimonial(t.id, { is_approved: true })} 
                        className="btn btn-secondary btn-sm text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
                        title="Approve Review"
                      >
                        <CheckCircle size={14} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => updateTestimonial(t.id, { is_approved: false })} 
                        className="btn btn-secondary btn-sm text-warning border-warning/20 hover:bg-warning/10"
                        title="Move to Pending"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                    
                    <button 
                      onClick={() => updateTestimonial(t.id, { is_featured: !t.is_featured })} 
                      className={`btn btn-secondary btn-sm ${t.is_featured ? 'bg-gold/10 border-gold text-gold' : 'text-text-dim border-border'}`}
                      title={t.is_featured ? 'Remove from Highlights' : 'Mark as Highlight'}
                    >
                      <Star size={14} fill={t.is_featured ? 'currentColor' : 'none'} />
                    </button>

                    <button 
                      onClick={() => deleteTestimonial(t.id)} 
                      className="btn btn-danger btn-sm"
                      title="Delete Review"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {testimonials.length === 0 && (
          <div className="empty-state">
            <Quote size={48} className="text-text-dim" />
            <h3>No Feedback Received</h3>
            <p>Wait for students to share their experiences or manually import reviews.</p>
          </div>
        )}
      </div>
    </div>
  );
}
