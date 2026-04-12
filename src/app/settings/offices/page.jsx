'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/auth';
import { getCountryFlagPath, getCountryFlagEmoji } from '@/lib/flagMapping';

// Countries list — emoji used only inside <select><option> (HTML limitation)
const COMMON_COUNTRIES = [
  { name: 'Bangladesh',  flag: '🇧🇩' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'Sri Lanka',   flag: '🇱🇰' },
  { name: 'Vietnam',     flag: '🇻🇳' },
  { name: 'India',       flag: '🇮🇳' },
  { name: 'Nepal',       flag: '🇳🇵' },
  { name: 'UK',          flag: '🇬🇧' },
  { name: 'USA',         flag: '🇺🇸' },
  { name: 'Canada',      flag: '🇨🇦' },
  { name: 'Australia',   flag: '🇦🇺' },
  { name: 'Malaysia',    flag: '🇲🇾' },
  { name: 'Japan',       flag: '🇯🇵' },
  { name: 'China',       flag: '🇨🇳' },
  { name: 'Germany',     flag: '🇩🇪' },
  { name: 'Other',       flag: '🌍' }
];

/** Renders a country flag: SVG image with emoji text fallback. */
function CountryFlag({ country, size = 32 }) {
  const [imgError, setImgError] = useState(false);
  const svgPath = getCountryFlagPath(country);
  const emoji   = getCountryFlagEmoji(country);

  if (svgPath && !imgError) {
    return (
      <img
        src={svgPath}
        alt={`${country} flag`}
        width={size}
        height={Math.round(size * 0.66)}
        style={{ borderRadius: 4, objectFit: 'cover', display: 'block', flexShrink: 0 }}
        onError={() => setImgError(true)}
      />
    );
  }
  // Fallback: emoji
  return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>{emoji || '🌍'}</span>;
}

export default function OfficesPage() {
  const [offices,      setOffices]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [currentUser,  setCurrentUser]  = useState(null);
  const [showForm,     setShowForm]     = useState(false);
  const [editOffice,   setEditOffice]   = useState(null);
  const [form,         setForm]         = useState({ name: '', country: '', custom_country: '', city: '', address: '', phone: '', email: '' });
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*, offices!users_office_id_fkey(*)').eq('id', session.user.id).single();
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

    const finalCountry = form.country === 'Other' ? form.custom_country : form.country;
    const payload = {
      name:    form.name,
      country: finalCountry,
      city:    form.city,
      address: form.address || null,
      phone:   form.phone   || null,
      email:   form.email   || null,
    };

    if (editOffice) {
      await supabase.from('offices').update(payload).eq('id', editOffice.id);
    } else {
      await supabase.from('offices').insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    setEditOffice(null);
    loadOffices();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this office? This will sever affiliations for users and students previously assigned to it.')) return;
    const supabase = getSupabaseClient();
    await supabase.from('offices').delete().eq('id', id);
    loadOffices();
  };

  const superAdmin = isSuperAdmin(currentUser?.role);

  const groupedOffices = offices.reduce((acc, office) => {
    acc[office.country] = acc[office.country] || [];
    acc[office.country].push(office);
    return acc;
  }, {});

  const sortedCountries = Object.keys(groupedOffices).sort();

  return (
    <div>
      <div className="mb-16">
        <Link href="/settings" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Settings
        </Link>
      </div>

      <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Office Management</h1>
          <p className="page-subtitle">Grouped active GT Group branch locations</p>
        </div>
        {superAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditOffice(null); setForm({ name: '', country: 'Bangladesh', custom_country: '', city: '', address: '', phone: '', email: '' }); setShowForm(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Office
          </button>
        )}
      </div>

      {loading ? <div className="empty-state"><div className="loading-spinner" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {sortedCountries.length === 0 && (
            <div className="empty-state">
              <p>No offices have been added yet.</p>
            </div>
          )}

          {sortedCountries.map(country => (
            <div key={country} className="office-country-group">
              {/* Country Header — SVG flag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                <CountryFlag country={country} size={36} />
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-gold)' }}>{country}</h2>
                <span className="badge badge-muted ml-auto">{groupedOffices[country].length} Branches</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {groupedOffices[country].map(office => (
                  <div key={office.id} className="card" style={{ borderTop: '3px solid var(--color-gold)' }}>
                    <div className="flex-between mb-12">
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-white)' }}>{office.name}</h3>
                      {superAdmin && (
                        <div className="flex gap-4">
                          <button className="btn btn-ghost btn-sm" onClick={() => {
                            const isCommon = COMMON_COUNTRIES.some(c => c.name === office.country);
                            setEditOffice(office);
                            setForm({
                              name:           office.name,
                              country:        isCommon ? office.country : 'Other',
                              custom_country: isCommon ? '' : office.country,
                              city:           office.city,
                              address:        office.address || '',
                              phone:          office.phone   || '',
                              email:          office.email   || ''
                            });
                            setShowForm(true);
                          }}>
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
                    <p className="text-sm text-muted mb-12">🏢 City: {office.city}</p>
                    {office.address && <p className="text-sm text-muted mb-4">📍 {office.address}</p>}
                    {office.phone   && <p className="text-sm text-muted mb-4">📞 {office.phone}</p>}
                    {office.email   && <p className="text-sm text-muted mb-4">✉️ {office.email}</p>}
                    {office.users   && <p className="text-sm mt-12" style={{ color: 'var(--color-success)', background: 'var(--color-bg-dark)', padding: '6px 10px', borderRadius: '6px' }}>👤 Manager: {office.users.full_name}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && superAdmin && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editOffice ? 'Edit Office' : 'Add New Branch'}</h2>
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
                    <label className="form-label">Branch Name *</label>
                    <input className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. GT Group Sylhet" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Country *</label>
                    <select className="form-select" required value={form.country} onChange={e => setForm({...form, country: e.target.value})}>
                      <option value="">Select Country</option>
                      {COMMON_COUNTRIES.map(c => (
                        <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input className="form-input" required value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="e.g. Seoul" />
                  </div>

                  {form.country === 'Other' && (
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Custom Country Name *</label>
                      <input className="form-input" required value={form.custom_country} onChange={e => setForm({...form, custom_country: e.target.value})} placeholder="Enter country name" />
                    </div>
                  )}

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Full Local Address</label>
                    <input className="form-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch Phone</label>
                    <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch Email</label>
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
