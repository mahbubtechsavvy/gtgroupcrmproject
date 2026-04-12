'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';

export default function GeneralSettings() {
  const [settings, setSettings] = useState({
    company_name: 'GT Group CRM',
    logo_url: '',
    primary_currency: 'USD',
    primary_timezone: 'Asia/Dhaka',
    system_slogan: 'GT Group — Verified Study Abroad Partner',
    brand_color: '#C9A227',
    login_page_company_name: 'GT Group',
    login_page_company_slogan: 'Study Abroad Consultancy',
    login_page_background_primary_color: '#0F2542',
    login_page_background_secondary_color: '#1A3F5C'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.from('app_settings').select('*');
      
      if (data) {
        const sMap = {};
        data.forEach(item => { sMap[item.key] = item.value; });
        setSettings(prev => ({ ...prev, ...sMap }));
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const supabase = getSupabaseClient();
    
    // Prepare upsert data
    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value: value?.toString() || ''
    }));

    const { error } = await supabase
      .from('app_settings')
      .upsert(updates, { onConflict: 'key' });

    if (error) {
      alert('Error saving settings: ' + error.message);
    } else {
      setHasChanges(false);
      alert('General settings updated successfully!');
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSaving(true);
    const supabase = getSupabaseClient();
    const ext = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${ext}`;
    
    const { data: uploadData, error } = await supabase.storage
      .from('public_assets')
      .upload(fileName, file);
      
    if (error) {
      alert('Error uploading logo: ' + error.message);
      setSaving(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('public_assets')
      .getPublicUrl(fileName);
      
    handleChange('logo_url', publicUrl);
    setSaving(false);
  };

  if (loading) return <div className="empty-state"><div className="loading-spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-32">
        <div>
          <h1 className="page-title">General Settings</h1>
          <p className="page-subtitle">Manage your CRM branding, localization, and global preferences</p>
        </div>
        <div className="flex gap-12">
          <Link href="/settings" className="btn btn-secondary">← Back to Settings</Link>
          <button 
            type="button" 
            onClick={handleSave} 
            className="btn btn-primary" 
            disabled={saving || !hasChanges}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid-12 gap-24">
        {/* Main Settings Card */}
        <div className="col-span-8 space-y-24">
          <div className="card">
            <h3 className="section-title mb-24">Identity & Branding</h3>
            
            <div className="form-group mb-24">
              <label className="form-label">Company / CRM Name</label>
              <input 
                className="form-input" 
                value={settings.company_name} 
                onChange={e => handleChange('company_name', e.target.value)} 
                placeholder="e.g. GT Group CRM"
              />
              <p className="text-xs text-muted mt-8">This name appears in the browser tab and sidebar.</p>
            </div>

            <div className="form-group mb-24">
              <label className="form-label">System Slogan</label>
              <input 
                className="form-input" 
                value={settings.system_slogan} 
                onChange={e => handleChange('system_slogan', e.target.value)} 
                placeholder="e.g. Verified Study Abroad Partner"
              />
              <p className="text-xs text-muted mt-8">Appears on official PDF receipts and email footers.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Global Logo</label>
              <div className="flex gap-20 align-center">
                <div className="logo-preview-box">
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt="Logo Preview" />
                  ) : (
                    <div className="logo-placeholder">GT</div>
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="form-input" />
                  <p className="text-xs text-muted mt-8">Recommended: Square PNG with transparent background (512x512px).</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title mb-24">Localization & Financials</h3>
            
            <div className="grid-2 gap-20">
              <div className="form-group">
                <label className="form-label">Primary CRM Currency</label>
                <select 
                  className="form-select" 
                  value={settings.primary_currency} 
                  onChange={e => handleChange('primary_currency', e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="KRW">KRW (₩)</option>
                  <option value="BDT">BDT (৳)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="VND">VND (₫)</option>
                  <option value="LKR">LKR (Rs)</option>
                </select>
                <p className="text-xs text-muted mt-8">The default currency for global revenue reporting.</p>
              </div>

              <div className="form-group">
                <label className="form-label">System Timezone</label>
                <select 
                  className="form-select" 
                  value={settings.primary_timezone} 
                  onChange={e => handleChange('primary_timezone', e.target.value)}
                >
                  <option value="Asia/Dhaka">Bangladesh (GMT+6)</option>
                  <option value="Asia/Seoul">South Korea (GMT+9)</option>
                  <option value="Asia/Ho_Chi_Minh">Vietnam (GMT+7)</option>
                  <option value="Asia/Colombo">Sri Lanka (GMT+5:30)</option>
                </select>
                <p className="text-xs text-muted mt-8">Affects schedule timestamps and audit logs.</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title mb-24">🔐 Login Page Customization</h3>
            
            <div className="form-group mb-24">
              <label className="form-label">Login Company Name</label>
              <input 
                className="form-input" 
                value={settings.login_page_company_name} 
                onChange={e => handleChange('login_page_company_name', e.target.value)} 
                placeholder="e.g. GT Group"
                maxLength="50"
              />
              <p className="text-xs text-muted mt-8">Displayed prominently on the login page. Leave empty to use company name.</p>
            </div>

            <div className="form-group mb-24">
              <label className="form-label">Login Company Slogan</label>
              <input 
                className="form-input" 
                value={settings.login_page_company_slogan} 
                onChange={e => handleChange('login_page_company_slogan', e.target.value)} 
                placeholder="e.g. Study Abroad Consultancy"
                maxLength="100"
              />
              <p className="text-xs text-muted mt-8">Tagline displayed below company name on login page.</p>
            </div>

          </div>
        </div>

        {/* Sidebar Preview / Visual Card */}
        <div className="col-span-4">
          <div className="card" style={{ position: 'sticky', top: '24px', border: '1px solid var(--color-border-primary)' }}>
            <h4 className="font-semibold mb-16 text-sm flex align-center gap-8">
              <span style={{ color: 'var(--color-primary)' }}>✨</span> Branding Preview
            </h4>
            <div className="preview-container p-20 rounded-lg mb-16" style={{ background: 'var(--color-bg-dark)', border: '1px solid var(--color-border-primary)' }}>
              <div className="sidebar-mockup flex align-center gap-12">
                <div className="logo-circle" style={{ width: '40px', height: '40px', background: 'var(--color-primary-gradient)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {settings.logo_url ? <img src={`${settings.logo_url}?v=${Date.now()}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#000', fontWeight: 'bold', fontSize: '14px' }}>GT</span>}
                </div>
                <div className="name-mockup">
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', lineHeight: 1 }}>{settings.company_name}</div>
                  <div style={{ color: 'var(--color-primary)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginTop: '2px' }}>CRM</div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              This is how your branding appears in the main navigation. Changes here will also apply to your <strong>Official Payment Receipts</strong> and <strong>Email Templates</strong>.
            </p>
            
            <div className="mt-24 pt-24 border-t border-primary">
              <label className="form-label text-xs uppercase tracking-wider opacity-60">Brand Accent Color</label>
              <div className="flex align-center gap-12 mt-12">
                <input 
                  type="color" 
                  value={settings.brand_color} 
                  onChange={e => handleChange('brand_color', e.target.value)}
                  className="color-picker-input"
                />
                <span className="text-sm font-mono opacity-80">{settings.brand_color}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .logo-preview-box {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          background: #121212;
          display: flex;
          align-center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid var(--color-border-primary);
        }
        .logo-preview-box img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .logo-placeholder {
          font-weight: 900;
          font-size: 24px;
          color: var(--color-primary);
        }
        .color-picker-input {
          -webkit-appearance: none;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          padding: 0;
          overflow: hidden;
        }
        .color-picker-input::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        .color-picker-input::-webkit-color-swatch {
          border: none;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
