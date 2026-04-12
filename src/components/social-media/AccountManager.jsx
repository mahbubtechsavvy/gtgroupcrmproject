'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, X, Edit2, Trash2, Globe, Shield, Facebook, 
  Instagram, Youtube, Linkedin, Twitter, MessageCircle, 
  ChevronDown, ChevronRight, CheckCircle, Info
} from 'lucide-react';
import styles from './AccountManager.module.css';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook Page', icon: <Facebook size={16} /> },
  { id: 'instagram', label: 'Instagram', icon: <Instagram size={16} /> },
  { id: 'tiktok', label: 'TikTok', icon: <Globe size={16} /> },
  { id: 'youtube', label: 'YouTube', icon: <Youtube size={16} /> },
  { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={16} /> },
  { id: 'twitter', label: 'Twitter/X', icon: <Twitter size={16} /> },
  { id: 'whatsapp', label: 'WhatsApp Web', icon: <MessageCircle size={16} /> },
  { id: 'custom', label: 'Custom URL', icon: <Globe size={16} /> }
];

export default function AccountManager({ offices }) {
  const [accounts, setAccounts] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    office_id: '', platform: 'facebook', account_name: '', 
    page_url: '', mgmt_url: '', notes: '', is_active: true
  });
  const [collapsedOffices, setCollapsedOffices] = useState({});

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/social-media/accounts');
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId ? `/api/social-media/accounts/${editingId}` : '/api/social-media/accounts';
    const method = editingId ? 'PATCH' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsAdding(false);
        setEditingId(null);
        resetForm();
        fetchAccounts();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save account');
      }
    } catch (err) {
      console.error('Error saving:', err);
    }
  };

  const handleEdit = (account) => {
    setEditingId(account.id);
    setFormData({
      office_id: account.office_id,
      platform: account.platform,
      account_name: account.account_name,
      page_url: account.page_url || '',
      mgmt_url: account.mgmt_url || '',
      notes: account.notes || '',
      is_active: account.is_active
    });
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this social media account?')) return;
    try {
      const res = await fetch(`/api/social-media/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAccounts();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const resetForm = () => setFormData({
    office_id: '', platform: 'facebook', account_name: '', 
    page_url: '', mgmt_url: '', notes: '', is_active: true
  });

  const toggleOffice = (id) => {
    setCollapsedOffices(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h2>Social Media Account Management</h2>
          <p className={styles.subtitle}>Configure social links and management hubs for all offices. No passwords stored.</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }}>
          <Plus size={18} /> Add New Account
        </button>
      </div>

      {isAdding && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingId ? 'Edit Account' : 'Add New Account'}</h3>
              <button className={styles.closeBtn} onClick={() => { setIsAdding(false); resetForm(); }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Office Location</label>
                  <select 
                    value={formData.office_id} 
                    onChange={e => setFormData({...formData, office_id: e.target.value})}
                    required
                  >
                    <option value="">Select Office</option>
                    {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Platform</label>
                  <select 
                    value={formData.platform} 
                    onChange={e => setFormData({...formData, platform: e.target.value})}
                    required
                  >
                    {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup + ' ' + styles.full}>
                  <label>Account Display Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. GT Group Bangladesh Official"
                    value={formData.account_name}
                    onChange={e => setFormData({...formData, account_name: e.target.value})}
                    required
                  />
                </div>
                <div className={styles.formGroup + ' ' + styles.full}>
                  <label>Public Page URL</label>
                  <input 
                    type="url" 
                    placeholder="https://facebook.com/gtgroupbd"
                    value={formData.page_url}
                    onChange={e => setFormData({...formData, page_url: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup + ' ' + styles.full}>
                  <label>Management URL (Ads Manager / Studio / etc)</label>
                  <input 
                    type="url" 
                    placeholder="https://business.facebook.com/adsmanager"
                    value={formData.mgmt_url}
                    onChange={e => setFormData({...formData, mgmt_url: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup + ' ' + styles.full}>
                  <label>Active Status</label>
                  <label className={styles.checkbox}>
                    <input 
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    />
                    Account is active and visible to staff
                  </label>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => { setIsAdding(false); resetForm(); }}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>
                  {editingId ? 'Update Account' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '100px', color: '#64748b' }}>Loading accounts...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {offices.map(office => {
            const officeAccounts = accounts.filter(a => a.office_id === office.id);
            const isCollapsed = collapsedOffices[office.id];
            
            return (
              <div key={office.id} className={styles.officeSection}>
                <div className={styles.officeHeader} onClick={() => toggleOffice(office.id)}>
                  <div className={styles.officeTitle}>
                    <Globe size={18} />
                    <span>{office.name}</span>
                    <span className={styles.count}>{officeAccounts.length}</span>
                  </div>
                  {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                </div>
                
                {!isCollapsed && (
                  <div className={styles.accountList}>
                    {officeAccounts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#475569', fontSize: '13px' }}>
                        No accounts configured for this office.
                      </div>
                    ) : (
                      officeAccounts.map(acc => (
                        <div key={acc.id} className={styles.accountRow}>
                          <div className={styles.rowName}>{acc.account_name}</div>
                          <div className={styles.rowUrl}>{acc.platform}</div>
                          <div className={styles.rowStatus}>
                            <div className={acc.is_active ? styles.statusActive : styles.statusInactive}>
                              {acc.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </div>
                          </div>
                          <div className={styles.rowActions}>
                            <button className={styles.actionBtn} onClick={() => handleEdit(acc)}>
                              <Edit2 size={14} />
                            </button>
                            <button className={styles.actionBtn + ' ' + styles.delete} onClick={() => handleDelete(acc.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
