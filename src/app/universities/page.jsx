'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editUni, setEditUni] = useState(null);
  const [selectedUni, setSelectedUni] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [filterDest, setFilterDest] = useState('');
  const [form, setForm] = useState({
    name: '', destination_id: '', city: '', ranking: '', website: ''
  });
  const [progForm, setProgForm] = useState({
    name: '', degree_level: 'Bachelor', tuition_fee: '', currency: 'USD',
    duration_years: '', requirements: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*, offices(*)').eq('id', session.user.id).single();
      setUser(u);

      const { data: dests } = await supabase.from('destinations').select('*').eq('is_active', true).order('country_name');
      setDestinations(dests || []);
      await loadUniversities();
    };
    init();
  }, []);

  const loadUniversities = async (destFilter) => {
    const supabase = getSupabaseClient();
    let q = supabase.from('universities').select('*, destinations(id, country_name, flag_emoji)').order('name');
    if (destFilter) q = q.eq('destination_id', destFilter);
    const { data } = await q;
    setUniversities(data || []);
    setLoading(false);
  };

  const loadPrograms = async (uniId) => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('programs').select('*').eq('university_id', uniId).order('name');
    setPrograms(data || []);
  };

  const superAdmin = isSuperAdmin(user?.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const supabase = getSupabaseClient();
    const payload = { ...form, ranking: form.ranking ? parseInt(form.ranking) : null };

    if (editUni) {
      await supabase.from('universities').update(payload).eq('id', editUni.id);
    } else {
      await supabase.from('universities').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    loadUniversities(filterDest);
  };

  const handleProgSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const supabase = getSupabaseClient();
    await supabase.from('programs').insert({
      ...progForm,
      university_id: selectedUni.id,
      tuition_fee: progForm.tuition_fee ? parseFloat(progForm.tuition_fee) : null,
      duration_years: progForm.duration_years ? parseFloat(progForm.duration_years) : null,
    });
    setSaving(false);
    setShowProgramForm(false);
    loadPrograms(selectedUni.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this university?')) return;
    const supabase = getSupabaseClient();
    await supabase.from('universities').delete().eq('id', id);
    loadUniversities(filterDest);
  };

  const selectUniversity = (uni) => {
    setSelectedUni(uni);
    loadPrograms(uni.id);
  };

  return (
    <div>
      <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Universities & Programs</h1>
          <p className="page-subtitle">Manage partner universities and their programs</p>
        </div>
        {superAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditUni(null); setForm({ name: '', destination_id: '', city: '', ranking: '', website: '' }); setShowForm(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add University
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="search-filter-bar mb-20">
        <select className="form-select" style={{ width: 'auto' }} value={filterDest}
          onChange={e => { setFilterDest(e.target.value); loadUniversities(e.target.value); }}>
          <option value="">All Destinations</option>
          {destinations.map(d => <option key={d.id} value={d.id}>{d.flag_emoji} {d.country_name}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedUni ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {/* University List */}
        <div>
          {loading ? (
            <div className="empty-state"><div className="loading-spinner" /></div>
          ) : universities.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <h3>No universities yet</h3>
              {superAdmin && <button className="btn btn-primary mt-16" onClick={() => setShowForm(true)}>Add University</button>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {universities.map(uni => (
                <div
                  key={uni.id}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    borderColor: selectedUni?.id === uni.id ? 'var(--color-gold)' : undefined,
                    transition: 'all 0.15s'
                  }}
                  onClick={() => selectUniversity(uni)}
                >
                  <div className="flex-between" style={{ flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-white)', marginBottom: '4px' }}>{uni.name}</h3>
                      <p className="text-sm text-muted">
                        {uni.destinations?.flag_emoji} {uni.destinations?.country_name}
                        {uni.city ? ` · ${uni.city}` : ''}
                        {uni.ranking ? ` · Rank #${uni.ranking}` : ''}
                      </p>
                    </div>
                    {superAdmin && (
                      <div className="flex gap-4" onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditUni(uni); setForm({ name: uni.name, destination_id: uni.destination_id, city: uni.city || '', ranking: uni.ranking || '', website: uni.website || '' }); setShowForm(true); }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(uni.id)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Programs Panel */}
        {selectedUni && (
          <div>
            <div className="flex-between mb-16">
              <h3 className="section-title">Programs at {selectedUni.name}</h3>
              <div className="flex gap-8">
                {superAdmin && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowProgramForm(true)}>+ Add Program</button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedUni(null)}>✕</button>
              </div>
            </div>

            {programs.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <p>No programs added yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {programs.map(prog => (
                  <div key={prog.id} className="card" style={{ padding: '14px 16px' }}>
                    <div className="flex-between mb-4">
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-white)' }}>{prog.name}</p>
                      <span className="badge badge-muted">{prog.degree_level}</span>
                    </div>
                    <p className="text-xs text-muted">
                      {prog.tuition_fee ? `${prog.currency} ${prog.tuition_fee?.toLocaleString()} · ` : ''}
                      {prog.duration_years ? `${prog.duration_years} years` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* University Form Modal */}
      {showForm && superAdmin && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editUni ? 'Edit University' : 'Add University'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">University Name *</label>
                  <input className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Destination *</label>
                    <select className="form-select" required value={form.destination_id} onChange={e => setForm({...form, destination_id: e.target.value})}>
                      <option value="">Select destination...</option>
                      {destinations.map(d => <option key={d.id} value={d.id}>{d.flag_emoji} {d.country_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ranking</label>
                    <input className="form-input" type="number" min="1" value={form.ranking} onChange={e => setForm({...form, ranking: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input className="form-input" type="url" placeholder="https://" value={form.website} onChange={e => setForm({...form, website: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Program Form Modal */}
      {showProgramForm && superAdmin && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowProgramForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add Program — {selectedUni?.name}</h2>
              <button className="modal-close" onClick={() => setShowProgramForm(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleProgSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Program Name *</label>
                  <input className="form-input" required value={progForm.name} onChange={e => setProgForm({...progForm, name: e.target.value})} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Degree Level</label>
                    <select className="form-select" value={progForm.degree_level} onChange={e => setProgForm({...progForm, degree_level: e.target.value})}>
                      {['Bachelor', 'Master', 'PhD', 'Diploma', 'Language'].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (years)</label>
                    <input className="form-input" type="number" step="0.5" min="0.5" value={progForm.duration_years} onChange={e => setProgForm({...progForm, duration_years: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <select className="form-select" value={progForm.currency} onChange={e => setProgForm({...progForm, currency: e.target.value})}>
                      {['USD', 'KRW', 'GBP', 'AUD', 'EUR', 'CNY', 'JPY', 'BDT'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Annual Tuition Fee</label>
                    <input className="form-input" type="number" value={progForm.tuition_fee} onChange={e => setProgForm({...progForm, tuition_fee: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Entry Requirements</label>
                  <textarea className="form-textarea" value={progForm.requirements} onChange={e => setProgForm({...progForm, requirements: e.target.value})} style={{ minHeight: '80px' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProgramForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Program'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
