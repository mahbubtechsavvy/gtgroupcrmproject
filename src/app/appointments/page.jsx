'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import styles from './appointments.module.css';

const APPOINTMENT_TYPES = [
  'Initial Consultation', 'Document Review', 'Application Review',
  'Mock Interview / Visa Preparation', 'Follow-up Call', 'Walk-in Meeting'
];

const STATUS_COLORS = {
  scheduled: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-danger',
  no_show: 'badge-warning',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editAppt, setEditAppt] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*, offices!users_office_id_fkey(*)').eq('id', session.user.id).single();
      setUser(u);

      // Load students for dropdown
      let sq = supabase.from('students').select('id, first_name, last_name');
      if (!isSuperAdmin(u?.role)) sq = sq.eq('office_id', u.office_id);
      const { data: st } = await sq.order('first_name').limit(200);
      setStudents(st || []);

      await loadAppointments(u);
    };
    init();
  }, []);

  const loadAppointments = async (u) => {
    const supabase = getSupabaseClient();
    let q = supabase
      .from('appointments')
      .select(`
        *,
        students(id, first_name, last_name),
        users!counselor_id(id, full_name)
      `)
      .order('scheduled_at', { ascending: false });

    if (!isSuperAdmin(u?.role)) {
      q = q.eq('office_id', u.office_id);
    }
    if (filterStatus) q = q.eq('status', filterStatus);
    if (filterDate) {
      q = q.gte('scheduled_at', filterDate + 'T00:00:00').lte('scheduled_at', filterDate + 'T23:59:59');
    }

    const { data } = await q;
    setAppointments(data || []);
    setLoading(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.scheduled_at?.startsWith(today) && a.status === 'scheduled');
  const upcoming = appointments.filter(a => a.scheduled_at > new Date().toISOString() && a.status === 'scheduled');
  const overdue = appointments.filter(a => a.scheduled_at < new Date().toISOString() && a.status === 'scheduled');

  const formatDateTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const updateStatus = async (id, status) => {
    const supabase = getSupabaseClient();
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Schedule and track student consultations</p>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-primary" onClick={() => { setEditAppt(null); setShowForm(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Schedule Appointment
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="kpi-grid mb-24">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="kpi-value">{todayAppts.length}</div>
          <div className="kpi-label">Today</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div className="kpi-value">{upcoming.length}</div>
          <div className="kpi-label">Upcoming</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="kpi-value">{overdue.length}</div>
          <div className="kpi-label">Overdue</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(201,162,39,0.15)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0C040" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="kpi-value">{appointments.filter(a => a.status === 'completed').length}</div>
          <div className="kpi-label">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="search-filter-bar mb-20">
        <input
          type="date"
          className="form-input"
          style={{ width: '180px' }}
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
        {(filterStatus || filterDate) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterDate(''); }}>
            Clear
          </button>
        )}
        <button className="btn btn-secondary btn-sm" onClick={() => user && loadAppointments(user)}>
          Apply
        </button>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="empty-state"><div className="loading-spinner" /><p>Loading...</p></div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <h3>No appointments found</h3>
          <p>Schedule your first appointment to get started.</p>
          <button className="btn btn-primary mt-16" onClick={() => setShowForm(true)}>Schedule Appointment</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Type</th>
                <th>Date & Time</th>
                <th>Duration</th>
                <th>Counselor</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(appt => (
                <tr key={appt.id} className={appt.scheduled_at < new Date().toISOString() && appt.status === 'scheduled' ? styles.overdueRow : ''}>
                  <td>
                    <a href={`/students/${appt.student_id}`} className="font-medium text-sm" style={{ color: 'var(--color-white)' }}>
                      {appt.students?.first_name} {appt.students?.last_name}
                    </a>
                  </td>
                  <td className="text-sm">{appt.type}</td>
                  <td>
                    <p className="text-sm" style={{ color: 'var(--color-white)' }}>
                      {formatDateTime(appt.scheduled_at)}
                    </p>
                    {appt.scheduled_at < new Date().toISOString() && appt.status === 'scheduled' && (
                      <span className="text-xs" style={{ color: 'var(--color-danger)' }}>⚠ Overdue</span>
                    )}
                  </td>
                  <td className="text-sm text-muted">{appt.duration_minutes} min</td>
                  <td className="text-sm text-muted">{appt.users?.full_name || '—'}</td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[appt.status]}`}>{appt.status?.replace('_', ' ')}</span>
                  </td>
                  <td>
                    <div className="flex gap-4">
                      {appt.status === 'scheduled' && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => updateStatus(appt.id, 'completed')}
                            title="Mark Complete"
                          >✓</button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => updateStatus(appt.id, 'cancelled')}
                            title="Cancel"
                            style={{ color: 'var(--color-danger)' }}
                          >✕</button>
                        </>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setEditAppt(appt); setShowForm(true); }}
                        title="Edit"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Appointment Form Modal */}
      {showForm && (
        <AppointmentModal
          appointment={editAppt}
          user={user}
          students={students}
          onClose={() => { setShowForm(false); setEditAppt(null); }}
          onSaved={() => { setShowForm(false); setEditAppt(null); user && loadAppointments(user); }}
        />
      )}
    </div>
  );
}

function AppointmentModal({ appointment, user, students, onClose, onSaved }) {
  const [form, setForm] = useState({
    student_id: appointment?.student_id || '',
    type: appointment?.type || 'Initial Consultation',
    scheduled_at: appointment?.scheduled_at ? appointment.scheduled_at.slice(0, 16) : '',
    duration_minutes: appointment?.duration_minutes || 60,
    notes: appointment?.notes || '',
    counselor_id: appointment?.counselor_id || user?.id || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const { data: u } = await supabase.from('users').select('office_id').eq('id', session.user.id).single();

    const payload = {
      ...form,
      office_id: u?.office_id,
      duration_minutes: parseInt(form.duration_minutes),
    };

    if (appointment?.id) {
      await supabase.from('appointments').update(payload).eq('id', appointment.id);
    } else {
      await supabase.from('appointments').insert(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{appointment ? 'Edit Appointment' : 'Schedule Appointment'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Student *</label>
              <select className="form-select" required value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})}>
                <option value="">Select student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Appointment Type *</label>
                <select className="form-select" required value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  {APPOINTMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input className="form-input" type="number" min="15" step="15" value={form.duration_minutes}
                  onChange={e => setForm({...form, duration_minutes: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Date & Time *</label>
              <input className="form-input" type="datetime-local" required value={form.scheduled_at}
                onChange={e => setForm({...form, scheduled_at: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" placeholder="Meeting agenda, notes..." value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})} style={{ minHeight: '80px' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : appointment ? 'Update' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
