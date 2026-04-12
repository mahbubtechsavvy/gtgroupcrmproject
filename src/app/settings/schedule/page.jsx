'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import Link from 'next/link';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SchedulePage() {
  const [user, setUser] = useState(null);
  const [counselors, setCounselors] = useState([]);
  const [targetId, setTargetId] = useState('');
  const [availability, setAvailability] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [overtime, setOvertime] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [offices, setOffices] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState('');
  const [holidays, setHolidays] = useState([]);
  const [activeTab, setActiveTab] = useState('schedule'); // schedule, overtime, history
  const [allStaffSchedules, setAllStaffSchedules] = useState({ staff: [], vcs: [], ot: [] }); 

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setUser(u);
      setTargetId(u.id);
      setSelectedOffice(u.office_id || '');

      if (isSuperAdmin(u.role)) {
        const { data: off } = await supabase.from('offices').select('*');
        setOffices(off || []);
        
        // Initial staff list for your own office — INCLUDE ALL ROLES
        const { data: cl } = await supabase.from('users')
          .select('id, full_name, role, office_id')
          .eq('office_id', u.office_id)
          .order('full_name');
        setCounselors(cl || []);

        await loadAllStaffSchedules();
      }

      await loadSchedule(u.id, u.office_id);
    };
    init();
  }, []);

  const loadAllStaffSchedules = async () => {
    const supabase = getSupabaseClient();
    const { data: staff } = await supabase.from('users')
      .select('id, full_name, role, office_id, offices(name)')
      .order('full_name');
    
    const { data: vcs } = await supabase.from('counselor_vacations').select('*, users(full_name)');
    const { data: ot } = await supabase.from('staff_overtime').select('*, users(full_name)').order('created_at', { ascending: false });
    
    setAllStaffSchedules({ staff: staff || [], vcs: vcs || [], ot: ot || [] });
  };

  const loadSchedule = async (userId, officeId) => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data: av } = await supabase.from('counselor_availability').select('*').eq('counselor_id', userId).order('day_of_week');
    const { data: vc } = await supabase.from('counselor_vacations').select('*').eq('counselor_id', userId).order('start_date');
    const { data: ot } = await supabase.from('staff_overtime').select('*').eq('staff_id', userId).order('date', { ascending: false });
    const { data: hist } = await supabase.from('counselor_schedule_history').select('*, users!changed_by(full_name)').eq('counselor_id', userId).order('changed_at', { ascending: false });
    
    // Also fetch holidays for this office's country
    const { data: office } = await supabase.from('offices').select('country').eq('id', officeId).single();
    const { data: hol } = await supabase.from('office_holidays').select('*').eq('country', office?.country || '');
    
    setAvailability(av || []);
    setVacations(vc || []);
    setOvertime(ot || []);
    setHistory(hist || []);
    setHolidays(hol || []);
    setHasChanges(false);
    setLoading(false);
  };

  const handleTargetChange = (id, currentCounselors = counselors) => {
    setTargetId(id);
    const staff = currentCounselors.find(c => c.id === id) || user;
    loadSchedule(id, staff.office_id);
  };

  const handleOfficeChange = async (officeId) => {
    setSelectedOffice(officeId);
    const supabase = getSupabaseClient();
    const { data: cl } = await supabase.from('users')
      .select('id, full_name, role, office_id')
      .eq('office_id', officeId)
      .order('full_name');
    
    setCounselors(cl || []);
    if (cl?.length > 0) {
      handleTargetChange(cl[0].id, cl);
    }
  };

  const addSlot = (day) => {
    const newSlot = { 
      id: `temp-${Math.random()}`, 
      counselor_id: targetId, 
      day_of_week: day, 
      start_time: '09:00:00', 
      end_time: '17:00:00',
      isNew: true
    };
    setAvailability([...availability, newSlot]);
    setHasChanges(true);
  };

  const updateSlot = (id, field, value) => {
    setAvailability(availability.map(s => s.id === id ? { ...s, [field]: value, isModified: true } : s));
    setHasChanges(true);
  };

  const deleteSlot = (id) => {
    setAvailability(availability.map(s => s.id === id ? { ...s, isDeleted: true } : s));
    setHasChanges(true);
  };

  const addVacation = () => {
    const newVac = {
      id: `temp-${Math.random()}`,
      counselor_id: targetId,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      reason: 'Vacation',
      status: 'pending',
      isNew: true
    };
    setVacations([...vacations, newVac]);
    setHasChanges(true);
  };

  const updateVacation = (id, field, value) => {
    setVacations(vacations.map(v => v.id === id ? { ...v, [field]: value, isModified: true } : v));
    setHasChanges(true);
  };

  const deleteVacation = (id) => {
    setVacations(vacations.map(v => v.id === id ? { ...v, isDeleted: true } : v));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    const supabase = getSupabaseClient();
    
    // Fetch OLD schedule for history
    const { data: oldAv } = await supabase.from('counselor_availability').select('*').eq('counselor_id', targetId);

    // Process Availability
    const avToInsert = availability.filter(s => s.isNew && !s.isDeleted).map(({ id, isNew, ...rest }) => rest);
    const avToUpdate = availability.filter(s => s.isModified && !s.isNew && !s.isDeleted).map(({ isModified, ...rest }) => rest);
    const avToDelete = availability.filter(s => s.isDeleted && !s.isNew).map(s => s.id);

    if (avToInsert.length) await supabase.from('counselor_availability').insert(avToInsert);
    for (const s of avToUpdate) await supabase.from('counselor_availability').update(s).eq('id', s.id);
    if (avToDelete.length) await supabase.from('counselor_availability').delete().in('id', avToDelete);

    // Process Vacations
    const vcToInsert = vacations.filter(v => v.isNew && !v.isDeleted).map(({ id, isNew, ...rest }) => rest);
    const vcToUpdate = vacations.filter(v => v.isModified && !v.isNew && !v.isDeleted).map(({ isModified, ...rest }) => rest);
    const vcToDelete = vacations.filter(v => v.isDeleted && !v.isNew).map(v => v.id);

    if (vcToInsert.length) await supabase.from('counselor_vacations').insert(vcToInsert);
    for (const v of vcToUpdate) await supabase.from('counselor_vacations').update(v).eq('id', v.id);
    if (vcToDelete.length) await supabase.from('counselor_vacations').delete().in('id', vcToDelete);

    // LOG HISTORY
    await supabase.from('counselor_schedule_history').insert({
      counselor_id: targetId,
      changed_by: user.id,
      old_schedule: oldAv,
      new_schedule: availability.filter(s => !s.isDeleted).map(({ isNew, isModified, ...rest }) => rest)
    });

    alert('Changes saved successfully!');
    setHasChanges(false);
    setSaving(false);
    loadSchedule(targetId, (counselors.find(c => c.id === targetId) || user).office_id);
    if (isSuperAdmin(user?.role)) loadAllStaffSchedules();
  };

  const approveVacation = async (id, status) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('counselor_vacations').update({ status }).eq('id', id);
    if (!error) {
      setVacations(vacations.map(v => v.id === id ? { ...v, status } : v));
      
      // Notify staff
      await supabase.from('notifications').insert({
        user_id: targetId,
        title: `Vacation ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your leave request for ${vacations.find(v => v.id === id)?.start_date} was ${status}.`,
        type: status === 'approved' ? 'success' : 'error'
      });

      alert(`Vacation ${status}! Notification sent to staff.`);
    }
    if (isSuperAdmin(user?.role)) loadAllStaffSchedules();
  };

  const handleOvertimeAction = async (id, status) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('staff_overtime').update({ 
      status, 
      approved_by: user.id 
    }).eq('id', id);
    
    if (!error) {
      setOvertime(overtime.map(ot => ot.id === id ? { ...ot, status, approved_by: user.id } : ot));
      alert(`Overtime ${status}!`);
      if (isSuperAdmin(user?.role)) loadAllStaffSchedules();
    }
  };

  const handleAddOvertime = async () => {
    const hours = prompt('Number of Overtime Hours:');
    const date = prompt('Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!hours || !date) return;

    const supabase = getSupabaseClient();
    const { data: newOt, error } = await supabase.from('staff_overtime').insert({
      staff_id: targetId,
      date,
      hours: parseFloat(hours),
      reason: 'Manual Admin Add',
      status: 'approved',
      approved_by: user.id
    }).select().single();

    if (!error) {
      setOvertime([newOt, ...overtime]);
      alert('Overtime added and approved!');
      if (isSuperAdmin(user?.role)) loadAllStaffSchedules();
    }
  };

  const handleAddHoliday = async () => {
    const name = prompt('Holiday Name (e.g. Eid, Chuseok):');
    const date = prompt('Date (YYYY-MM-DD):');
    if (!name || !date) return;
    
    const supabase = getSupabaseClient();
    const { data: office } = await supabase.from('offices').select('country').eq('id', selectedOffice || user.office_id).single();
    
    await supabase.from('office_holidays').insert({
      name,
      holiday_date: date,
      country: office.country,
      is_mandatory: true
    });
    loadSchedule(targetId, selectedOffice || user.office_id);
  };

  const deleteHoliday = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;
    const supabase = getSupabaseClient();
    await supabase.from('office_holidays').delete().eq('id', id);
    setHolidays(holidays.filter(h => h.id !== id));
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <h1 className="page-title">Work Schedule & Vacations</h1>
          <p className="page-subtitle">Manage weekly availability and time off</p>
        </div>
        <div className="flex gap-12">
          {hasChanges && (
            <button className="btn btn-primary" onClick={handleSaveChanges} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          <Link href="/settings" className="btn btn-secondary">← Back to Settings</Link>
        </div>
      </div>

      {isSuperAdmin(user?.role) && (
        <div className="flex gap-16 mb-24">
          <div className="card" style={{ flex: 1 }}>
            <label className="form-label">Office:</label>
            <select className="form-select" value={selectedOffice} onChange={e => handleOfficeChange(e.target.value)}>
              <option value="">Select Office...</option>
              {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div className="card" style={{ flex: 1 }}>
            <label className="form-label">Staff Member:</label>
            <select className="form-select" value={targetId} onChange={e => handleTargetChange(e.target.value)}>
              <option value={user.id}>My Own Schedule</option>
              {counselors.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.role})</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="flex gap-16 mb-24 border-b border-white-10">
        <button className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>Weekly Schedule</button>
        <button className={`tab-btn ${activeTab === 'overtime' ? 'active' : ''}`} onClick={() => setActiveTab('overtime')}>Overtime Tracker</button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Schedule History</button>
      </div>

      {activeTab === 'schedule' && (
        <div className="grid-2">
          {/* Weekly Availability */}
          <div className="card">
            <h3 className="section-title mb-20">Weekly Working Hours</h3>
            {loading ? <div className="loading-spinner" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {DAYS.map((dayName, index) => {
                  const daySlots = availability.filter(s => s.day_of_week === index && !s.isDeleted);
                  return (
                    <div key={dayName} style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex-between mb-8">
                        <span className="font-semibold" style={{ color: 'var(--color-gold)' }}>{dayName}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => addSlot(index)}>+ Add Slot</button>
                      </div>
                      {daySlots.length === 0 ? <p className="text-xs text-muted">No working hours set (Off Day)</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {daySlots.map(slot => (
                            <div key={slot.id} className="flex gap-8 align-center">
                              <input type="time" className="form-input btn-sm" value={slot.start_time} onChange={e => updateSlot(slot.id, 'start_time', e.target.value)} style={{ width: 'auto' }} />
                              <span className="text-muted">to</span>
                              <input type="time" className="form-input btn-sm" value={slot.end_time} onChange={e => updateSlot(slot.id, 'end_time', e.target.value)} style={{ width: 'auto' }} />
                              <button className="btn btn-ghost btn-sm" onClick={() => deleteSlot(slot.id)} style={{ color: 'var(--color-danger)' }}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vacations & Holidays */}
          <div>
            <div className="card mb-16">
              <div className="flex-between mb-20">
                <h3 className="section-title">Office Holidays</h3>
                {isSuperAdmin(user?.role) && (
                  <button className="btn btn-ghost btn-sm" onClick={handleAddHoliday}>+ Add Holiday</button>
                )}
              </div>
              {holidays.length === 0 ? <p className="text-xs text-muted">No holidays found for this office.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {holidays.map(h => (
                    <div key={h.id} className="flex-between p-8" style={{ background: 'rgba(201,162,39,0.05)', borderRadius: '6px', border: '1px solid rgba(201,162,39,0.1)' }}>
                      <div>
                        <span className="text-sm font-semibold">{h.name}</span>
                        <p className="text-xs text-muted">{new Date(h.holiday_date).toLocaleDateString()}</p>
                      </div>
                      {isSuperAdmin(user?.role) && (
                        <button className="btn btn-ghost btn-sm" onClick={() => deleteHoliday(h.id)} style={{ color: 'var(--color-danger)' }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-between mb-20">
              <h3 className="section-title">Vacation Days & Time Off</h3>
              <button className="btn btn-primary btn-sm" onClick={addVacation}>+ Add Vacation</button>
            </div>
            {loading ? <div className="loading-spinner" /> : (vacations.filter(v => !v.isDeleted).length === 0) ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <p className="text-muted">No vacations scheduled</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {vacations.filter(v => !v.isDeleted).map(v => (
                  <div key={v.id} className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', border: v.status === 'approved' ? '1px solid var(--color-success)' : v.status === 'rejected' ? '1px solid var(--color-danger)' : '' }}>
                    <div className="flex-between mb-8">
                      <span className={`badge ${v.status === 'approved' ? 'badge-success' : v.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {v.status.toUpperCase()}
                      </span>
                      {isSuperAdmin(user?.role) && v.status === 'pending' && (
                        <div className="flex gap-4">
                          <button className="btn btn-secondary btn-sm" onClick={() => approveVacation(v.id, 'approved')}>Approve</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => approveVacation(v.id, 'rejected')} style={{ color: 'var(--color-danger)' }}>Reject</button>
                        </div>
                      )}
                    </div>
                    <div className="grid-2 mb-8">
                      <div className="form-group">
                        <label className="text-xs text-muted">Start Date</label>
                        <input type="date" className="form-input btn-sm" value={v.start_date} onChange={e => updateVacation(v.id, 'start_date', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="text-xs text-muted">End Date</label>
                        <input type="date" className="form-input btn-sm" value={v.end_date} onChange={e => updateVacation(v.id, 'end_date', e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-8">
                      <input className="form-input btn-sm" value={v.reason} placeholder="Reason (e.g. Annual Leave)" onChange={e => updateVacation(v.id, 'reason', e.target.value)} />
                      <button className="btn btn-ghost btn-sm" onClick={() => deleteVacation(v.id)} style={{ color: 'var(--color-danger)' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'overtime' && (
        <div className="card">
          <div className="flex-between mb-24">
            <h3 className="section-title">Overtime Tracking</h3>
            {isSuperAdmin(user?.role) ? (
              <button className="btn btn-primary btn-sm" onClick={handleAddOvertime}>+ Manual Add Overtime</button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={handleAddOvertime}>Request Overtime</button>
            )}
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {overtime.map(ot => (
                  <tr key={ot.id}>
                    <td>{ot.date}</td>
                    <td>{ot.hours} hrs</td>
                    <td>{ot.reason}</td>
                    <td><span className={`badge badge-${ot.status === 'pending' ? 'warning' : ot.status === 'approved' ? 'success' : 'danger'}`}>{ot.status}</span></td>
                    <td>
                      {isSuperAdmin(user?.role) && ot.status === 'pending' && (
                        <div className="flex gap-8">
                          <button className="btn btn-primary btn-xs" onClick={() => handleOvertimeAction(ot.id, 'approved')}>Approve</button>
                          <button className="btn btn-ghost btn-xs" onClick={() => handleOvertimeAction(ot.id, 'rejected')} style={{ color: 'var(--color-danger)' }}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <h3 className="section-title mb-24">Schedule Change History</h3>
          <div className="timeline">
            {history.map(item => (
              <div key={item.id} className="timeline-item pb-16 mb-16 border-b border-white-5">
                <div className="flex-between mb-8">
                  <span className="text-sm font-semibold">{item.users?.full_name} changed the schedule</span>
                  <span className="text-xs text-muted">{new Date(item.changed_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted">Weekly hours were updated for this staff member.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSuperAdmin(user?.role) && (
        <div className="card mt-24" style={{ background: 'rgba(201, 162, 39, 0.05)', border: '1px solid var(--color-gold)' }}>
          <h2 className="section-title mb-20" style={{ color: 'var(--color-gold)' }}>👑 Admin Command Center (Global Overview)</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Office</th>
                  <th>Role</th>
                  <th>Status Today</th>
                  <th>Pending Requests</th>
                </tr>
              </thead>
              <tbody>
                {allStaffSchedules.staff.map(s => {
                  const pendingVacations = allStaffSchedules.vcs.filter(v => v.counselor_id === s.id && v.status === 'pending');
                  const pendingOvertime = allStaffSchedules.ot.filter(o => o.staff_id === s.id && o.status === 'pending');
                  return (
                    <tr key={s.id} onClick={() => handleTargetChange(s.id, allStaffSchedules.staff)} style={{ cursor: 'pointer' }}>
                      <td className="font-semibold">{s.full_name}</td>
                      <td>{s.offices?.name}</td>
                      <td>{s.role}</td>
                      <td>
                        <span className="badge badge-success">In Office</span>
                      </td>
                      <td>
                        <div className="flex gap-8">
                          {pendingVacations.length > 0 && <span className="badge badge-warning">{pendingVacations.length} Vacation</span>}
                          {pendingOvertime.length > 0 && <span className="badge badge-info">{pendingOvertime.length} Overtime</span>}
                          {pendingVacations.length === 0 && pendingOvertime.length === 0 && <span className="text-muted text-xs">No pending</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
