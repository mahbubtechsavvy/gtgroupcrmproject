'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import { useUser } from '@/components/layout/AppLayout';

export default function PromoCodeSettings() {
  const user = useUser();
  const [promos, setPromos] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  
  const [form, setForm] = useState({
    code: '',
    discount_amount: '',
    discount_type: 'percentage',
    office_id: '',
    is_global: false,
    is_active: true,
    description: '',
  });

  const loadData = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data: p } = await supabase.from('promo_codes').select('*, offices(name)').order('created_at', { ascending: false });
    const { data: o } = await supabase.from('offices').select('*').order('name');
    setPromos(p || []);
    setOffices(o || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (p = null) => {
    if (p) {
      setEditingPromo(p);
      setForm({
        code: p.code,
        discount_amount: p.discount_amount,
        discount_type: p.discount_type,
        office_id: p.office_id || '',
        is_global: p.is_global,
        is_active: p.is_active,
        description: p.description || '',
      });
    } else {
      setEditingPromo(null);
      setForm({
        code: '',
        discount_amount: '',
        discount_type: 'percentage',
        office_id: '',
        is_global: false,
        is_active: true,
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const supabase = getSupabaseClient();
    const payload = {
      ...form,
      discount_amount: parseFloat(form.discount_amount),
      office_id: form.is_global ? null : (form.office_id || null),
      created_by: user.id,
    };

    let error;
    if (editingPromo) {
      const { error: err } = await supabase.from('promo_codes').update(payload).eq('id', editingPromo.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('promo_codes').insert(payload);
      error = err;
    }

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setShowModal(false);
      loadData();
    }
    setSaving(false);
  };

  const handleToggle = async (p) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('promo_codes').update({ is_active: !p.is_active }).eq('id', p.id);
    if (!error) loadData();
  };

  if (!isSuperAdmin(user?.role)) {
    return <div className="empty-state"><h3>Access Denied</h3><p>Only Super Admins can manage promo codes.</p></div>;
  }

  if (loading) return <div className="empty-state"><div className="loading-spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-32">
        <div>
          <h1 className="page-title">Promo Code Management</h1>
          <p className="page-subtitle">Generate discount codes for various offices and marketing campaigns</p>
        </div>
        <div className="flex gap-12">
          <Link href="/settings" className="btn btn-secondary">← Back</Link>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Create Promo Code</button>
        </div>
      </div>

      <div className="card scroll-x">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Code</th>
              <th>Discount</th>
              <th>Target Segment</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {promos.map(p => (
              <tr key={p.id}>
                <td>
                  <span className={`badge ${p.is_active ? 'badge-success' : 'badge-muted'}`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td><code className="font-bold" style={{ color: 'var(--color-gold)' }}>{p.code}</code></td>
                <td>{p.discount_amount}{p.discount_type === 'percentage' ? '%' : ' Fixed'}</td>
                <td>
                  {p.is_global ? (
                    <span className="badge badge-info">Global Access</span>
                  ) : (
                    <span>{p.offices?.name || 'Assigned Office'}</span>
                  )}
                </td>
                <td className="text-muted text-xs" style={{ maxWidth: '200px' }}>{p.description || '—'}</td>
                <td>
                  <div className="flex gap-8">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(p)}>
                      {p.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleOpenModal(p)}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3 className="section-title mb-20">{editingPromo ? 'Edit' : 'Create'} Promo Code</h3>
            <form onSubmit={handleSubmit} className="space-y-16">
              <div className="form-group">
                <label className="form-label">Reward Code</label>
                <input 
                  className="form-input" 
                  required 
                  placeholder="e.g. SUMMER2026" 
                  value={form.code} 
                  onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                />
              </div>
              
              <div className="grid-2 gap-12">
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select className="form-select" value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input className="form-input" type="number" required value={form.discount_amount} onChange={e => setForm({...form, discount_amount: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Scope</label>
                <div className="flex gap-20 mt-8">
                  <label className="flex gap-8 cursor-pointer align-center text-sm">
                    <input type="checkbox" checked={form.is_global} onChange={e => setForm({...form, is_global: e.target.checked})} />
                    Make Global Code
                  </label>
                </div>
              </div>

              {!form.is_global && (
                <div className="form-group">
                  <label className="form-label">Target Office</label>
                  <select className="form-select" required value={form.office_id} onChange={e => setForm({...form, office_id: e.target.value})}>
                    <option value="">Select Office...</option>
                    {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>

              <div className="flex gap-12 justify-end mt-24">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Processing...' : (editingPromo ? 'Update' : 'Create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 32px;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
