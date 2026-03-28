'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import styles from './settings.module.css';

const SETTINGS_SECTIONS = [
  { href: '/settings', label: 'General', icon: '⚙️', desc: 'CRM name, timezone, branding', superOnly: false },
  { href: '/settings/users', label: 'User Management', icon: '👥', desc: 'Add users, assign roles and offices', superOnly: true },
  { href: '/settings/offices', label: 'Office Management', icon: '🏢', desc: 'Manage your office locations', superOnly: true },
  { href: '/settings/permissions', label: 'Permissions', icon: '🔐', desc: 'Configure role-based access control', superOnly: true },
];

export default function SettingsPage() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*, offices(*)').eq('id', session.user.id).single();
      setUser(u);
    };
    init();
  }, []);

  const superAdmin = isSuperAdmin(user?.role);
  const visibleSections = SETTINGS_SECTIONS.filter(s => !s.superOnly || superAdmin);

  return (
    <div>
      <div className="mb-24">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your CRM workspace</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {visibleSections.map(section => (
          <Link key={section.href} href={section.href} className="card" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{section.icon}</div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-white)', marginBottom: '6px' }}>
              {section.label}
            </h3>
            <p className="text-sm text-muted">{section.desc}</p>
            <div style={{ marginTop: '16px', color: 'var(--color-gold)', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Open →
            </div>
          </Link>
        ))}
      </div>

      {/* Account Info */}
      <div className="card mt-24">
        <h3 className="section-title mb-16">Your Account</h3>
        <div className="grid-2" style={{ gap: '16px' }}>
          <div>
            <p className="text-sm text-muted mb-4">Full Name</p>
            <p className="font-semibold">{user?.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-4">Email</p>
            <p className="font-semibold">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-4">Role</p>
            <p className="font-semibold">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-4">Office</p>
            <p className="font-semibold">{user?.offices?.name || 'All Offices'}</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-4">Phone</p>
            <p className="font-semibold">{user?.phone || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-4">Account Status</p>
            <span className={`badge ${user?.is_active ? 'badge-success' : 'badge-danger'}`}>
              {user?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
