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
  const [viewMode, setViewMode] = useState('calendar'); // 'list' | 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [students, setStudents] = useState([]);
  const [offices, setOffices] = useState([]);
  const [filterOffice, setFilterOffice] = useState('');

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*, offices!users_office_id_fkey(*)').eq('id', session.user.id).single();
      setUser(u);

      // Load students for dropdown
      const { data: st } = await sq.order('first_name').limit(200);
      setStudents(st || []);

      const { data: off } = await supabase.from('offices').select('id, name');
      setOffices(off || []);
      if (!isSuperAdmin(u?.role)) setFilterOffice(u.office_id);

      await loadAppointments(u, u.office_id);
    };
    init();
  }, []);

  const loadAppointments = async (u, officeId) => {
    const supabase = getSupabaseClient();
    let q = supabase
      .from('appointments')
      .select(`
        *,
        students(id, first_name, last_name, phone, email),
        users!counselor_id(id, full_name, phone, email)
      `)
      .order('scheduled_at', { ascending: false });

    const currentOffice = officeId || filterOffice;
    if (!isSuperAdmin(u?.role)) {
      q = q.eq('office_id', u.office_id);
    } else if (currentOffice) {
      q = q.eq('office_id', currentOffice);
    }
    
    if (filterStatus) q = q.eq('status', filterStatus);
    if (filterDate) {
      q = q.gte('scheduled_at', filterDate + 'T00:00:00').lte('scheduled_at', filterDate + 'T23:59:59');
    }

    const { data } = await q;
    setAppointments(data || []);
    setLoading(false);
  };

  const handleWhatsApp = (appt) => {
    const student = appt.students;
    if (!student?.phone) return alert('No phone number found for this student.');
    const d = new Date(appt.scheduled_at);
    const dateStr = d.toLocaleDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const text = `Hello ${student.first_name}, this is a reminder from GT Group about your ${appt.type} appointment scheduled for ${dateStr} at ${timeStr}. We look forward to seeing you!`;
    window.open(`https://wa.me/${student.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
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
          {/* View Toggle */}
          <div className="flex-center" style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '4px' }}>
            <button
              className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('calendar')}
              style={{ borderRadius: '8px', padding: '6px 12px' }}
            >
              📅 Calendar
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
              style={{ borderRadius: '8px', padding: '6px 12px' }}
            >
              ☰ List
            </button>
          </div>
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
          value={filterOffice}
          onChange={e => { setFilterOffice(e.target.value); loadAppointments(user, e.target.value); }}
          disabled={!isSuperAdmin(user?.role)}
        >
          <option value="">All Offices</option>
          {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
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
        <button className="btn btn-secondary btn-sm" onClick={() => user && loadAppointments(user, filterOffice)}>
          Apply
        </button>
      </div>

      {viewMode === 'list' ? (
        /* Appointments List */
        loading ? (
          <div className="empty-state">
            <div className="loading-spinner" />
            <p>Loading...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <h3>No appointments found</h3>
            <p>Schedule your first appointment to get started.</p>
            <button className="btn btn-primary mt-16" onClick={() => setShowForm(true)}>
              Schedule Appointment
            </button>
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
                {appointments.map((appt) => (
                  <tr
                    key={appt.id}
                    className={
                      appt.scheduled_at < new Date().toISOString() &&
                      appt.status === 'scheduled'
                        ? styles.overdueRow
                        : ''
                    }
                  >
                    <td>
                      <a
                        href={`/students/${appt.student_id}`}
                        className="font-medium text-sm"
                        style={{ color: 'var(--color-white)' }}
                      >
                        {appt.students?.first_name} {appt.students?.last_name}
                      </a>
                    </td>
                    <td className="text-sm">{appt.type}</td>
                    <td>
                      <p className="text-sm" style={{ color: 'var(--color-white)' }}>
                        {formatDateTime(appt.scheduled_at)}
                      </p>
                      {appt.scheduled_at < new Date().toISOString() &&
                        appt.status === 'scheduled' && (
                          <span className="text-xs" style={{ color: 'var(--color-danger)' }}>
                            ⚠ Overdue
                          </span>
                        )}
                    </td>
                    <td className="text-sm text-muted">{appt.duration_minutes} min</td>
                    <td className="text-sm text-muted">{appt.users?.full_name || '—'}</td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[appt.status]}`}>
                        {appt.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-4">
                        {appt.status === 'scheduled' && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => updateStatus(appt.id, 'completed')}
                              title="Mark Complete"
                            >
                              ✓
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => updateStatus(appt.id, 'cancelled')}
                              title="Cancel"
                              style={{ color: 'var(--color-danger)' }}
                            >
                              ✕
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleWhatsApp(appt)}
                          title="Send WhatsApp Reminder"
                          style={{ color: '#25D366' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setEditAppt(appt);
                            setShowForm(true);
                          }}
                          title="Edit"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Calendar View */
        <CalendarGrid
          appointments={appointments}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onEdit={(appt) => {
            setEditAppt(appt);
            setShowForm(true);
          }}
        />
      )}

      {/* Appointment Form Modal */}
      {showForm && (
        <AppointmentModal
          appointment={editAppt}
          user={user}
          students={students}
          offices={offices}
          onClose={() => { setShowForm(false); setEditAppt(null); }}
          onSaved={() => { setShowForm(false); setEditAppt(null); user && loadAppointments(user, filterOffice); }}
        />
      )}
    </div>
  );
}

