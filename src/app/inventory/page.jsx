'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Laptop, 
  User, 
  MapPin, 
  Calendar, 
  Trash2, 
  Edit,
  AlertTriangle,
  FileText,
  FileDown
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/auth';
import * as XLSX from 'xlsx';
import styles from './inventory.module.css';

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    item_name: '',
    specification: '',
    quantity: 1,
    purchase_date: '',
    purchase_price: '',
    item_location: '',
    person_in_charge: '',
    status: 'active',
    office_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = getSupabaseClient();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setCurrentUser(user);

      const res = await fetch(`/api/inventory?officeId=${user.role === 'ceo' || user.role === 'coo' ? '' : user.office_id}`);
      const data = await res.json();
      setItems(data || []);

      // Fetch users for "Person in charge"
      const { data: userData } = await supabase.from('users').select('id, full_name, employee_id');
      setUsers(userData || []);

      const { data: offData } = await supabase.from('offices').select('id, name');
      setOffices(offData || []);

    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const body = { ...form, office_id: form.office_id || currentUser.office_id };
    if (editItem) body.id = editItem.id;

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowForm(false);
        setEditItem(null);
        setForm({ item_name: '', specification: '', quantity: 1, purchase_date: '', purchase_price: '', item_location: '', person_in_charge: '', status: 'active', office_id: '' });
        fetchData();
      }
    } catch (err) {
      alert('Failed to save item.');
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(items.map(i => ({
      'Item Name': i.item_name,
      'Specification': i.specification,
      'Quantity': i.quantity,
      'Location': i.item_location,
      'Person in Charge': i.person_in_charge_user?.full_name || 'Unassigned',
      'Status': i.status.replace('_', ' ').toUpperCase(),
      'Purchase Date': i.purchase_date || 'N/A',
      'Price': i.purchase_price || '0.00'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `GT_Group_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const canManage = currentUser?.role === 'ceo' || currentUser?.role === 'coo' || currentUser?.role === 'office_manager';

  if (loading) return <div className="empty-state">Loading Inventory...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <h1>Office Inventory</h1>
          <p>Tracking assets across GT Group offices</p>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-secondary" onClick={exportToExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <FileDown size={18} /> Export Inventory
          </button>
          {canManage && (
            <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditItem(null); }}>
               <Plus size={18} /> Add New Asset
            </button>
          )}
        </div>
      </div>

      {/* Main List */}
      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Location</th>
              <th>Person in Charge</th>
              <th>Status</th>
              <th>Purchased</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="flex gap-12 items-center">
                    <div style={{ padding: '8px', background: 'rgba(201,162,39,0.1)', borderRadius: '8px' }}>
                      <Laptop size={18} color="var(--color-gold)" />
                    </div>
                    <div>
                      <div className={styles.itemTitle}>{item.item_name}</div>
                      <div className={styles.itemSpec}>{item.specification}</div>
                    </div>
                  </div>
                </td>
                <td>{item.quantity}</td>
                <td>
                   <div className="flex items-center gap-4 text-xs">
                     <MapPin size={12} className="text-muted" />
                     {item.item_location}
                   </div>
                </td>
                <td>
                   <div className="flex items-center gap-4">
                     <User size={14} className="text-muted" />
                     <span className="text-sm">{item.person_in_charge_user?.full_name || 'Unassigned'}</span>
                   </div>
                </td>
                <td>
                  <span className={`${styles.badge} ${
                    item.status === 'active' ? styles.statusActive :
                    item.status === 'in_repair' ? styles.statusRepair : styles.statusDisposed
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                   <div className="flex items-center gap-4 text-xs text-muted">
                     <Calendar size={12} />
                     {item.purchase_date || 'N/A'}
                   </div>
                </td>
                {canManage && (
                  <td>
                    <div className="flex gap-8">
                       <button className="btn btn-ghost btn-sm" onClick={() => { setEditItem(item); setForm(item); setShowForm(true); }}>
                         <Edit size={14} />
                       </button>
                       <button className="btn btn-ghost btn-sm text-danger" onClick={() => deleteItem(item.id)}>
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Entry Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
           <div className="modal">
              <div className="modal-header">
                <h2>{editItem ? 'Edit Asset' : 'Add New Asset'}</h2>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                   <div className={styles.formGrid}>
                      <div className={styles.fullWidth}>
                         <label className="form-label">Item Name *</label>
                         <input className="form-input" required value={form.item_name} onChange={(e) => setForm({...form, item_name: e.target.value})} placeholder="e.g. Dell Monitor 24 inch" />
                      </div>
                      <div className={styles.fullWidth}>
                         <label className="form-label">Specification</label>
                         <input className="form-input" value={form.specification} onChange={(e) => setForm({...form, specification: e.target.value})} placeholder="e.g. Model P2422H, 1080p, Serial: CN-0X..." />
                      </div>
                      <div className="form-group">
                         <label className="form-label">Quantity</label>
                         <input type="number" className="form-input" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} placeholder="e.g. 5" />
                      </div>
                      <div className="form-group">
                         <label className="form-label">Office Location</label>
                         <input className="form-input" value={form.item_location} onChange={(e) => setForm({...form, item_location: e.target.value})} placeholder="e.g. Front Desk, Bangladesh Office" />
                      </div>
                      <div className="form-group">
                         <label className="form-label">Purchase Date</label>
                         <input type="date" className="form-input" value={form.purchase_date} onChange={(e) => setForm({...form, purchase_date: e.target.value})} />
                      </div>
                      <div className="form-group">
                         <label className="form-label">Price</label>
                         <input className="form-input" value={form.purchase_price} onChange={(e) => setForm({...form, purchase_price: e.target.value})} placeholder="e.g. 250" />
                      </div>
                      <div className="form-group">
                         <label className="form-label">Person in Charge</label>
                         <select className="form-select" value={form.person_in_charge} onChange={(e) => setForm({...form, person_in_charge: e.target.value})}>
                            <option value="">Select Staff member</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.employee_id})</option>)}
                         </select>
                      </div>
                      <div className="form-group">
                         <label className="form-label">Status</label>
                         <select className="form-select" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                            <option value="active">Active</option>
                            <option value="in_repair">In Repair</option>
                            <option value="disposed">Disposed / Replaced</option>
                         </select>
                      </div>
                   </div>
                </div>
                <div className="modal-footer">
                   <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                   <button type="submit" className="btn btn-primary">Save Asset</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
