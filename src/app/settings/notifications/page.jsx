'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';

export default function NotificationSettingsPage() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    email_lead_assignment: true,
    email_pipeline_change: true,
    email_appointment_reminder: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setUser(u);

      // Load app settings (reusing app_settings table or creating notification_settings)
      const { data: appSet } = await supabase.from('app_settings').select('*').single();
      if (appSet?.notification_config) {
        setSettings(appSet.notification_config);
      }
    };
    init();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const supabase = getSupabaseClient();
    await supabase.from('app_settings').update({ notification_config: settings }).eq('id', (await supabase.from('app_settings').select('id').single()).data.id);
    setSaving(false);
    alert('Notification settings saved!');
  };

  if (!user || !isSuperAdmin(user.role)) {
    return <div className="p-24">Loading or Access Denied...</div>;
  }

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h1 className="page-title">Notification Settings</h1>
          <p className="page-subtitle">Configure global email alerts and triggers</p>
        </div>
        <Link href="/settings" className="btn btn-secondary">← Back to Settings</Link>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <h3 className="section-title mb-20">Email Notifications</h3>
        
        <div className="flex-between py-12" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-white)' }}>Lead Assignment</p>
            <p className="text-xs text-muted">Notify counselor when a new student is assigned to them</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={settings.email_lead_assignment} onChange={e => setSettings({...settings, email_lead_assignment: e.target.checked})} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="flex-between py-12" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-white)' }}>Pipeline Status Change</p>
            <p className="text-xs text-muted">Notify staff when a student moves to a new stage</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={settings.email_pipeline_change} onChange={e => setSettings({...settings, email_pipeline_change: e.target.checked})} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="flex-between py-12">
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-white)' }}>Appointment Reminders</p>
            <p className="text-xs text-muted">Send automated reminders 24 hours before appointments</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={settings.email_appointment_reminder} onChange={e => setSettings({...settings, email_appointment_reminder: e.target.checked})} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="mt-24 pt-24" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      <div className="mt-24 alert alert-info" style={{ maxWidth: '600px' }}>
        <p className="text-sm">
          <strong>Note:</strong> Email notifications require a valid <strong>Resend API Key</strong> configured in the Supabase Edge Functions. 
          Staff will receive emails at their registered CRM email addresses.
        </p>
      </div>
    </div>
  );
}
