'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin, getRoleLabel } from '@/lib/auth';

const ROLES = ['ceo', 'coo', 'it_manager', 'office_manager', 'senior_counselor', 'counselor', 'receptionist'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'counselor', office_id: '', phone: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const [filterOffice, setFilterOffice] = useState('');

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*, offices!users_office_id_fkey(*)').eq('id', session.user.id).single();
      setCurrentUser(u);
      if (!isSuperAdmin(u?.role)) return;

      const { data: offData } = await supabase.from('offices').select('id, name').order('name');
      setOffices(offData || []);
      await loadUsers();
    };
    init();
  }, []);

  const loadUsers = async () => {
    const supabase = getSupabaseClient();
    let q = supabase.from('users').select('*, offices!users_office_id_fkey(id, name)').order('full_name');
    if (filterRole) q = q.eq('role', filterRole);
    if (filterOffice) q = q.eq('office_id', filterOffice);
    const { data } = await q;
    setUsers(data || []);
    setLoading(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    const supabase = getSupabaseClient();

    // Create auth user via admin API (needs service role - we'll use signup)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: `${window.location.origin}/login` }
    });

    if (authError) { alert('Error creating user: ' + authError.message); setSaving(false); return; }

    if (authData.user) {
      await supabase.from('users').insert({
        id: authData.user.id,
        full_name: form.full_name,
        email: form.email,
        role: form.role,
        office_id: form.office_id || null,
        phone: form.phone || null,
        is_active: true,
      });
    }

    setSaving(false);
    setShowForm(false);
    loadUsers();
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    const supabase = getSupabaseClient();
    
    // Check if email or password changed
    let emailChanged = form.email && form.email !== editUser.email;
    let passwordChanged = !!form.password;

    if (emailChanged || passwordChanged) {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          email: emailChanged ? form.email : undefined,
          password: passwordChanged ? form.password : undefined
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert('Failed to update login credentials: ' + (errorData.error || 'Unknown error'));
        setSaving(false);
        return;
      }
    }

    await supabase.from('users').update({
      full_name: form.full_name,
      role: form.role,
      office_id: form.office_id || null,
      phone: form.phone || null,
    }).eq('id', editUser.id);
    
    setSaving(false);
    setShowForm(false);
    setEditUser(null);
    loadUsers();
  };

  const toggleActive = async (user) => {
    const supabase = getSupabaseClient();
    await supabase.from('users').update({ is_active: !user.is_active }).eq('id', user.id);
    loadUsers();
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ full_name: user.full_name, email: user.email, role: user.role, office_id: user.office_id || '', phone: user.phone || '', password: '' });
    setShowForm(true);
  };

  if (!isSuperAdmin(currentUser?.role)) {
    return (
      <div className="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <h3>Access Restricted</h3>
        <p>Only Super Admins can manage users.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{users.length} users registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditUser(null); setForm({ full_name: '', email: '', role: 'counselor', office_id: '', phone: '', password: '' }); setShowForm(true); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="search-filter-bar mb-20">
        <select className="form-select" style={{ width: 'auto' }} value={filterRole} onChange={e => { setFilterRole(e.target.value); loadUsers(); }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={filterOffice} onChange={e => { setFilterOffice(e.target.value); loadUsers(); }}>
          <option value="">All Offices</option>
          {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="empty-state"><div className="loading-spinner" /></div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th><th>Role</th><th>Office</th><th>Phone</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex gap-12" style={{ alignItems: 'center' }}>
                      <div className="avatar avatar-sm">
                        {u.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--color-white)' }}>{u.full_name}</p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${isSuperAdmin(u.role) ? 'badge-gold' : 'badge-muted'}`}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td className="text-sm text-muted">{u.offices?.name || '—'}</td>
                  <td className="text-sm text-muted">{u.phone || '—'}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-4">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)} title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => toggleActive(u)}
                          title={u.is_active ? 'Deactivate' : 'Activate'}
                          style={{ color: u.is_active ? 'var(--color-danger)' : 'var(--color-success)' }}
                        >
                          {u.is_active ? '⏸' : '▶'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editUser ? 'Edit User' : 'Add User'}</h2>
              <button className="modal-close" onClick={() => { setShowForm(false); setEditUser(null); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={editUser ? handleUpdateUser : handleCreateUser}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password {editUser ? '' : '*'}</label>
                    <input 
                      className="form-input" 
                      type="password" 
                      required={!editUser} 
                      minLength={8} 
                      value={form.password} 
                      onChange={e => setForm({...form, password: e.target.value})} 
                      placeholder={editUser ? "Leave blank to keep current password" : "Min 8 characters"} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select className="form-select" required value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                      {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Office</label>
                    <select className="form-select" value={form.office_id} onChange={e => setForm({...form, office_id: e.target.value})}>
                      <option value="">No office (Super Admin)</option>
                      {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditUser(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
