'use client';

import { useState, useEffect } from 'react';
import { History, Plus, Calendar, Film, Image as ImageIcon, Video, Type, BarChart3, Clock, User, Link as LinkIcon } from 'lucide-react';
import styles from './ContentLog.module.css';

const MEDIA_TYPES = [
  { id: 'image', label: 'Image', icon: <ImageIcon size={14} /> },
  { id: 'video', label: 'Video', icon: <Video size={14} /> },
  { id: 'reel', label: 'Reel', icon: <Film size={14} /> },
  { id: 'story', label: 'Story', icon: <Clock size={14} /> },
  { id: 'text', label: 'Text/Status', icon: <Type size={14} /> },
  { id: 'ad', label: 'Paid Ad', icon: <BarChart3 size={14} /> },
  { id: 'carousel', label: 'Carousel', icon: <ImageIcon size={14} /> }
];

const PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'whatsapp'];

export default function ContentLog({ offices }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    office_id: '',
    platform: 'facebook',
    media_type: 'image',
    post_description: '',
    post_url: '',
    posted_at: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/social-media/content-log');
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch logs failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/social-media/content-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({
          ...formData,
          post_description: '',
          post_url: ''
        });
        fetchLogs();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to log post');
      }
    } catch (err) {
      console.error('Error logging post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Log Entry Form */}
      <div className={styles.logFormCard}>
        <h3><Plus size={20} /> Record New Social Post</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Office</label>
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
                {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Media Type</label>
              <select 
                value={formData.media_type} 
                onChange={e => setFormData({...formData, media_type: e.target.value})}
                required
              >
                {MEDIA_TYPES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            <div className={styles.formGroup + ' ' + styles.full}>
              <label>Post Description / Caption</label>
              <textarea 
                rows="2"
                placeholder="Briefly describe what was posted..."
                value={formData.post_description}
                onChange={e => setFormData({...formData, post_description: e.target.value})}
                required
              />
            </div>
            <div className={styles.formGroup + ' ' + styles.full} style={{ gridColumn: 'span 2' }}>
              <label>Post URL (Optional)</label>
              <input 
                type="url" 
                placeholder="https://..."
                value={formData.post_url}
                onChange={e => setFormData({...formData, post_url: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Post Date</label>
              <input 
                type="date" 
                value={formData.posted_at}
                onChange={e => setFormData({...formData, posted_at: e.target.value})}
                required
              />
            </div>
          </div>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Logging...' : 'Record Post Update'}
          </button>
        </form>
      </div>

      {/* History Table */}
      <div className={styles.tableContainer}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={18} style={{ color: 'var(--color-gold)' }} />
          <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Post Update History</h3>
        </div>
        
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading history...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Office</th>
                <th>Platform</th>
                <th>Type</th>
                <th>Description</th>
                <th>Logged By</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
                    No posts have been logged yet.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.posted_at).toLocaleDateString()}</td>
                    <td>{log.offices?.name}</td>
                    <td><span className={styles.platformBadge}>{log.platform}</span></td>
                    <td><span className={styles.mediaBadge}>{log.media_type}</span></td>
                    <td>
                      <div className={styles.descCell} title={log.post_description}>
                        {log.post_description}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                        <User size={12} />
                        {log.users?.full_name}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
