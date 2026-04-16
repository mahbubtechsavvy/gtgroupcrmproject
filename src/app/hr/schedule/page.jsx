'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XSquare, 
  Calendar, 
  Plus, 
  Search,
  Filter,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { getRoleLabel } from '@/lib/auth';
import styles from './hr.module.css';

export default function HRAttendancePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [myTodayEntry, setMyTodayEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [notes, setNotes] = useState('');
  const [officeStats, setOfficeStats] = useState({ totalWorkingDays: 22, present: 0, late: 0, overtime: 0 });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    fetchData();
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    const supabase = getSupabaseClient();
    try {
      // 1. Get Current User
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: user } = await supabase
        .from('users')
        .select('*, offices(id, name)')
        .eq('id', session.user.id)
        .single();
      
      setCurrentUser(user);

      // 2. Get Today's Logs for the office
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/hr/attendance?officeId=${user.office_id}&date=${today}`);
      const logs = await res.json();
      setAttendance(logs || []);

      // 3. Check for current user's entry today
      const myLog = (logs || []).find(l => l.staff_id === user.id);
      setMyTodayEntry(myLog);
      
      // Calculate basic stats for display
      setOfficeStats({
        totalWorkingDays: 22,
        present: (logs || []).length,
        late: (logs || []).filter(l => l.status === 'late').length,
        overtime: (logs || []).reduce((acc, l) => acc + (l.overtime_hours || 0), 0)
      });

    } catch (err) {
      console.error('Failed to fetch HR data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type) => {
    if (!currentUser) return;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeNow = now.toLocaleTimeString('en-GB');

    const body = {
      staff_id: currentUser.id,
      office_id: currentUser.office_id,
      date: today,
      notes: notes || `Auto-logged ${type} at ${timeNow}`
    };

    if (type === 'check-in') {
      body.check_in = timeNow;
      // Simple logic: if after 9:15, mark as late
      const hour = now.getHours();
      const min = now.getMinutes();
      if (hour > 9 || (hour === 9 && min > 15)) body.status = 'late';
    } else {
      body.check_out = timeNow;
    }

    try {
      const res = await fetch('/api/hr/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setNotes('');
        fetchData();
        alert(`Successfully logged ${type}! ✅`);
      }
    } catch (err) {
      alert(`Error logging ${type}. ❌`);
    }
  };

  if (loading) return <div className="empty-state">Loading Work Schedule...</div>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <h1>Work Schedule</h1>
          <p>{currentUser?.offices?.name} Office • Staff Attendance & HR Portal</p>
        </div>
        <div className={styles.timer}>{time}</div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Monthly Working Days</h3>
          <div className={styles.value}>{officeStats.totalWorkingDays}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Total Present Today</h3>
          <div className={styles.value}>{officeStats.present}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Late Arrivals</h3>
          <div className={styles.value} style={{ color: '#eab308' }}>{officeStats.late}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Office Overtime (Hrs)</h3>
          <div className={styles.value} style={{ color: '#22c55e' }}>{officeStats.overtime}</div>
        </div>
      </div>

      {/* Control Panel */}
      <div className={styles.controlPanel}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div>
            <p className="text-xs text-muted mb-4">STATUS</p>
            <div className="flex items-center gap-8">
               {myTodayEntry ? (
                 <CheckCircle2 color="#22c55e" size={20} />
               ) : (
                 <AlertCircle color="#eab308" size={20} />
               )}
               <span className="font-bold">
                 {myTodayEntry ? (myTodayEntry.check_out ? 'Signed Off' : 'On Duty') : 'Not Checked In'}
               </span>
            </div>
          </div>
          <div style={{ width: '300px' }}>
             <p className="text-xs text-muted mb-4">NOTES (EXAMPLE: "Completed paperwork for Student 204")</p>
             <input 
               className="form-input" 
               placeholder="e.g. Started documentation for Student 102" 
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               style={{ background: 'var(--color-dark)' }}
             />
          </div>
        </div>

        <div className={styles.btnGroup}>
          {!myTodayEntry && (
            <button className={styles.btnPrimary} onClick={() => handleAction('check-in')}>
              <UserCheck size={18} /> Check In
            </button>
          )}
          {myTodayEntry && !myTodayEntry.check_out && (
             <button className={styles.btnPrimary} onClick={() => handleAction('check-out')} style={{ background: 'var(--color-danger)', color: 'white' }}>
               <Clock size={18} /> Check Out
             </button>
          )}
          <button className={styles.btnSecondary} onClick={() => fetchData()}>
             Refresh
          </button>
        </div>
      </div>

      {/* Attendance List */}
      <div className={styles.attendanceList}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
           <h3 className="font-bold">Today's Attendance Log ({new Date().toDateString()})</h3>
           <div className="flex gap-12">
              <Search size={18} className="text-muted" />
              <Filter size={18} className="text-muted" />
           </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Employee ID</th>
              <th>Status</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Notes / Action Plan</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length > 0 ? attendance.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="flex gap-8 items-center">
                    <div className="avatar avatar-xs">{row.users?.full_name?.charAt(0)}</div>
                    <div>
                      <div className="font-bold">{row.users?.full_name}</div>
                      <div className="text-xs text-muted">{getRoleLabel(row.users?.role)}</div>
                    </div>
                  </div>
                </td>
                <td className="font-mono text-gold">{row.users?.employee_id}</td>
                <td>
                  <span className={`${styles.statusBadge} ${
                    row.status === 'present' ? styles.statusPresent :
                    row.status === 'late' ? styles.statusLate : styles.statusAbsent
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="font-mono">{row.check_in || '--:--'}</td>
                <td className="font-mono">{row.check_out || '--:--'}</td>
                <td className="text-sm text-muted italic">
                  {row.notes || 'No notes provided'}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'rgba(232,232,232,0.3)' }}>
                   No attendance logged today yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
