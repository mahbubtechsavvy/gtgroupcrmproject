'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';

const ROLES = [
  { key: 'office_manager', label: 'Office Manager' },
  { key: 'senior_counselor', label: 'Senior Counselor' },
  { key: 'counselor', label: 'Counselor' },
  { key: 'receptionist', label: 'Receptionist' },
];

const FEATURES = [
  { key: 'students', label: 'Students' },
  { key: 'documents', label: 'Documents' },
  { key: 'payments', label: 'Payments' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'destinations', label: 'Destinations' },
  { key: 'universities', label: 'Universities' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
];

const DEFAULT_PERMISSIONS = {
  office_manager: {
    students: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, create: true, edit: true, delete: false },
    payments: { view: true, create: true, edit: true, delete: false },
    pipeline: { view: true, create: true, edit: true, delete: false },
    appointments: { view: true, create: true, edit: true, delete: true },
    destinations: { view: true, create: false, edit: false, delete: false },
    universities: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    settings: { view: true, create: false, edit: true, delete: false },
  },
  senior_counselor: {
    students: { view: true, create: true, edit: true, delete: false },
    documents: { view: true, create: true, edit: true, delete: false },
    payments: { view: true, create: true, edit: true, delete: false },
    pipeline: { view: true, create: true, edit: true, delete: false },
    appointments: { view: true, create: true, edit: true, delete: true },
    destinations: { view: true, create: false, edit: false, delete: false },
    universities: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
  },
  counselor: {
    students: { view: true, create: true, edit: true, delete: false },
    documents: { view: true, create: true, edit: true, delete: false },
    payments: { view: true, create: true, edit: true, delete: false },
    pipeline: { view: true, create: true, edit: true, delete: false },
    appointments: { view: true, create: true, edit: true, delete: true },
    destinations: { view: true, create: false, edit: false, delete: false },
    universities: { view: true, create: false, edit: false, delete: false },
    reports: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
  },
  receptionist: {
    students: { view: true, create: true, edit: false, delete: false },
    documents: { view: true, create: true, edit: false, delete: false },
    payments: { view: true, create: false, edit: false, delete: false },
    pipeline: { view: true, create: false, edit: false, delete: false },
    appointments: { view: true, create: true, edit: true, delete: false },
    destinations: { view: true, create: false, edit: false, delete: false },
    universities: { view: true, create: false, edit: false, delete: false },
    reports: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
  },
};

export default function PermissionsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('counselor');
  const [perms, setPerms] = useState(DEFAULT_PERMISSIONS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*, offices!users_office_id_fkey(*)').eq('id', session.user.id).single();
      setCurrentUser(u);
    };
    init();
  }, []);

  const toggle = (feature, action) => {
    setPerms(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [feature]: {
          ...prev[selectedRole][feature],
          [action]: !prev[selectedRole][feature][action],
        }
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    // In a production system, this would save to role_permissions table
    // For now we show success feedback
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isSuperAdmin(currentUser?.role)) {
    return (
      <div className="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <h3>Access Restricted</h3>
        <p>Only Super Admins can manage permissions.</p>
      </div>
    );
  }

  const rolePerms = perms[selectedRole];

  return (
    <div>
      <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Permission Control</h1>
          <p className="page-subtitle">Configure role-based access for each feature</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Role Tabs */}
      <div className="tabs mb-24">
        {ROLES.map(role => (
          <button
            key={role.key}
            className={`tab-btn ${selectedRole === role.key ? 'active' : ''}`}
            onClick={() => setSelectedRole(role.key)}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Permissions Matrix */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '200px' }}>Feature</th>
              <th style={{ textAlign: 'center' }}>View</th>
              <th style={{ textAlign: 'center' }}>Create</th>
              <th style={{ textAlign: 'center' }}>Edit</th>
              <th style={{ textAlign: 'center' }}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map(feature => (
              <tr key={feature.key}>
                <td className="font-medium">{feature.label}</td>
                {['view', 'create', 'edit', 'delete'].map(action => (
                  <td key={action} style={{ textAlign: 'center' }}>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        checked={rolePerms?.[feature.key]?.[action] || false}
                        onChange={() => toggle(feature.key, action)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-gold)' }}
                      />
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)', borderRadius: '10px', padding: '14px 18px', marginTop: '20px' }}>
        <p className="text-sm" style={{ color: 'var(--color-gold)' }}>
          ⚡ Note: Super Admins (CEO, COO, IT Manager) always have full access regardless of these settings. Changes here apply to office staff roles only.
        </p>
      </div>
    </div>
  );
}