function CalendarGrid({ appointments, currentMonth, onMonthChange, onEdit }) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => onMonthChange(new Date(year, month - 1, 1));
  const nextMonth = () => onMonthChange(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = currentMonth.toLocaleString('default', { month: 'long' });

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div className="flex-between mb-24">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-white)' }}>
          {monthName} {year}
        </h2>
        <div className="flex gap-8">
          <button className="btn btn-ghost btn-sm" onClick={prevMonth}>← Prev</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onMonthChange(new Date())}>Today</button>
          <button className="btn btn-ghost btn-sm" onClick={nextMonth}>Next →</button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '12px',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '12px',
        marginBottom: '12px'
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center font-bold text-xs" style={{ color: 'var(--color-gold)', textTransform: 'uppercase' }}>{d}</div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '6px'
      }}>
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} style={{ height: '110px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }} />;
          
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayAppts = appointments.filter(a => a.scheduled_at?.startsWith(dateStr));
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

          return (
            <div key={day} style={{
              height: '110px',
              padding: '8px',
              background: isToday ? 'rgba(201,162,39,0.08)' : 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              border: isToday ? '1px solid var(--color-gold)' : '1px solid transparent',
              overflowY: 'auto'
            }}>
              <div className="flex-between mb-4">
                <span style={{ fontWeight: '600', color: isToday ? 'var(--color-gold)' : 'var(--color-text)', fontSize: '0.9rem' }}>{day}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {dayAppts.map(a => (
                  <div
                    key={a.id}
                    className={`badge ${STATUS_COLORS[a.status]}`}
                    style={{
                      fontSize: '0.65rem',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block'
                    }}
                    onClick={() => onEdit(a)}
                    title={`${a.type}: ${a.students?.first_name} ${a.students?.last_name}`}
                  >
                    {a.students?.first_name.charAt(0)}. {a.students?.last_name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentModal({ appointment, user, students, offices, onClose, onSaved }) {
  const [form, setForm] = useState({
    student_id: appointment?.student_id || '',
    type: appointment?.type || 'Initial Consultation',
    scheduled_at: appointment?.scheduled_at ? appointment.scheduled_at.slice(0, 16) : '',
    duration_minutes: appointment?.duration_minutes || 60,
    notes: appointment?.notes || '',
    counselor_id: appointment?.counselor_id || user?.id || '',
    office_id: appointment?.office_id || user?.office_id || '',
  });
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [counselors, setCounselors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [availabilityHint, setAvailabilityHint] = useState(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const loadDetails = async () => {
      // Load Counselor List
      const { data: cl } = await supabase.from('users')
        .select('id, full_name, phone, email, office_id')
        .in('role', ['counselor', 'senior_counselor', 'office_manager']);
      setCounselors(cl || []);

      if (form.student_id) {
        const { data: s } = await supabase.from('students').select('*').eq('id', form.student_id).single();
        setSelectedStudent(s);
      }
      if (form.counselor_id) {
        const counselor = cl?.find(c => c.id === form.counselor_id);
        setSelectedCounselor(counselor);
      }
    };
    loadDetails();
  }, []);

  useEffect(() => {
    if (form.counselor_id && form.scheduled_at) {
      checkAvailability();
    }
  }, [form.counselor_id, form.scheduled_at]);

  const checkAvailability = async () => {
    const supabase = getSupabaseClient();
    const date = new Date(form.scheduled_at);
    const dayOfWeek = date.getDay();
    const timeStr = date.toTimeString().split(' ')[0];
    const dateStr = date.toISOString().split('T')[0];

    // 1. Check Weekly Hours
    const { data: av } = await supabase.from('counselor_availability')
      .select('*')
      .eq('counselor_id', form.counselor_id)
      .eq('day_of_week', dayOfWeek);

    const isWithinHours = av?.some(slot => timeStr >= slot.start_time && timeStr <= slot.end_time);

    // 2. Check Vacations
    const { data: vc } = await supabase.from('counselor_vacations')
      .select('*')
      .eq('counselor_id', form.counselor_id)
      .lte('start_date', dateStr)
      .gte('end_date', dateStr);

    // 3. Check Conflicts
    const { data: conflicts } = await supabase.from('appointments')
      .select('id')
      .eq('counselor_id', form.counselor_id)
      .eq('status', 'scheduled')
      .neq('id', appointment?.id || '00000000-0000-0000-0000-000000000000')
      .gte('scheduled_at', form.scheduled_at)
      .lte('scheduled_at', new Date(date.getTime() + form.duration_minutes * 60000).toISOString());

    if (vc?.length > 0) setAvailabilityHint({ type: 'error', msg: 'Counselor is on Vacation' });
    else if (!isWithinHours && av?.length > 0) setAvailabilityHint({ type: 'warning', msg: 'Outside regular working hours' });
    else if (conflicts?.length > 0) setAvailabilityHint({ type: 'error', msg: 'Conflict with another appointment' });
    else setAvailabilityHint({ type: 'success', msg: 'Counselor is Available' });
  };

  const handleStudentChange = async (id) => {
    setForm({ ...form, student_id: id });
    const supabase = getSupabaseClient();
    const { data: s } = await supabase.from('students').select('*').eq('id', id).single();
    setSelectedStudent(s);
  };

  const handleCounselorChange = (id) => {
    setForm({ ...form, counselor_id: id });
    const counselor = counselors.find(c => c.id === id);
    setSelectedCounselor(counselor);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (availabilityHint?.type === 'error' && !confirm('There is a scheduling conflict. Proceed anyway?')) return;
    
    setSaving(true);
    const supabase = getSupabaseClient();
    const payload = {
      ...form,
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
      <div className="modal" style={{ maxWidth: '600px' }}>
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
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Office *</label>
                <select className="form-select" required value={form.office_id} onChange={e => setForm({...form, office_id: e.target.value})} disabled={!isSuperAdmin(user?.role)}>
                  <option value="">Select office...</option>
                  {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Student *</label>
                <select className="form-select" required value={form.student_id} onChange={e => handleStudentChange(e.target.value)}>
                  <option value="">Select student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
            </div>

            {selectedStudent && (
              <div className="flex gap-12 mb-16 p-8" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.75rem' }}>
                <span className="text-muted">📞 {selectedStudent.phone || 'No phone'}</span>
                <span className="text-muted">✉ {selectedStudent.email || 'No email'}</span>
              </div>
            )}

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Appointment Type *</label>
                <select className="form-select" required value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  {APPOINTMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Counselor *</label>
                <select className="form-select" required value={form.counselor_id} onChange={e => handleCounselorChange(e.target.value)}>
                  <option value="">Select counselor...</option>
                  {counselors.filter(c => !form.office_id || c.office_id === form.office_id).map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
            </div>

            {selectedCounselor && (
              <div className="flex gap-12 mb-16 p-8" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.75rem' }}>
                <span className="text-muted">📞 {selectedCounselor.phone || 'No phone'}</span>
                <span className="text-muted">✉ {selectedCounselor.email || 'No email'}</span>
              </div>
            )}

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Date & Time *</label>
                <input className="form-input" type="datetime-local" required value={form.scheduled_at}
                  onChange={e => setForm({...form, scheduled_at: e.target.value})} />
                {availabilityHint && (
                  <p style={{ fontSize: '0.7rem', marginTop: '4px', color: availabilityHint.type === 'error' ? '#EF4444' : availabilityHint.type === 'warning' ? '#F59E0B' : '#10B981' }}>
                    {availabilityHint.type === 'error' ? '❌' : availabilityHint.type === 'warning' ? '⚠' : '✅'} {availabilityHint.msg}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input className="form-input" type="number" min="15" step="15" value={form.duration_minutes}
                  onChange={e => setForm({...form, duration_minutes: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Meeting Notes</label>
              <textarea className="form-textarea" placeholder="Meeting agenda, notes..." value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})} style={{ minHeight: '80px' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : appointment ? 'Update Appointment' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
