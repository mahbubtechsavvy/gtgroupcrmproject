'use client';

import React, { useState, useEffect } from 'react';
import { ExecutiveHero, ExecutiveSection, MetricGrid } from '@/components/crm/ExecutivePage';
import { 
  Plus, 
  UserPlus, 
  Search, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone,
  HelpCircle,
  Building,
  FileDown
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import styles from './visitors.module.css';

export default function VisitorLogPage() {
  const [visitors, setVisitors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    visitor_name: '',
    visitor_contact: '',
    purpose: '',
    host_staff_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = getSupabaseClient();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: user } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setCurrentUser(user);

      const res = await fetch(`/api/visitors?officeId=${user.role === 'ceo' || user.role === 'coo' ? '' : user.office_id}`);
      const data = await res.json();
      setVisitors(data || []);

      const { data: staffData } = await supabase.from('users').select('id, full_name, employee_id');
      setStaff(staffData || []);
    } catch (err) {
      console.error('Failed to fetch visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...form, 
          office_id: currentUser.office_id,
          recorded_by: currentUser.id,
          check_in: new Date().toISOString()
        })
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ visitor_name: '', visitor_contact: '', purpose: '', host_staff_id: '', notes: '' });
        fetchData();
      }
    } catch (err) { alert('Failed to log visitor'); }
  };

  const handleCheckOut = async (id) => {
    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, check_out: new Date().toISOString() })
      });
      if (res.ok) fetchData();
    } catch (err) { alert('Failed to check out'); }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(visitors.map(v => ({
      'Visitor Name': v.visitor_name,
      'Contact Info': v.visitor_contact,
      'Purpose': v.purpose,
      'Host Staff': v.host_staff?.full_name || 'N/A',
      'Check-in Time': new Date(v.check_in).toLocaleString(),
      'Check-out Time': v.check_out ? new Date(v.check_out).toLocaleString() : 'STILL INSIDE',
      'Notes': v.notes
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VisitorLog');
    XLSX.writeFile(wb, `GT_Group_Visitors_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  const metrics = [
    { label: 'Total Visits', value: visitors.length },
    { label: 'Inside Now', value: visitors.filter((visitor) => !visitor.check_out).length },
    { label: 'Checked Out', value: visitors.filter((visitor) => visitor.check_out).length },
    { label: 'Hosts Used', value: new Set(visitors.map((visitor) => visitor.host_staff_id).filter(Boolean)).size },
  ];

  if (loading) return <div className="empty-state">Loading Visitor Logs...</div>;

  return (
    <div className={styles.container}>
      <ExecutiveHero
        eyebrow="Real-Time Reception"
        title="Visitor Management"
        subtitle="Cross-office live visitor visibility with host staff context, check-in status, and exportable history."
        actions={
          <>
            <button className="btn btn-secondary" onClick={exportToExcel}><FileDown size={16} /> Export Log</button>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}><UserPlus size={16} /> Log New Visitor</button>
          </>
        }
      />

      <ExecutiveSection title="Visitor Summary">
        <MetricGrid items={metrics} />
      </ExecutiveSection>

      <ExecutiveSection title="Live Visitor Register" subtitle="Super admin can monitor office traffic and current in-office visitor status in real time.">
      <div className={styles.logCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Visitor Name</th>
              <th>Purpose of Visit</th>
              <th>Host (Staff)</th>
              <th>Time In</th>
              <th>Time Out</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visitors.map((v) => (
              <tr key={v.id}>
                <td>
                   <div className={styles.visitorInfo}>
                      <span className={styles.visitorName}>{v.visitor_name}</span>
                      <span className={styles.visitorContact}>{v.visitor_contact || 'No contact provided'}</span>
                   </div>
                </td>
                <td>
                   <div className="text-sm font-medium">{v.purpose}</div>
                   {v.notes && <div className="text-xs text-muted italic">Note: {v.notes}</div>}
                </td>
                <td>
                   <div className="flex items-center gap-6">
                      <User size={12} className="text-muted" />
                      <span className="text-xs">{v.host_staff?.full_name}</span>
                   </div>
                </td>
                <td><span className={styles.time}>{new Date(v.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></td>
                <td>
                   <span className={styles.time}>
                      {v.check_out ? new Date(v.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                   </span>
                </td>
                <td>
                   {v.check_out ? (
                      <div className={`${styles.statusIndicator} ${styles.statusOut}`}>
                         <CheckCircle2 size={12} /> Checked Out
                      </div>
                   ) : (
                      <div className={`${styles.statusIndicator} ${styles.statusIn}`}>
                         <Clock size={12} /> Inside Office
                      </div>
                   )}
                </td>
                <td>
                   {!v.check_out && (
                      <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleCheckOut(v.id)}>
                         <LogOut size={14} /> Check Out
                      </button>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </ExecutiveSection>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
           <div className="modal">
              <div className="modal-header"><h2>Register Visitor</h2></div>
              <form onSubmit={handleCheckIn}>
                <div className="modal-body">
                   <div className="grid-2">
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                         <label className="form-label">Visitor Full Name *</label>
                         <input className="form-input" required value={form.visitor_name} onChange={e => setForm({...form, visitor_name: e.target.value})} placeholder="e.g. Mr. Mahbubur Rahman" />
                      </div>
                      <div className="form-group">
                         <label className="form-label">Contact Number (Phone/WhatsApp)</label>
                         <input className="form-input" value={form.visitor_contact} onChange={e => setForm({...form, visitor_contact: e.target.value})} placeholder="e.g. +880 1XXX-XXXXXX" />
                      </div>
                      <div className="form-group">
                         <label className="form-label">Host (Who are they meeting?) *</label>
                         <select className="form-select" required value={form.host_staff_id} onChange={e => setForm({...form, host_staff_id: e.target.value})}>
                            <option value="">Select Staff member</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                         </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                         <label className="form-label">Purpose of Visit *</label>
                         <input className="form-input" required value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} placeholder="e.g. Interview for Study Visa / Appointment with Manager" />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                         <label className="form-label">Additional Notes</label>
                         <textarea className="form-input" rows="3" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="e.g. Early arrival, waiting in reception area" />
                      </div>
                   </div>
                </div>
                <div className="modal-footer">
                   <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                   <button type="submit" className="btn btn-primary">Check In Visitor</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
