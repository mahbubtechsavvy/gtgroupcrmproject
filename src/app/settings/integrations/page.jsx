'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import Link from 'next/link';

export default function IntegrationsPage() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [localSettings, setLocalSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      if (!isSuperAdmin(u?.role)) return;
      setUser(u);

      const { data: s } = await supabase.from('app_settings').select('*');
      const sMap = {};
      s?.forEach(item => { sMap[item.key] = item.value; });
      setSettings(sMap);
      setLocalSettings(sMap);
      setLoading(false);
    };
    init();
  }, []);

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!window.confirm('Are you sure you want to save these integration settings? Incorrect keys may break CRM automation.')) return;
    
    setSaving(true);
    const supabase = getSupabaseClient();
    
    const updates = Object.entries(localSettings).map(([key, value]) => ({
      key,
      value
    }));

    if (updates.length > 0) {
      const { error } = await supabase.from('app_settings').upsert(updates, { onConflict: 'key' });
      if (error) alert(error.message);
      else {
        setSettings(localSettings);
        setHasChanges(false);
        alert('Integrations updated successfully.');
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h1 className="page-title">External Integrations</h1>
          <p className="page-subtitle">Configure Google Calendar, WhatsApp, and Email APIs</p>
        </div>
        <div className="flex gap-12">
          <button 
            className="btn btn-primary" 
            onClick={handleSaveChanges} 
            disabled={saving || !hasChanges}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/settings" className="btn btn-secondary">← Back to Settings</Link>
        </div>
      </div>

      <div className="grid-2">
        {/* Google Calendar */}
        <div className="card">
          <div className="flex align-center gap-12 mb-16">
            <div style={{ fontSize: '1.5rem' }}>📅</div>
            <h3 className="section-title">Google Calendar & Meet</h3>
          </div>
          <p className="text-sm text-muted mb-20">Set the Master CRM account for automated scheduling and guest invitations.</p>
          
          <div className="form-group">
            <label className="form-label">Master CRM Email</label>
            <input 
              className="form-input" 
              placeholder="office.gtbd@gmail.com" 
              value={localSettings.master_gmail || ''} 
              onChange={e => handleChange('master_gmail', e.target.value)}
            />
            <p className="text-xs text-muted mt-8">Note: This account will be the organizer for all Google Meet sessions.</p>
          </div>

          <div className="form-group mt-16">
            <label className="form-label">Google Service Account JSON</label>
            <textarea 
              className="form-textarea" 
              placeholder='{ "type": "service_account", ... }'
              rows={5}
              value={localSettings.google_key || ''}
              onChange={e => handleChange('google_key', e.target.value)}
              style={{ fontSize: '11px', fontFamily: 'monospace' }}
            />
            <p className="text-xs text-muted mt-8">Required for backend synchronization. Leave empty to disable sync.</p>
          </div>
        </div>

        {/* Google OAuth for Email Management */}
        <div className="card">
          <div className="flex align-center gap-12 mb-16">
            <div style={{ fontSize: '1.5rem' }}>🔐</div>
            <h3 className="section-title">Google OAuth - Email Management</h3>
          </div>
          <p className="text-sm text-muted mb-20">For user email account management and authorization. Get credentials from Google Cloud Console.</p>

          <div className="form-group">
            <label className="form-label">Google Client ID</label>
            <input 
              className="form-input" 
              placeholder="xxx.apps.googleusercontent.com" 
              value={localSettings.google_client_id || ''}
              onChange={e => handleChange('google_client_id', e.target.value)}
            />
            <p className="text-xs text-muted mt-8">OAuth 2.0 Client ID from Google Cloud Console</p>
          </div>

          <div className="form-group mt-16">
            <label className="form-label">Google Client Secret</label>
            <input 
              className="form-input" 
              type="password"
              placeholder="••••••••••••••••••••" 
              value={localSettings.google_client_secret || ''}
              onChange={e => handleChange('google_client_secret', e.target.value)}
            />
            <p className="text-xs text-muted mt-8">OAuth 2.0 Client Secret (keep this secret!)</p>
          </div>

          <div className="form-group mt-16">
            <label className="form-label">OAuth Redirect URI (Auto-configured)</label>
            <input 
              className="form-input" 
              disabled
              value="http://localhost:3002/api/auth/google-oauth-callback"
            />
            <p className="text-xs text-muted mt-8">Configure this exact URL in Google Cloud Console under Authorized Redirect URIs</p>
          </div>
        </div>

        {/* Messaging & Alerts */}
        <div className="card">
          <div className="flex align-center gap-12 mb-16">
            <div style={{ fontSize: '1.5rem' }}>💬</div>
            <h3 className="section-title">Messaging & Alerts</h3>
          </div>
          <p className="text-sm text-muted mb-20">Manage credentials for notifications and automated messaging.</p>

          <div className="form-group">
            <label className="form-label">Resend API Key (Email)</label>
            <input 
              className="form-input" 
              type="password"
              placeholder="re_..." 
              value={localSettings.resend_api_key || ''}
              onChange={e => handleChange('resend_api_key', e.target.value)}
            />
          </div>

          <div className="form-group mt-16">
            <label className="form-label">WhatsApp Business (Optional)</label>
            <input 
              className="form-input" 
              placeholder="Phone ID / Token" 
              value={localSettings.whatsapp_token || ''}
              onChange={e => handleChange('whatsapp_token', e.target.value)}
            />
            <p className="text-xs text-muted mt-8">Currently using free &quot;Click-to-Send&quot; manual method. Automated bot requires WhatsApp Cloud API.</p>
          </div>
        </div>
      </div>

      <div className="card mt-24" style={{ border: '1px solid var(--color-warning)', background: 'rgba(245,158,11,0.02)' }}>
        <h4 className="font-semibold mb-8" style={{ color: 'var(--color-warning)' }}>⚠️ Security Warning</h4>
        <p className="text-sm">Only Super Admins can see or modify these keys. Ensure these credentials are never shared with staff or clients.</p>
      </div>
    </div>
  );
}
