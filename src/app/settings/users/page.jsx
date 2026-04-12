'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin, getRoleLabel } from '@/lib/auth';
import { initiateGmailOAuthForEmailAccount } from '@/lib/googleOAuth';
import ImageCropperModal from '@/components/ui/ImageCropperModal';

const ROLES = ['ceo', 'coo', 'it_manager', 'office_manager', 'senior_counselor', 'counselor', 'receptionist'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'counselor', office_id: '', phone: '', password: '', crm_email: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [cropModalSrc, setCropModalSrc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const [filterOffice, setFilterOffice] = useState('');
  const [emailAccounts, setEmailAccounts] = useState([]); // [{ id, email, email_type, is_primary, oauth_token }]
  const [loadingEmails, setLoadingEmails] = useState(false);

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

  const loadEmailAccounts = async (userId) => {
    if (!userId) return;
    setLoadingEmails(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/emails`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok && data.accounts) {
        // Map account_type to email_type for UI compatibility
        const mappedAccounts = data.accounts.map(acc => ({
          ...acc,
          email_type: acc.account_type || acc.email_type
        }));
        setEmailAccounts(mappedAccounts);
      }
    } catch (error) {
      console.error('Error loading emails:', error);
    }
    setLoadingEmails(false);
  };

  const handleAddCrmEmail = async () => {
    if (!form.crm_email || !editUser) return;
    try {
      const response = await fetch(`/api/admin/users/${editUser.id}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.crm_email, emailType: 'crm' }),
      });
      const data = await response.json();
      if (response.ok) {
        setForm({ ...form, crm_email: '' });
        loadEmailAccounts(editUser.id);
        alert('CRM Email added successfully');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error adding CRM email: ' + error.message);
    }
  };

  const handleRemoveEmail = async (accountId) => {
    if (!editUser || !confirm('Remove this email address?')) return;
    try {
      const response = await fetch(`/api/admin/users/${editUser.id}/emails/${accountId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        loadEmailAccounts(editUser.id);
        alert('Email removed successfully');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error removing email: ' + error.message);
    }
  };

  const handleSetPrimaryEmail = async (accountId) => {
    if (!editUser) return;
    try {
      const response = await fetch(`/api/admin/users/${editUser.id}/emails/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimary: true }),
      });
      if (response.ok) {
        loadEmailAccounts(editUser.id);
        alert('Primary email updated');
      } else {
        const data = await response.json();
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleConnectGmail = () => {
    if (!editUser) return;
    const authUrl = initiateGmailOAuthForEmailAccount(editUser.id);
    window.location.href = authUrl;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropModalSrc(URL.createObjectURL(file));
    e.target.value = null; // reset input
  };

  const handleCropComplete = (croppedBlob) => {
    const file = new File([croppedBlob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(croppedBlob));
    setCropModalSrc(null);
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
      let avatar_url = null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const fileName = `${authData.user.id}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatar_url = publicUrl;
        }
      }

      await supabase.from('users').insert({
        id: authData.user.id,
        full_name: form.full_name,
        email: form.email,
        role: form.role,
        office_id: form.office_id || null,
        phone: form.phone || null,
        avatar_url: avatar_url,
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

    let avatar_url = editUser.avatar_url;
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const fileName = `${editUser.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatar_url = publicUrl;
      }
    }

    await supabase.from('users').update({
      full_name: form.full_name,
      email: emailChanged ? form.email : editUser.email,
      role: form.role,
      office_id: form.office_id || null,
      phone: form.phone || null,
      avatar_url: avatar_url
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
    setForm({ full_name: user.full_name, email: user.email, role: user.role, office_id: user.office_id || '', phone: user.phone || '', password: '', crm_email: '' });
    setAvatarFile(null);
    setAvatarPreview(user.avatar_url || null);
    setShowForm(true);
    loadEmailAccounts(user.id);
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
      <div className="mb-16">
        <Link href="/settings" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Settings
        </Link>
      </div>

      <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{users.length} users registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditUser(null); setForm({ full_name: '', email: '', role: 'counselor', office_id: '', phone: '', password: '', crm_email: '' }); setAvatarFile(null); setAvatarPreview(null); setShowForm(true); setEmailAccounts([]); }}>
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
                      <div className="avatar avatar-sm flex-none overflow-hidden" style={{ borderRadius: '50%' }}>
                        {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                              {u.full_name?.charAt(0)?.toUpperCase()}
                            </span>
                        )}
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
              <button className="modal-close" onClick={() => { setShowForm(false); setEditUser(null); setEmailAccounts([]); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={editUser ? handleUpdateUser : handleCreateUser}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                    <label className="form-label mb-8" style={{ alignSelf: 'flex-start' }}>Profile Photo</label>
                    <label style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--color-bg-dark)', border: '2px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      )}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                    </label>
                    <p className="text-xs text-muted mt-8">Click to select photo</p>
                  </div>
                  
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

                  {/* Email Management Section - Only show when editing */}
                  {editUser && (
                    <div style={{ gridColumn: '1 / -1', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
                      <h3 className="text-sm font-semibold mb-16" style={{ color: 'var(--color-white)' }}>📧 Email Accounts</h3>
                      
                      {/* Current Email Accounts */}
                      {loadingEmails ? (
                        <p className="text-sm text-muted">Loading...</p>
                      ) : emailAccounts.length > 0 ? (
                        <div style={{ marginBottom: '20px' }}>
                          {emailAccounts.map(acc => (
                            <div key={acc.id} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: '12px',
                              backgroundColor: 'var(--color-bg-dark)',
                              borderRadius: '6px',
                              marginBottom: '8px',
                              border: acc.is_primary ? '1px solid var(--color-gold)' : '1px solid var(--color-border)'
                            }}>
                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--color-white)' }}>{acc.email}</p>
                                <p className="text-xs text-muted">
                                  {acc.email_type === 'crm' ? '💼 CRM Email' : '📨 Gmail'} 
                                  {acc.is_primary ? ' • Primary' : ''}
                                </p>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {!acc.is_primary && (
                                  <button 
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    style={{ fontSize: '12px' }}
                                    onClick={() => handleSetPrimaryEmail(acc.id)}
                                  >
                                    Set Primary
                                  </button>
                                )}
                                {acc.email_type !== 'crm' && (
                                  <button 
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    style={{ fontSize: '12px' }}
                                    onClick={() => handleRemoveEmail(acc.id)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted mb-16">No email accounts added yet</p>
                      )}

                      {/* Add CRM Email */}
                      {!emailAccounts.find(e => e.email_type === 'crm') && (
                        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--color-bg-dark)', borderRadius: '6px', borderLeft: '3px solid var(--color-gold)' }}>
                          <label className="form-label mb-8" style={{ fontSize: '12px' }}>Add CRM Email (System Email)</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                              type="email"
                              className="form-input"
                              style={{ flex: 1 }}
                              placeholder="e.g., john@gtgroup.com"
                              value={form.crm_email}
                              onChange={e => setForm({...form, crm_email: e.target.value})}
                            />
                            <button 
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={handleAddCrmEmail}
                              disabled={!form.crm_email}
                            >
                              Add
                            </button>
                          </div>
                          <p className="text-xs text-muted mt-6">System email for official notifications and documents</p>
                        </div>
                      )}

                      {/* Connect Gmail */}
                      {!emailAccounts.find(e => e.email_type === 'gmail') && (
                        <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-dark)', borderRadius: '6px', borderLeft: '3px solid #4285F4' }}>
                          <label className="form-label mb-8" style={{ fontSize: '12px' }}>Add Gmail Account (Optional)</label>
                          <button 
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={handleConnectGmail}
                            style={{ width: '100%' }}
                          >
                            🔗 Connect Gmail
                          </button>
                          <p className="text-xs text-muted mt-6">Used for calendar invites and external communications</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditUser(null); setEmailAccounts([]); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {cropModalSrc && (
        <ImageCropperModal
          imageSrc={cropModalSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropModalSrc(null)}
        />
      )}
    </div>
  );
}
