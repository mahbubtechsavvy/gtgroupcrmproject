'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import FlagIcon from '@/components/ui/FlagIcon';

const DEFAULT_DESTINATIONS = [
  { country_name: 'South Korea', flag_emoji: '🇰🇷' },
  { country_name: 'Japan', flag_emoji: '🇯🇵' },
  { country_name: 'China', flag_emoji: '🇨🇳' },
  { country_name: 'USA', flag_emoji: '🇺🇸' },
  { country_name: 'United Kingdom', flag_emoji: '🇬🇧' },
  { country_name: 'Australia', flag_emoji: '🇦🇺' },
  { country_name: 'Germany', flag_emoji: '🇩🇪' },
  { country_name: 'Finland', flag_emoji: '🇫🇮' },
];

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editDest, setEditDest] = useState(null);
  const [form, setForm] = useState({ country_name: '', flag_emoji: '', is_active: true, notes: '' });
  const [saving, setSaving] = useState(false);
  const [studentCounts, setStudentCounts] = useState({});

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*, offices!users_office_id_fkey(*)').eq('id', session.user.id).single();
      setUser(u);
      await loadDestinations();
      await loadCounts();
    };
    init();
  }, []);

  const loadDestinations = async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('destinations').select('*').order('country_name');
    setDestinations(data || []);
    setLoading(false);
  };

  const loadCounts = async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('students').select('target_destination_id');
    const counts = {};
    (data || []).forEach(s => {
      if (s.target_destination_id) counts[s.target_destination_id] = (counts[s.target_destination_id] || 0) + 1;
    });
    setStudentCounts(counts);
  };

  const superAdmin = isSuperAdmin(user?.role);

  const openCreate = () => {
    setEditDest(null);
    setForm({ country_name: '', flag_emoji: '', is_active: true, notes: '' });
    setShowForm(true);
  };

  const openEdit = (dest) => {
    setEditDest(dest);
    setForm({ country_name: dest.country_name, flag_emoji: dest.flag_emoji || '', is_active: dest.is_active, notes: dest.notes || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (editDest) {
      await supabase.from('destinations').update(form).eq('id', editDest.id);
    } else {
      await supabase.from('destinations').insert({ ...form, created_by: session?.user?.id });
    }
    setSaving(false);
    setShowForm(false);
    loadDestinations();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this destination? Students using it will lose their target destination.')) return;
    const supabase = getSupabaseClient();
    await supabase.from('destinations').delete().eq('id', id);
    loadDestinations();
  };

  const toggleActive = async (dest) => {
    const supabase = getSupabaseClient();
    await supabase.from('destinations').update({ is_active: !dest.is_active }).eq('id', dest.id);
    loadDestinations();
  };

  return (
    <div>
      <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Destinations</h1>
          <p className="page-subtitle">Manage study abroad destination countries</p>
        </div>
        {superAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Destination
          </button>
        )}
      </div>

      {!superAdmin && (
        <div style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-sm" style={{ color: 'var(--color-gold)' }}>
            Destinations are managed by Super Admins only. Contact your IT Manager to add or edit destinations.
          </p>
        </div>
      )}

      {loading ? (
        <div className="empty-state"><div className="loading-spinner" /></div>
      ) : destinations.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"/>
          </svg>
          <h3>No destinations yet</h3>
          {superAdmin && <button className="btn btn-primary mt-16" onClick={openCreate}>Add Destination</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {destinations.map(dest => (
            <div key={dest.id} className="card" style={{ opacity: dest.is_active ? 1 : 0.6 }}>
              <div className="flex-between mb-12">
                {/* SVG flag with emoji fallback via FlagIcon */}
                <div>
                  <FlagIcon destination={dest} size="lg" />
                </div>
                <div className="flex gap-8" style={{ alignItems: 'center' }}>
                  <span className={`badge ${dest.is_active ? 'badge-success' : 'badge-muted'}`}>
                    {dest.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {superAdmin && (
                    <div className="flex gap-4">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(dest)} title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(dest.id)} title="Delete" style={{ color: 'var(--color-danger)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-white)', marginBottom: '8px' }}>
                {dest.country_name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                <span className="text-sm text-muted">
                  {studentCounts[dest.id] || 0} students
                </span>
                {superAdmin && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => toggleActive(dest)}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {dest.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
              {dest.notes && <p className="text-xs text-muted mt-8">{dest.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && superAdmin && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editDest ? 'Edit Destination' : 'Add Destination'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Country Name *</label>
                    <input className="form-input" required placeholder="e.g. South Korea" value={form.country_name}
                      onChange={e => setForm({...form, country_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Flag Emoji</label>
                    <input className="form-input" placeholder="🇰🇷" value={form.flag_emoji}
                      onChange={e => setForm({...form, flag_emoji: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" placeholder="Optional notes about this destination..." value={form.notes}
                    onChange={e => setForm({...form, notes: e.target.value})} style={{ minHeight: '80px' }} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
                    <span className="form-label" style={{ margin: 0 }}>Active (available for student profiles)</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editDest ? 'Update' : 'Add Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
