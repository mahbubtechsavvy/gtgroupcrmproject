'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Server, Camera, Shield, Globe } from 'lucide-react';
import styles from './DeviceManager.module.css';

export default function DeviceManager({ offices }) {
  const [devices, setDevices] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    office_id: '',
    name: '',
    ip_address: '',
    port: '554',
    username: 'admin',
    password: '',
    channel: '1',
    subtype: '1',
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cctv/devices');
      const data = await res.json();
      setDevices(data);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId ? `/api/cctv/devices/${editingId}` : '/api/cctv/devices';
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
        setFormData({
          office_id: '',
          name: '',
          ip_address: '',
          port: '554',
          username: 'admin',
          password: '',
          channel: '1',
          subtype: '1',
        });
        fetchDevices();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save device');
      }
    } catch (err) {
      console.error('Error saving device:', err);
    }
  };

  const handleEdit = (device) => {
    setEditingId(device.id);
    setIsAdding(true);
    setFormData({
      office_id: device.office_id,
      name: device.name,
      ip_address: device.ip_address,
      port: device.port.toString(),
      username: device.username,
      password: '***', // Placeholder for password
      channel: device.channel.toString(),
      subtype: device.subtype.toString(),
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this camera?')) return;

    try {
      const res = await fetch(`/api/cctv/devices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDevices();
      }
    } catch (err) {
      console.error('Error deleting device:', err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <Shield className={styles.titleIcon} size={24} />
          <div>
            <h2 className={styles.title}>CCTV Device Management</h2>
            <p className={styles.subtitle}>Securely manage cameras and credentials across all offices.</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => { setIsAdding(true); setEditingId(null); }}>
          <Plus size={20} />
          Add New Camera
        </button>
      </div>

      {isAdding && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingId ? 'Edit Camera' : 'Add New Camera'}</h3>
              <button className={styles.closeBtn} onClick={() => setIsAdding(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Office LOCATION</label>
                  <select 
                    value={formData.office_id} 
                    onChange={e => setFormData({...formData, office_id: e.target.value})}
                    required
                  >
                    <option value="">Select Office</option>
                    {offices.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Camera Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Front Entrance"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>IP Address / URL</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 192.168.1.100"
                    value={formData.ip_address}
                    onChange={e => setFormData({...formData, ip_address: e.target.value})}
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Port</label>
                  <input 
                    type="number" 
                    value={formData.port}
                    onChange={e => setFormData({...formData, port: e.target.value})}
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Username</label>
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Password</label>
                  <input 
                    type="password" 
                    placeholder={editingId ? 'Leave *** to keep unchanged' : 'Enter password'}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required={!editingId}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Channel</label>
                  <input 
                    type="number" 
                    value={formData.channel}
                    onChange={e => setFormData({...formData, channel: e.target.value})}
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Subtype (0:HD, 1:SD)</label>
                  <select 
                    value={formData.subtype}
                    onChange={e => setFormData({...formData, subtype: e.target.value})}
                  >
                    <option value="0">Mainstream (HD)</option>
                    <option value="1">Substream (SD)</option>
                  </select>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAdding(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>
                  {editingId ? 'Update Camera' : 'Save Camera'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Office</th>
              <th>Camera Name</th>
              <th>Network Details</th>
              <th>Credentials</th>
              <th>Channel</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" className={styles.loading}>Loading devices...</td></tr>
            ) : devices.length === 0 ? (
              <tr><td colSpan="6" className={styles.empty}>No cameras registered yet.</td></tr>
            ) : (
              devices.map(device => (
                <tr key={device.id}>
                  <td>
                    <div className={styles.officeCell}>
                      <Globe size={14} className={styles.officeIcon} />
                      {device.offices?.name}
                    </div>
                  </td>
                  <td className={styles.cameraCell}>
                    <Camera size={14} className={styles.cameraIcon} />
                    {device.name}
                  </td>
                  <td>
                    <div className={styles.networkCell}>
                      <code className={styles.code}>{device.ip_address}</code>
                      <span className={styles.port}>:{device.port}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.userCell}>
                      <Server size={14} />
                      {device.username}
                    </div>
                  </td>
                  <td>
                    <span className={styles.badge}>CH {device.channel}</span>
                    <span className={styles.badge}>{device.subtype === 0 ? 'HD' : 'SD'}</span>
                  </td>
                  <td className={styles.actions}>
                    <button className={styles.actionBtn} onClick={() => handleEdit(device)} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className={`${styles.actionBtn} ${styles.delete}`} onClick={() => handleDelete(device.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
