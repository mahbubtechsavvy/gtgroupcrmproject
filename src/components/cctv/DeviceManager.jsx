'use client';

import { useState, useEffect } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Edit2, Trash2, X, Shield, Camera, Globe, GripVertical,
  Wifi, Server, ChevronDown, ChevronRight, CheckCircle
} from 'lucide-react';
import styles from './DeviceManager.module.css';

// ─── Sortable Row Component ───────────────────────────────────────────────────
function SortableRow({ device, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: device.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.deviceRow}>
      <div className={styles.dragHandle} {...attributes} {...listeners} title="Drag to reorder">
        <GripVertical size={16} />
      </div>
      <div className={styles.rowName}>
        <Camera size={14} className={styles.cameraIcon} />
        <span>{device.name}</span>
      </div>
      <div className={styles.rowNetwork}>
        <code className={styles.code}>{device.ip_address}</code>
        <span className={styles.port}>:{device.port}</span>
      </div>
      <div className={styles.rowUser}>
        <Server size={12} />
        <span>{device.username}</span>
      </div>
      <div className={styles.rowBadges}>
        <span className={styles.badge}>CH {device.channel}</span>
        <span className={`${styles.badge} ${device.subtype === 0 ? styles.badgeHd : styles.badgeSd}`}>
          {device.subtype === 0 ? 'HD' : 'SD'}
        </span>
      </div>
      <div className={styles.rowActions}>
        <button className={styles.actionBtn} onClick={() => onEdit(device)} title="Edit">
          <Edit2 size={15} />
        </button>
        <button className={`${styles.actionBtn} ${styles.delete}`} onClick={() => onDelete(device.id)} title="Delete">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Office Section Component ─────────────────────────────────────────────────
function OfficeSection({ office, devices, onEdit, onDelete, onReorder }) {
  const [collapsed, setCollapsed] = useState(false);
  const [items, setItems] = useState(devices.map(d => d.id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(devices.map(d => d.id));
  }, [devices]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.indexOf(active.id);
    const newIndex = items.indexOf(over.id);
    const newOrder = arrayMove(items, oldIndex, newIndex);
    setItems(newOrder);

    setSaving(true);
    const updates = newOrder.map((id, index) => ({ id, display_order: index }));
    await onReorder(updates);
    setSaving(false);
  };

  const sortedDevices = items.map(id => devices.find(d => d.id === id)).filter(Boolean);

  return (
    <div className={styles.officeSection}>
      <div className={styles.officeSectionHeader} onClick={() => setCollapsed(!collapsed)}>
        <div className={styles.officeSectionTitle}>
          <Globe size={16} className={styles.officeIcon} />
          <span>{office.name}</span>
          <span className={styles.cameraCount}>{devices.length} camera{devices.length !== 1 ? 's' : ''}</span>
        </div>
        <div className={styles.officeSectionActions}>
          {saving && <span className={styles.savingLabel}><CheckCircle size={12} /> Saving order...</span>}
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {!collapsed && (
        <div className={styles.officeCameraList}>
          <div className={styles.listHeader}>
            <span className={styles.lhDrag}></span>
            <span className={styles.lhName}>Camera Name</span>
            <span className={styles.lhNetwork}>Network</span>
            <span className={styles.lhUser}>User</span>
            <span className={styles.lhBadges}>Stream</span>
            <span className={styles.lhActions}>Actions</span>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {sortedDevices.map(device => (
                <SortableRow key={device.id} device={device} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </SortableContext>
          </DndContext>
          {devices.length === 0 && (
            <div className={styles.emptySection}>No cameras in this office yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main DeviceManager ───────────────────────────────────────────────────────
export default function DeviceManager({ offices }) {
  const [devices, setDevices] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    office_id: '', name: '', ip_address: '', port: '554',
    username: 'admin', password: '', channel: '1', subtype: '1',
  });

  useEffect(() => { fetchDevices(); }, []);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cctv/devices');
      const data = await res.json();
      setDevices(Array.isArray(data) ? data : []);
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
        resetForm();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        fetchDevices();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save device');
      }
    } catch (err) {
      console.error('Error saving device:', err);
    }
  };

  const resetForm = () => setFormData({
    office_id: '', name: '', ip_address: '', port: '554',
    username: 'admin', password: '', channel: '1', subtype: '1',
  });

  const handleEdit = (device) => {
    setEditingId(device.id);
    setIsAdding(true);
    setFormData({
      office_id: device.office_id, name: device.name,
      ip_address: device.ip_address, port: device.port.toString(),
      username: device.username, password: '',
      channel: device.channel.toString(), subtype: device.subtype.toString(),
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this camera?')) return;
    try {
      const res = await fetch(`/api/cctv/devices/${id}`, { method: 'DELETE' });
      if (res.ok) fetchDevices();
    } catch (err) {
      console.error('Error deleting device:', err);
    }
  };

  const handleReorder = async (updates) => {
    try {
      await fetch('/api/cctv/devices/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
    } catch (err) {
      console.error('Reorder failed:', err);
    }
  };

  // Group devices by office
  const devicesByOffice = offices.map(office => ({
    ...office,
    devices: devices.filter(d => d.office_id === office.id),
  }));

  const update = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <Shield className={styles.titleIcon} size={24} />
          <div>
            <h2 className={styles.title}>CCTV Device Management</h2>
            <p className={styles.subtitle}>Securely manage cameras and credentials across all offices. Drag to reorder.</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          {saveSuccess && (
            <span className={styles.successToast}><CheckCircle size={14} /> Saved!</span>
          )}
          <button className={styles.addBtn} onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }}>
            <Plus size={18} /> Add New Camera
          </button>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {isAdding && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingId ? 'Edit Camera' : 'Add New Camera'}</h3>
              <button className={styles.closeBtn} onClick={() => { setIsAdding(false); resetForm(); }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Office Location</label>
                  <select value={formData.office_id} onChange={e => update('office_id', e.target.value)} required>
                    <option value="">Select Office</option>
                    {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Camera Name</label>
                  <input type="text" placeholder="e.g. Front Entrance" value={formData.name} onChange={e => update('name', e.target.value)} required />
                </div>
                <div className={styles.formGroup}>
                  <label>IP Address</label>
                  <input type="text" placeholder="e.g. 192.168.1.100" value={formData.ip_address} onChange={e => update('ip_address', e.target.value)} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Port</label>
                  <input type="number" value={formData.port} onChange={e => update('port', e.target.value)} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Username</label>
                  <input type="text" value={formData.username} onChange={e => update('username', e.target.value)} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder={editingId ? 'Leave blank to keep unchanged' : 'Enter password'}
                    value={formData.password}
                    onChange={e => update('password', e.target.value)}
                    required={!editingId}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Channel</label>
                  <input type="number" min="0" value={formData.channel} onChange={e => update('channel', e.target.value)} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Stream Quality</label>
                  <select value={formData.subtype} onChange={e => update('subtype', e.target.value)}>
                    <option value="0">Mainstream (HD)</option>
                    <option value="1">Substream (SD — Recommended)</option>
                  </select>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => { setIsAdding(false); resetForm(); }}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>
                  {editingId ? 'Update Camera' : 'Add Camera'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Office Sections ── */}
      {isLoading ? (
        <div className={styles.loadingState}>Loading cameras...</div>
      ) : (
        <div className={styles.officeSections}>
          {devicesByOffice.map(office => (
            <OfficeSection
              key={office.id}
              office={office}
              devices={office.devices}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
