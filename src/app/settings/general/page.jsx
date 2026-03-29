'use client';

import { useState } from 'react';

export default function GeneralSettings() {
  const [saving, setSaving] = useState(false);
  
  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Settings saved successfully!');
    }, 1000);
  };

  return (
    <div>
      <div className="mb-24">
        <h1 className="page-title">General Settings</h1>
        <p className="page-subtitle">Manage your CRM branding and localization</p>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleSave}>
          <div className="form-group mb-16">
            <label className="form-label">Company Name</label>
            <input className="form-input" defaultValue="GT Group Study Abroad Consultancy" />
          </div>
          
          <div className="form-group mb-16">
            <label className="form-label">Support Email</label>
            <input className="form-input" type="email" defaultValue="support@gtgroup.com" />
          </div>

          <div className="grid-2 mb-16" style={{ gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-select" defaultValue="Asia/Dhaka">
                <option value="Asia/Seoul">Asia/Seoul (KST)</option>
                <option value="Asia/Dhaka">Asia/Dhaka (BDT)</option>
                <option value="Asia/Colombo">Asia/Colombo (IST)</option>
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (ICT)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" defaultValue="USD">
                <option value="USD">USD ($)</option>
                <option value="KRW">KRW (₩)</option>
                <option value="BDT">BDT (৳)</option>
              </select>
            </div>
          </div>

          <div className="form-group mb-24">
            <label className="form-label">Brand Color</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input type="color" defaultValue="#C9A227" style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
              <span className="text-sm text-muted">Primary Gold (#C9A227)</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
