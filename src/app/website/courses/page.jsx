'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Plus, Edit, Trash2, GraduationCap, CheckCircle2, Search, Clock, DollarSign } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({
    title: '', description: '', price: '', duration: '', course_type: 'IELTS', instructor_name: '', is_active: true
  });

  const [websiteType, setWebsiteType] = useState('study-abroad');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type) setWebsiteType(type);
    fetchCourses(type || 'study-abroad');
  }, []);

  const fetchCourses = async (type = websiteType) => {
    const supabase = getSupabaseClient();
    try {
      const { data } = await supabase
        .from('website_courses')
        .select('*')
        .eq('website_type', type)
        .order('created_at', { ascending: false });
      setCourses(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    const payload = { ...form, website_type: websiteType };
    if (editItem) {
      await supabase.from('website_courses').update(payload).eq('id', editItem.id);
    } else {
      await supabase.from('website_courses').insert([payload]);
    }
    setShowForm(false);
    setEditItem(null);
    fetchCourses();
  };

  const deleteCourse = async (id) => {
    if (!confirm('Delete course?')) return;
    const supabase = getSupabaseClient();
    await supabase.from('website_courses').delete().eq('id', id);
    fetchCourses();
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || c.course_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? c.is_active : !c.is_active);
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="page-content space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <GraduationCap className="text-gold" />
            Language & Test Prep
          </h1>
          <p className="page-subtitle">Manage courses for IELTS, TOPIK, PTE, and other institutional training programs</p>
        </div>
        <button 
          onClick={() => { setForm({ title: '', description: '', price: '', duration: '', course_type: 'IELTS', instructor_name: '', is_active: true }); setEditItem(null); setShowForm(true); }}
          className="btn btn-primary btn-lg shadow-gold"
        >
          <Plus size={20} /> Launch New Course
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><GraduationCap size={24} /></div>
          <div className="kpi-value">{courses.length}</div>
          <div className="kpi-label">Total Courses</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><CheckCircle2 size={24} /></div>
          <div className="kpi-value">{courses.filter(c => c.is_active).length}</div>
          <div className="kpi-label">Active Batches</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><Search size={24} /></div>
          <div className="kpi-value">{[...new Set(courses.map(c => c.course_type))].length}</div>
          <div className="kpi-label">Test Categories</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="search-filter-bar card glass p-4">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text"
            placeholder="Search courses by title or instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select w-40"
          >
            <option value="all">All Types</option>
            <option value="IELTS">IELTS</option>
            <option value="TOPIK">TOPIK</option>
            <option value="PTE">PTE</option>
            <option value="Language">Language</option>
          </select>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-wrapper card p-0 overflow-hidden border-border">
        <table className="data-table">
          <thead>
            <tr>
              <th>Course Program</th>
              <th>Category</th>
              <th>Schedule & Fee</th>
              <th>Instructor</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex flex-col">
                    <span className="font-bold text-white leading-tight">{c.title}</span>
                    <span className="text-[10px] text-text-dim mt-1 line-clamp-1">{c.description}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${
                    c.course_type === 'IELTS' ? 'badge-info' : 
                    c.course_type === 'TOPIK' ? 'badge-purple' : 'badge-gold'
                  }`}>
                    {c.course_type}
                  </span>
                </td>
                <td>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Clock size={12} className="text-gold" /> {c.duration}
                    </span>
                    <span className="text-[10px] text-text-dim flex items-center gap-1 mt-1">
                      <DollarSign size={10} /> ${c.price || 'Free'}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="avatar avatar-sm">
                      {c.instructor_name?.charAt(0)}
                    </div>
                    <span className="text-sm text-text-muted">{c.instructor_name || 'Staff'}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${c.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {c.is_active ? 'Active' : 'Closed'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => { setEditItem(c); setForm(c); setShowForm(true); }} 
                      className="btn btn-secondary btn-sm"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => deleteCourse(c.id)} 
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

        {filteredCourses.length === 0 && (
          <div className="empty-state">
            <GraduationCap size={48} className="text-text-dim" />
            <h3>No Courses Registered</h3>
            <p>Ready to start training? Add your first course batch above.</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editItem ? 'Edit Course Program' : 'New Program Registration'}</h2>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest">Course & Enrollment Management</p>
              </div>
              <button onClick={() => setShowForm(false)} className="modal-close">
                <Plus className="rotate-45" size={28} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-body space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">Program Title</label>
                    <input 
                      required 
                      className="form-input" 
                      value={form.title} 
                      onChange={e => setForm({...form, title: e.target.value})} 
                      placeholder="e.g. IELTS Academic Masterclass"
                    />
                  </div>

                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">Course Category</label>
                      <select className="form-select" value={form.course_type} onChange={e => setForm({...form, course_type: e.target.value})}>
                        <option value="IELTS">IELTS Academic</option>
                        <option value="TOPIK">TOPIK (Korean)</option>
                        <option value="PTE">PTE Pearson</option>
                        <option value="JLPT">JLPT (Japanese)</option>
                        <option value="General">General English</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="form-select" value={form.is_active} onChange={e => setForm({...form, is_active: e.target.value === 'true'})}>
                        <option value="true">Active / Enrolling</option>
                        <option value="false">Inactive / Full</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">Course Duration</label>
                      <input className="form-input" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} placeholder="e.g. 12 Weeks" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tuition Fee ($)</label>
                      <input type="number" className="form-input" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0 for Free" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">Lead Instructor</label>
                    <input className="form-input" value={form.instructor_name} onChange={e => setForm({...form, instructor_name: e.target.value})} placeholder="Full name of trainer" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Program Description</label>
                    <textarea className="form-textarea" rows={6} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What will students learn in this program?" />
                  </div>
                </div>
              </div>
            </form>

            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-lg">Cancel</button>
              <button onClick={handleSave} className="btn btn-primary btn-lg shadow-gold min-w-[180px]">
                {editItem ? 'Save Updates' : 'Launch Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
