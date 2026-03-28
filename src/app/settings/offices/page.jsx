'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';

export default function OfficesPage() {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editOffice, setEditOffice] = useState(null);
  const [form, setForm] = useState({ name: '', country: '', city: '', address: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*, offices(*)').eq('id', session.user.id).single();
      setCurrentUser(u);
      await loadOffices();
    };
    init();
  }, []);

  const loadOffices = async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('offices').select('*, users!manager_id(full_name)').order('name');
    setOffices(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const supabase = getSupabaseClient();
    if (editOffice) {
      await supabase.from('offices').update(form).eq('id', editOffice.id);
    } else {
      await supabase.from('offices').insert(form);
    }
    setSaving(false);
    setShowForm(false);
    setEditOffice(null);
    loadOffices();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this office? This will affect users and students assigned to it.')) return;
    const supabase = getSupabaseClient();
    await supabase.from('offices').delete().eq('id', id);
    loadOffices();
  };

  const superAdmin = isSuperAdmin(currentUser?.role);

  const OFFICE_FLAGS = { Bangladesh: '🇧🇩', 'South Korea': '🇰🇷', 'Sri Lanka': '🇱🇰', Vietnam: '🇻🇳' };

  return (
    <div>
      <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Office Management</h1>
          <p className="page-subtitle">Manage GT Group office locations</p>
        </div>
        {superAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditOffice(null); setForm({ name: '', country: '', city: '', address: '', phone: '', email: '' }); setShowForm(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Office
          </button>
        )}
      </div>

      {loading ? <div className="empty-state"><div className="loading-spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {offices.map(office => (
            <div key={office.id} className="card">
              <div className="flex-between mb-12">
                <span style={{ fontSize: '2rem' }}>{OFFICE_FLAGS[office.country] || '🌍'}</span>
                {superAdmin && (
                  <div className="flex gap-4">
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditOffice(office); setForm({ name: office.name, country: office.country, city: office.city, address: office.address || '', phone: office.phone || '', email: office.email || '' }); setShowForm(true); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(office.id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-white)', marginBottom: '4px' }}>{office.name}</h3>
              <p className="text-sm text-muted mb-12">{office.city}, {office.country}</p>
              {office.address && <p className="text-sm text-muted mb-4">📍 {office.address}</p>}
              {office.phone && <p className="text-sm text-muted mb-4">📞 {office.phone}</p>}
              {office.email && <p className="text-sm text-muted mb-4">✉️ {office.email}</p>}
              {office.users && <p className="text-sm" style={{ color: 'var(--color-gold)' }}>👤 Manager: {office.users.full_name}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && superAdmin && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editOffice ? 'Edit Office' : 'Add Office'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Office Name *</label>
                    <input className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country *</label>
                    <input className="form-input" required value={form.country} onChange={e => setForm({...form, country: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input className="form-input" required value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Address</label>
                    <input className="form-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Office'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
