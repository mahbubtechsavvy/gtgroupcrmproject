'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import { User, Mail, Shield, MapPin, Phone, CheckCircle2, Edit3, X, Save, Camera, Building2, Globe } from 'lucide-react';
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
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [cropModalSrc, setCropModalSrc] = useState(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*, offices!users_office_id_fkey(*)').eq('id', session.user.id).single();
      setUser(u);
      setFormData({ full_name: u.full_name || '', phone: u.phone || '' });
    };
    init();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropModalSrc(URL.createObjectURL(file));
    e.target.value = null;
  };

  const handleCropComplete = async (croppedBlob) => {
    if (!user) return;
    setCropModalSrc(null);
    const supabase = getSupabaseClient();
    const fileName = `${user.id}-${Date.now()}.jpg`;
    
    setSaving(true);
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, croppedBlob);
      
    if (uploadError) {
      alert('Error uploading photo: ' + uploadError.message);
      setSaving(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
      
    await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);
    setUser(prev => ({ ...prev, avatar_url: publicUrl }));
    setSaving(false);
    alert('Profile picture updated!');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('users')
      .update({ 
        full_name: formData.full_name,
        phone: formData.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      alert('Update failed: ' + error.message);
    } else {
      setUser(prev => ({ ...prev, full_name: formData.full_name, phone: formData.phone }));
      setEditMode(false);
      alert('Profile updated successfully!');
    }
    setSaving(false);
  };

  const superAdmin = isSuperAdmin(user?.role);
  const visibleSections = SETTINGS_SECTIONS.filter(s => !s.superOnly || superAdmin);

  if (!user) return <div className="p-40 text-center"><div className="loading-spinner mx-auto" /></div>;

  return (
    <div className={styles.settingsContainer}>
      {/* Account Section - Top Priority */}
      <section className={styles.accountSection}>
        <div className={styles.accountHeader}>
          <div className={styles.accountTitleInfo}>
            <h2>Account Profile</h2>
            <p>Manage your personal information and credentials</p>
          </div>
          {!editMode ? (
            <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(true)}>
              <Edit3 size={16} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-8">
              <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)} disabled={saving}>
                <X size={16} /> Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleUpdateProfile} disabled={saving}>
                {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          )}
        </div>

        <div className={styles.profileGrid}>
          <div className={styles.avatarColumn}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatarInner}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" />
                ) : (
                  <span className={styles.avatarInitial}>{user.full_name?.charAt(0)}</span>
                )}
              </div>
            </div>
            <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', gap: '8px' }}>
              <Camera size={14} /> Change Photo
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </label>
            <p className="text-xs text-muted">Square JPG or PNG, max 2MB</p>
          </div>

          <div className={styles.infoColumn}>
            {!editMode ? (
              <>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}><User size={12} className="inline mr-4" /> Full Name</div>
                  <div className={styles.infoValue}>{user.full_name}</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}><Mail size={12} className="inline mr-4" /> Email Address</div>
                  <div className={styles.infoValue}>{user.email}</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}><Shield size={12} className="inline mr-4" /> Access Role</div>
                  <div className={styles.infoValue} style={{ textTransform: 'capitalize' }}>
                    <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`} style={{ marginRight: '8px' }}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {user.role?.replace(/_/g, ' ')}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}><Building2 size={12} className="inline mr-4" /> Primary Office</div>
                  <div className={styles.infoValue}>{user.offices?.name || 'Global Network'}</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}><Phone size={12} className="inline mr-4" /> Phone Number</div>
                  <div className={styles.infoValue}>{user.phone || 'Not provided'}</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}><Globe size={12} className="inline mr-4" /> Location</div>
                  <div className={styles.infoValue}>{user.offices?.city}, {user.offices?.country}</div>
                </div>
              </>
            ) : (
              <form onSubmit={handleUpdateProfile} className="contents">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Full Name</label>
                  <input 
                    className="form-input" 
                    value={formData.full_name} 
                    onChange={e => setFormData({...formData, full_name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    className="form-input" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Read-only)</label>
                  <input className="form-input" value={user.email} disabled />
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* System Settings Section */}
      <section>
        <div className="mb-24">
          <h2 className="text-xl font-bold text-white">System Configuration</h2>
          <p className="text-sm text-muted">Administrative tools and workspace preferences</p>
        </div>

        <div className={styles.settingsGrid}>
          {visibleSections.map(section => (
            <Link key={section.href} href={section.href} className={styles.settingCard}>
              <div className={styles.settingIcon}>{section.icon}</div>
              <div className={styles.settingInfo}>
                <h3>{section.label}</h3>
                <p>{section.desc}</p>
              </div>
              <div className={styles.openLink}>
                Manage →
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.themeSection}>
        <div className={styles.themePanelHeading}>
          <div>
            <h2>Workspace Theme</h2>
            <p>Pick a professional CRM color palette optimized for day and night shifts.</p>
          </div>
        </div>
        <ThemeSwitcher />
      </section>

      {/* Image Cropper */}
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
