'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import styles from './settings.module.css';

const SETTINGS_SECTIONS = [
  { href: '/settings/schedule', label: 'Work Schedule', icon: '📅', desc: 'Set your weekly hours and vacation days', superOnly: true },
  { href: '/settings/integrations', label: 'Integrations', icon: '🔌', desc: 'Manage Google Master Account and APIs', superOnly: true },
  { href: '/settings/promo-codes', label: 'Promo Codes', icon: '🎟️', desc: 'Manage discounts and special office offers', superOnly: true },
  { href: '/settings/general', label: 'General', icon: '⚙️', desc: 'CRM name, timezone, branding', superOnly: true },
  { href: '/settings/notifications', label: 'Notifications', icon: '🔔', desc: 'Enable/disable email alerts and triggers', superOnly: true },
  { href: '/settings/users', label: 'User Management', icon: '👥', desc: 'Add users, assign roles and offices', superOnly: true },
  { href: '/settings/offices', label: 'Office Management', icon: '🏢', desc: 'Manage your office locations', superOnly: true },
  { href: '/settings/permissions', label: 'Permissions', icon: '🔐', desc: 'Configure role-based access control', superOnly: true },
];

export default function SettingsPage() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [cropModalSrc, setCropModalSrc] = useState(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*, offices!users_office_id_fkey(*)').eq('id', session.user.id).single();
      setUser(u);
    };
    init();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropModalSrc(URL.createObjectURL(file));
    e.target.value = null; // reset input
  };

  const handleCropComplete = async (croppedBlob) => {
    if (!user) return;
    
    setCropModalSrc(null);
    const supabase = getSupabaseClient();
    const fileName = `${user.id}-${Date.now()}.jpg`;
    
    // Upload image directly using blob
    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, croppedBlob);
      
    if (error) {
      alert('Error uploading photo: ' + error.message);
      return;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
      
    // Update users table
    await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);
    setUser(prev => ({ ...prev, avatar_url: publicUrl }));
    
    // Notify
    alert('Photo uploaded successfully! Refresh the page to see changes across the app.');
  };

  const superAdmin = isSuperAdmin(user?.role);
  const visibleSections = SETTINGS_SECTIONS.filter(s => !s.superOnly || superAdmin);

  return (
    <div>
      {visibleSections.length > 0 && (
        <div className="mb-24">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your CRM workspace</p>
        </div>
      )}

      {visibleSections.length > 0 && (
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
      )}

      {/* Account Info */}
      <div className="card mt-24">
        <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <h3 className="section-title">Your Account</h3>
        </div>

        {/* Avatar Upload */}
        <div className="flex mb-24" style={{ gap: '20px', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ flexShrink: 0, width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--color-bg-dark)', border: '2px solid var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '2rem', color: 'var(--color-gold)' }}>{user?.full_name?.charAt(0)}</span>
            )}
          </div>
          <div>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              Upload Photo
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </label>
            <p className="text-xs text-muted mt-8">Square image recommended, max 2MB.</p>
          </div>
        </div>

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
