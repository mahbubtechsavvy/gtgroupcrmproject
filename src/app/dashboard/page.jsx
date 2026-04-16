'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/layout/AppLayout';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import { Copy, Check, Ticket as TicketIcon, Video, Link as LinkIcon } from 'lucide-react';
import { generateMeetLink, createMeetingInvite, validateMeetingEvent } from '@/lib/googleMeet';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import styles from './dashboard.module.css';
import DailySchedule from '@/components/dashboard/DailySchedule';

const PIPELINE_STAGES = [
  { key: 'new_lead', label: 'New Lead', color: '#6B7280' },
  { key: 'initial_consultation', label: 'Consultation', color: '#3B82F6' },
  { key: 'documents_collecting', label: 'Documents', color: '#F59E0B' },
  { key: 'application_submitted', label: 'Applied', color: '#8B5CF6' },
  { key: 'offer_received', label: 'Offer Received', color: '#06B6D4' },
  { key: 'visa_applied', label: 'Visa Applied', color: '#F97316' },
  { key: 'visa_approved', label: 'Visa Approved', color: '#10B981' },
  { key: 'enrolled', label: 'Enrolled', color: '#C9A227' },
];

const LEAD_SOURCE_COLORS = {
  Facebook: '#1877F2', Instagram: '#E4405F', Referral: '#10B981',
  'Walk-in': '#F59E0B', Website: '#3B82F6', WhatsApp: '#25D366',
  LinkedIn: '#0A66C2', Other: '#6B7280',
};

export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState([]);
  const [leadSourceData, setLeadSourceData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [broadcast, setBroadcast] = useState({ type: 'crm', target: 'all', message: '' });
  const [officeStats, setOfficeStats] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [broadcastNotifications, setBroadcastNotifications] = useState([]);
  const [myTaskPeriod, setMyTaskPeriod] = useState('all'); // all, daily, weekly, monthly
  const [officeTaskPeriod, setOfficeTaskPeriod] = useState('all');
  const [officeTaskTarget, setOfficeTaskTarget] = useState('all');
  const [officeTaskInputs, setOfficeTaskInputs] = useState({ content: '', period: 'daily', priority: 'normal' });
  const [selectedStaffMembers, setSelectedStaffMembers] = useState([]);
  const [officeFilterForStaff, setOfficeFilterForStaff] = useState('all');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [isAssigningTask, setIsAssigningTask] = useState(false);
  const [myTasksActiveTab, setMyTasksActiveTab] = useState('tasks'); // tasks, events
  const [taskEvents, setTaskEvents] = useState([]);
  const [officeTaskHistory, setOfficeTaskHistory] = useState([]);
  const [newEventInput, setNewEventInput] = useState({ title: '', date: '', time: '', office: 'all', isOnline: false });
  const [generatedMeetLink, setGeneratedMeetLink] = useState(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [allStudents, setAllStudents] = useState([]);

  const superAdmin = isSuperAdmin(user?.role);
  
  const loadDashboardData = useCallback(async () => {
    const supabase = getSupabaseClient();
    setLoading(true);

    try {
      // 1. Students & KPIs
      let studentQuery = supabase.from('students').select('*');
      if (!superAdmin) studentQuery = studentQuery.eq('office_id', user.office_id);
      const { data: students } = await studentQuery;

      if (students) {
        setStats({
          total: students.length,
          activeLeads: students.filter(s => !['enrolled', 'rejected', 'deferred'].includes(s.pipeline_status)).length,
          enrolled: students.filter(s => s.pipeline_status === 'enrolled').length,
          visaApproved: students.filter(s => ['visa_approved', 'enrolled'].includes(s.pipeline_status)).length
        });

        const pipelineCounts = {};
        PIPELINE_STAGES.forEach(s => { pipelineCounts[s.key] = 0; });
        students.forEach(s => { if (pipelineCounts[s.pipeline_status] !== undefined) pipelineCounts[s.pipeline_status]++; });
        setPipelineData(PIPELINE_STAGES.map(s => ({ name: s.label, count: pipelineCounts[s.key], color: s.color })).filter(s => s.count > 0));

        const sourceCounts = {};
        students.forEach(s => { const src = s.lead_source || 'Other'; sourceCounts[src] = (sourceCounts[src] || 0) + 1; });
        setLeadSourceData(Object.entries(sourceCounts).map(([name, value]) => ({ name, value, color: LEAD_SOURCE_COLORS[name] || '#6B7280' })));
        setAllStudents(students || []);
      }

      // 2. Revenue
      let payQuery = supabase.from('payments').select('amount, payment_date');
      if (!superAdmin) payQuery = payQuery.eq('office_id', user.office_id);
      const { data: payments } = await payQuery;
      if (payments) {
        const revMonths = Array.from({length: 6}, (_, i) => {
          const d = new Date(); d.setMonth(d.getMonth() - (5-i));
          return { name: d.toLocaleString('default', { month: 'short' }), total: 0, year: d.getFullYear(), month: d.getMonth() };
        });
        payments.forEach(p => {
          const d = new Date(p.payment_date);
          const m = revMonths.find(rm => rm.year === d.getFullYear() && rm.month === d.getMonth());
          if (m) m.total += Number(p.amount);
        });
        setRevenueData(revMonths.map(m => ({ name: m.name, Revenue: m.total })));
      }

      // 3. Appointments & Interactions
      const todayStr = new Date().toISOString().split('T')[0];
      let apptQuery = supabase.from('appointments').select('*, students(first_name, last_name), users!counselor_id(full_name)').gte('scheduled_at', todayStr + 'T00:00:00').lte('scheduled_at', todayStr + 'T23:59:59').eq('status', 'scheduled');
      if (!superAdmin) apptQuery = apptQuery.eq('office_id', user.office_id);
      const { data: appts } = await apptQuery;
      setTodayAppointments(appts || []);

      const { data: interacts } = await supabase.from('interactions').select('*, students(first_name, last_name), users!staff_id(full_name)').order('created_at', { ascending: false }).limit(8);
      setRecentActivity(interacts || []);

      // 4. Tasks & Holidays
      const { data: t } = await supabase.from('staff_tasks').select('*, users!created_by(full_name)').order('created_at', { ascending: false });
      setTasks(t || []);
      const { data: h } = await supabase.from('office_holidays').select('*').order('holiday_date');
      setHolidays(h || []);

      // 5. Fetch Broadcast Notifications (all users)
      const { data: bn } = await supabase.from('notifications')
        .select('*')
        .contains('metadata', { is_broadcast: true })
        .order('created_at', { ascending: false })
        .limit(5);
      setBroadcastNotifications(bn || []);

      // 6. Global Admin Data
      if (superAdmin) {
        const { data: off } = await supabase.from('offices').select('*');
        if (off) setOfficeStats(off.map(o => ({ ...o, students: students?.filter(s => s.office_id === o.id).length || 0, enrolled: students?.filter(s => s.office_id === o.id && s.pipeline_status === 'enrolled').length || 0 })));
        const { data: st } = await supabase.from('users').select('id, full_name, office_id, offices!office_id(name)').eq('is_active', true);
        console.log('✅ Loaded staff members:', st?.length, st);
        setAllStaff(st || []);

        const { data: bh } = await supabase.from('notifications')
          .select('*')
          .contains('metadata', { is_broadcast: true })
          .order('created_at', { ascending: false })
          .limit(5);
        setBroadcastHistory(bh || []);

        // Fetch office-specific task history
        const { data: oh } = await supabase.from('staff_tasks')
          .select('*, users!staff_id(full_name, office_id, offices!office_id(name)), created_by_user:users!created_by(full_name)')
          .order('created_at', { ascending: false })
          .limit(30);
        console.log('✅ Loaded office task history:', oh?.length, oh);
        setOfficeTaskHistory(oh || []);
      }

      // 7. Fetch events from staff_tasks where task_period = 'event'
      const { data: events } = await supabase.from('staff_tasks')
        .select('*, created_by_user:users!created_by(full_name)')
        .eq('task_period', 'event')
        .eq('staff_id', user.id)
        .order('due_date', { ascending: true })
        .limit(20);
      console.log('✅ Loaded events:', events?.length, events);
      setTaskEvents(events || []);

      // 6. Active Promo Codes
      let promoQuery = supabase.from('promo_codes').select('*').eq('is_active', true);
      if (!superAdmin) {
        promoQuery = promoQuery.or(`is_global.eq.true,office_id.eq.${user.office_id}`);
      }
      const { data: promos } = await promoQuery;
      setPromoCodes(promos || []);

    } catch (err) { console.error('Dashboard Error:', err); }
    setLoading(false);
  }, [user, superAdmin]);

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user, loadDashboardData]);

  const handleToggleTask = async (id, currentStatus) => {
    const supabase = getSupabaseClient();
    const newStatus = !currentStatus;
    const { error } = await supabase.from('staff_tasks').update({ is_completed: newStatus }).eq('id', id);
    if (!error) {
      setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: newStatus } : t));
      const task = tasks.find(t => t.id === id);
      if (newStatus && task.created_by !== user.id) {
        await supabase.from('notifications').insert({ user_id: task.created_by, title: 'Task Accomplished! ✅', message: `${user.full_name} completed task: ${task.task_content}`, type: 'success' });
      }
    }
  };

  const handleAddTask = async (content, priority = 'normal', staffId = user.id, period = 'daily') => {
    if (!content) return;
    const supabase = getSupabaseClient();
    
    if (staffId === 'all') {
      const targets = allStaff.map(s => s.id);
      await supabase.from('staff_tasks').insert(targets.map(tid => ({ 
        staff_id: tid, 
        task_content: content, 
        priority, 
        created_by: user.id, 
        task_period: period,
        due_date: new Date().toISOString().split('T')[0] 
      })));
      await supabase.from('notifications').insert(targets.map(tid => ({ 
        user_id: tid, 
        title: 'Group Task Assigned 📌', 
        message: `${user.full_name} assigned a ${period} task to all staff: ${content}`, 
        type: 'info' 
      })));
      loadDashboardData();
      return;
    }

    const { data, error } = await supabase.from('staff_tasks').insert({ 
      staff_id: staffId, 
      task_content: content, 
      priority, 
      created_by: user.id, 
      task_period: period,
      due_date: new Date().toISOString().split('T')[0] 
    }).select().single();
    if (!error) {
      setTasks([data, ...tasks]);
      if (staffId !== user.id) await supabase.from('notifications').insert({ 
        user_id: staffId, 
        title: 'New Task Assigned 📌', 
        message: `${user.full_name} assigned you a new ${period} task.`, 
        type: 'info' 
      });
    }
  };

  const handleAddOfficeTask = async () => {
    if (!officeTaskInputs.content.trim()) {
      alert('Please enter a task description');
      return;
    }
    
    const supabase = getSupabaseClient();
    let targets = [];
    
    // If specific staff members are selected, use them
    if (selectedStaffMembers.length > 0) {
      targets = selectedStaffMembers;
    } else if (officeFilterForStaff === 'all') {
      // Otherwise use office-based selection
      targets = allStaff.map(s => s.id);
    } else {
      targets = allStaff.filter(s => s.office_id === officeFilterForStaff).map(s => s.id);
    }
    
    if (targets.length === 0) {
      alert('Please select at least one staff member');
      return;
    }

    setIsAssigningTask(true);
    
    try {
      const taskData = targets.map(tid => ({
        staff_id: tid,
        task_content: officeTaskInputs.content.trim(),
        priority: officeTaskInputs.priority,
        created_by: user.id,
        task_period: officeTaskInputs.period,
        due_date: new Date().toISOString().split('T')[0]
      }));

      const { error: taskError } = await supabase.from('staff_tasks').insert(taskData);
      
      if (taskError) {
        console.error('Task insertion error:', taskError);
        throw new Error(`Failed to create task: ${taskError.message}`);
      }

      // Send notifications
      const notificationError = await supabase.from('notifications').insert(targets.map(tid => ({
        user_id: tid,
        title: `${officeTaskInputs.period.charAt(0).toUpperCase() + officeTaskInputs.period.slice(1)} Task Assigned 📌`,
        message: officeTaskInputs.content.trim(),
        type: 'info'
      }))).then(res => res.error);
      
      if (notificationError) {
        console.error('Notification error:', notificationError);
      }

      // Success
      setOfficeTaskInputs({ content: '', period: 'daily', priority: 'normal' });
      setSelectedStaffMembers([]);
      setStaffSearchQuery('');
      setOfficeFilterForStaff('all');
      loadDashboardData();
      alert(`✅ Task successfully assigned to ${targets.length} staff member(s)!`);
    } catch (error) {
      console.error('Error assigning task:', error);
      alert(`❌ Error: ${error.message || 'Failed to assign task. Please try again.'}`);
    } finally {
      setIsAssigningTask(false);
    }
  };

  const toggleStaffMemberSelection = (staffId) => {
    setSelectedStaffMembers(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const getFilteredStaffForDisplay = () => {
    let filtered = allStaff || [];
    
    // Filter by office
    if (officeFilterForStaff !== 'all') {
      filtered = filtered.filter(s => s.office_id === officeFilterForStaff);
    }
    
    // Filter by search query
    if (staffSearchQuery.trim()) {
      const query = staffSearchQuery.toLowerCase();
      filtered = filtered.filter(s => {
        const nameMatch = (s.full_name || '').toLowerCase().includes(query);
        const officeMatch = (s.offices?.name || '').toLowerCase().includes(query);
        return nameMatch || officeMatch;
      });
    }
    
    console.log('Filtered staff display:', filtered.length, 'of', allStaff?.length);
    return filtered;
  };

  const selectAllVisibleStaff = () => {
    const visibleIds = getFilteredStaffForDisplay().map(s => s.id);
    setSelectedStaffMembers(visibleIds);
  };

  const deselectAllVisibleStaff = () => {
    const visibleIds = getFilteredStaffForDisplay().map(s => s.id);
    setSelectedStaffMembers(prev => 
      prev.filter(id => !visibleIds.includes(id))
    );
  };

  const handleToggleOnlineEvent = () => {
    const newOnlineState = !newEventInput.isOnline;
    setNewEventInput(prev => ({ ...prev, isOnline: newOnlineState }));
    
    if (newOnlineState) {
      // Generate Meet link when toggling online
      const meetLink = generateMeetLink();
      setGeneratedMeetLink(meetLink);
      console.log('✅ Generated Meet Link:', meetLink);
    } else {
      // Clear Meet link when toggling offline
      setGeneratedMeetLink(null);
    }
  };

  const handleAddTaskEvent = async () => {
    if (!newEventInput.title.trim() || !newEventInput.date) {
      alert('Please fill in event title and date');
      return;
    }

    const selectedStudent = allStudents.find(s => s.id === newEventInput.studentId);

    // Validate meeting event if online
    if (newEventInput.isOnline) {
      const validation = validateMeetingEvent({
        title: newEventInput.title,
        date: newEventInput.date,
        time: newEventInput.time || '12:00'
      });

      if (!validation.valid) {
        alert(`Validation Error:\n${validation.errors.join('\n')}`);
        return;
      }
    }

    const supabase = getSupabaseClient();
    setIsCreatingEvent(true);
    
    try {
      console.log('Creating event with data:', newEventInput);
      
      const eventData = {
        staff_id: user.id,
        task_content: newEventInput.title.trim(),
        priority: 'normal',
        created_by: user.id,
        task_period: 'event',
        due_date: newEventInput.date,
        metadata: {
          is_event: true,
          event_time: newEventInput.time || null,
          event_office: newEventInput.office || 'all',
          is_online: newEventInput.isOnline,
          google_meet_link: newEventInput.isOnline ? generatedMeetLink : null,
          created_by_name: user.full_name
        }
      };

      const { data, error } = await supabase.from('staff_tasks').insert(eventData).select().single();

      if (error) {
        console.error('❌ Event creation error:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        throw new Error(`Failed to create event: ${error.message}`);
      }

      if (data) {
        console.log('✅ Event created successfully:', data);
        setNewEventInput({ title: '', date: '', time: '', office: 'all', isOnline: false });
        setGeneratedMeetLink(null);
        loadDashboardData();

        // Send event emails
        try {
          console.log('📧 Sending event emails...');
          
          // Get recipients based on office filter
          let recipients = [];
          if (newEventInput.office === 'all') {
            recipients = allStaff.map(s => {
              // Extract email from credential if available, or use placeholder
              return s.credential?.email || `${s.full_name?.toLowerCase().replace(/\s+/g, '.')}@gtgroup.com`;
            });
          } else {
            // Send to office-specific staff
            const officeStaff = allStaff.filter(s => s.office_id === newEventInput.office);
            recipients = officeStaff.map(s => 
              s.credential?.email || `${s.full_name?.toLowerCase().replace(/\s+/g, '.')}@gtgroup.com`
            );
          }

          if (recipients.length > 0) {
            const emailResponse = await fetch('/api/send-event-emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventId: data.id,
                eventData: {
                  title: newEventInput.title,
                  date: newEventInput.date,
                  time: newEventInput.time,
                  office: newEventInput.office,
                  creator: user.full_name,
                  metadata: {
                    is_online: newEventInput.isOnline,
                    google_meet_link: generatedMeetLink,
                  }
                },
                recipientEmails: recipients,
                createdBy: user.id,
                userId: user.id,
              }),
            });

            const emailResult = await emailResponse.json();
            console.log('📧 Email send result:', emailResult);
            
            if (emailResult.success && emailResult.sent > 0) {
              alert(`✅ Event created successfully!${newEventInput.isOnline ? '\n📞 Google Meet link generated.' : ''}\n📧 Emails sent to ${emailResult.sent} recipients`);
            } else {
              alert(`✅ Event created successfully!${newEventInput.isOnline ? '\n📞 Google Meet link generated.' : ''}\n⚠️ Email sending: ${emailResult.sent} sent, ${emailResult.failed} failed`);
            }
          } else {
            alert(`✅ Event created successfully!${newEventInput.isOnline ? '\n📞 Google Meet link generated and stored.' : ''}`);
          }
        } catch (emailError) {
          console.warn('Email sending warning (event still created):', emailError);
          alert(`✅ Event created successfully!${newEventInput.isOnline ? '\n📞 Google Meet link generated and stored.' : ''}\n⚠️ Email sending failed but event was created`);
        }

        // --- GOOGLE CALENDAR SYNC ---
        if (newEventInput.isOnline || selectedStudent) {
          try {
            console.log('🔄 Syncing to Google Calendar...');
            const startTime = `${newEventInput.date}T${newEventInput.time || '10:00'}:00`;
            const end = new Date(new Date(startTime).getTime() + 60 * 60 * 1000); // 1 hour duration
            
            const syncRes = await fetch('/api/google-calendar-sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                counselorId: user.id,
                studentId: selectedStudent?.id,
                studentEmail: selectedStudent?.email,
                title: newEventInput.title,
                description: `Meeting with Counselor ${user.full_name} for office: ${newEventInput.office}`,
                startTime: startTime,
                endTime: end.toISOString(),
                isOnline: newEventInput.isOnline
              })
            });
            
            const syncData = await syncRes.json();
            if (syncRes.ok) {
              console.log('✅ Google Calendar Link:', syncData.htmlLink);
              alert(`📅 Calendar synced! Event added to your and ${selectedStudent?.first_name || 'student'}'s Google Calendar.`);
            } else {
              console.warn('⚠️ Sync failed:', syncData.error);
            }
          } catch (syncErr) {
            console.error('Calendar Sync Error:', syncErr);
          }
        }
        // ----------------------------

      }
    } catch (error) {
      console.error('❌ Error creating event:', error);
      alert(`❌ Failed to create event: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const filterTasksByPeriod = (taskList, period) => {
    if (period === 'all') return taskList;
    return taskList.filter(t => t.task_period === period);
  };

  const handleBroadcast = async () => {
    if (!broadcast.message) return;
    const supabase = getSupabaseClient();
    if (broadcast.type === 'crm') {
      let targets = [];
      if (broadcast.target === 'all') {
        targets = allStaff.map(s => s.id);
      } else {
        targets = allStaff.filter(s => s.office_id === broadcast.target).map(s => s.id);
      }
      
      // Include current user in broadcast so they see it in their own list
      if (!targets.includes(user.id)) targets.push(user.id);

      const notifs = targets.map(tid => ({ 
        user_id: tid, 
        title: 'Broadcast Announcement 📢', 
        message: broadcast.message, 
        type: 'warning',
        metadata: { is_broadcast: true, sender_id: user.id, target_office: broadcast.target }
      }));

      const { error } = await supabase.from('notifications').insert(notifs);
      if (error) {
        console.error('Broadcast Error:', error);
        alert('Failed to send broadcast');
      } else {
        alert('Broadcast sent to ' + targets.length + ' staff members!');
        // Refresh local history
        const { data: bh } = await supabase.from('notifications')
          .select('*')
          .contains('metadata', { is_broadcast: true })
          .order('created_at', { ascending: false })
          .limit(5);
        setBroadcastHistory(bh || []);
      }
    }
    setBroadcast({ ...broadcast, message: '' });
  };

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className={styles.loadingState}><div className="loading-spinner" /><p>Loading dashboard...</p></div>;

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className="page-title">{superAdmin ? 'Global Overview' : `${user?.offices?.name || 'Office'} Dashboard`}</h1>
          <p className="page-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style={{ padding: '4px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={styles.pulseDot} />
          <marquee style={{ width: '200px', fontSize: '0.8rem', color: '#F87171', fontWeight: '500' }}>URGENT: Visa Deadline is approaching!</marquee>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-secondary btn-sm" onClick={loadDashboardData}>Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/students?action=add')}>Add Student</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-value">{stats?.total || 0}</div><div className="kpi-label">Total Students</div></div>
        <div className="kpi-card"><div className="kpi-value">{stats?.activeLeads || 0}</div><div className="kpi-label">Active Leads</div></div>
        <div className="kpi-card"><div className="kpi-value">{stats?.visaApproved || 0}</div><div className="kpi-label">Visa Approved</div></div>
        <div className="kpi-card"><div className="kpi-value">{stats?.enrolled || 0}</div><div className="kpi-label">Enrolled</div></div>
      </div>

      <div className={styles.chartsRow}>
        <div className="card" style={{ flex: 2 }}>
          <h3 className="section-title mb-16">Revenue Trend (USD)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <h3 className="section-title mb-16">Lead Sources</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={leadSourceData} innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>{leadSourceData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartsRow} style={{ marginBottom: '24px' }}>
        <div className="card" style={{ flex: 1.5 }}>
          {/* My Daily, Weekly, Monthly Tasks & Events */}
          <div className={styles.tasksContainer}>
            <div className={styles.taskHeader}>
              <h3 className="section-title" style={{ margin: 0 }}>📝 My Tasks & Events</h3>
              <div className={styles.mainTabs}>
                <button
                  className={`${styles.mainTab} ${myTasksActiveTab === 'tasks' ? styles.active : ''}`}
                  onClick={() => setMyTasksActiveTab('tasks')}
                >
                  📋 Tasks
                </button>
                <button
                  className={`${styles.mainTab} ${myTasksActiveTab === 'events' ? styles.active : ''}`}
                  onClick={() => setMyTasksActiveTab('events')}
                >
                  📅 Events
                </button>
              </div>
            </div>

            {/* Tasks Tab */}
            {myTasksActiveTab === 'tasks' && (
              <div className={styles.tabContent}>
                {/* Period Filter for Tasks */}
                <div className={styles.periodFilterBar}>
                  <span className={styles.filterLabel}>Filter:</span>
                  <div className={styles.periodTabs}>
                    {['all', 'daily', 'weekly', 'monthly'].map(period => (
                      <button
                        key={period}
                        className={`${styles.periodTab} ${myTaskPeriod === period ? styles.active : ''}`}
                        onClick={() => setMyTaskPeriod(period)}
                      >
                        {period === 'all' ? 'All' : period.charAt(0).toUpperCase() + period.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* New Daily Schedule System */}
                <DailySchedule 
                  tasks={tasks.filter(t => t.staff_id === user.id && t.task_period !== 'event')} 
                  onToggleTask={(id) => {
                    const t = tasks.find(task => task.id === id);
                    if (t) handleToggleTask(id, t.is_completed);
                  }}
                />
              </div>
            )}

            {/* Events Tab */}
            {myTasksActiveTab === 'events' && (
              <div className={styles.tabContent}>
                {/* Event Input Section */}
                <div className={styles.eventInputSection}>
                  <div className={styles.eventInputGrid}>
                    <div className={styles.eventInputGroup}>
                      <label className={styles.inputLabel}>📌 Event Title</label>
                      <input
                        type="text"
                        className={styles.taskInput}
                        placeholder="Event name..."
                        value={newEventInput.title}
                        onChange={e => setNewEventInput({...newEventInput, title: e.currentTarget.value})}
                        disabled={isCreatingEvent}
                      />
                    </div>
                    <div className={styles.eventInputGroup}>
                      <label className={styles.inputLabel}>📅 Date</label>
                      <input
                        type="date"
                        className={styles.taskInput}
                        value={newEventInput.date}
                        onChange={e => setNewEventInput({...newEventInput, date: e.currentTarget.value})}
                        disabled={isCreatingEvent}
                      />
                    </div>
                    <div className={styles.eventInputGroup}>
                      <label className={styles.inputLabel}>🕐 Time</label>
                      <input
                        type="time"
                        className={styles.taskInput}
                        value={newEventInput.time}
                        onChange={e => setNewEventInput({...newEventInput, time: e.currentTarget.value})}
                        disabled={isCreatingEvent}
                      />
                    </div>
                    {superAdmin && (
                      <div className={styles.eventInputGroup}>
                        <label className={styles.inputLabel}>🏢 Office</label>
                        <select
                          className={styles.periodSelect}
                          value={newEventInput.office}
                          onChange={e => setNewEventInput({...newEventInput, office: e.currentTarget.value})}
                          disabled={isCreatingEvent}
                        >
                          <option value="all">All Offices</option>
                          {officeStats.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div className={styles.eventInputGroup}>
                      <label className={styles.inputLabel}>🎓 Select Student (Optional)</label>
                      <select
                        className={styles.periodSelect}
                        value={newEventInput.studentId || ''}
                        onChange={e => setNewEventInput({...newEventInput, studentId: e.target.value})}
                        disabled={isCreatingEvent}
                      >
                        <option value="">No Student Linked</option>
                        {allStudents.map(s => (
                          <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.email})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Online Meeting Toggle */}
                  <div style={{ padding: '16px', background: 'rgba(201, 162, 39, 0.08)', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(201, 162, 39, 0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <input
                        type="checkbox"
                        id="isOnlineToggle"
                        checked={newEventInput.isOnline}
                        onChange={handleToggleOnlineEvent}
                        disabled={isCreatingEvent}
                        style={{ cursor: isCreatingEvent ? 'not-allowed' : 'pointer' }}
                      />
                      <label htmlFor="isOnlineToggle" style={{ cursor: isCreatingEvent ? 'not-allowed' : 'pointer', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', color: '#374151' }}>
                        <Video size={18} color="#C9A227" />
                        Online Meeting (Google Meet)
                      </label>
                    </div>

                    {/* Generated Meet Link Display */}
                    {newEventInput.isOnline && generatedMeetLink && (
                      <div style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <LinkIcon size={16} color="#10B981" />
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#059669' }}>Generated Meet Link:</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F3F4F6', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px' }}>
                          <code style={{ fontSize: '0.75rem', color: '#374151', flex: 1, wordBreak: 'break-all' }}>{generatedMeetLink}</code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generatedMeetLink);
                              setCopiedId('meet-link');
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: copiedId === 'meet-link' ? '#10B981' : '#E5E7EB',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'background 0.2s',
                              color: copiedId === 'meet-link' ? 'white' : '#374151'
                            }}
                            title="Copy Meet Link"
                          >
                            {copiedId === 'meet-link' ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0', fontStyle: 'italic' }}>
                          ✅ Meeting link generated and will be sent to attendees
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    className={styles.addEventBtn}
                    onClick={handleAddTaskEvent}
                    disabled={isCreatingEvent}
                    style={{ opacity: isCreatingEvent ? 0.6 : 1 }}
                  >
                    {isCreatingEvent ? '⏳ Creating...' : '➕ Create Event'}
                  </button>
                </div>

                {/* Events List */}
                <div className={styles.eventsList}>
                  {(superAdmin ? tasks : tasks.filter(t => t.staff_id === user.id)).filter(t => t.task_period === 'event').length > 0 ? (
                    <div className={styles.eventsGrid}>
                      {(superAdmin ? tasks : tasks.filter(t => t.staff_id === user.id)).filter(t => t.task_period === 'event').map(evt => (
                        <div key={evt.id} className={styles.eventCard}>
                          <div className={styles.eventCardHeader}>
                            <h4 className={styles.eventTitle}>{evt.task_content}</h4>
                            <span className={styles.eventBadge}>
                              {evt.metadata?.is_online ? '📞' : '📍'} {evt.metadata?.event_office === 'all' ? 'Global' : 'Office'}
                            </span>
                          </div>
                          <div className={styles.eventDetails}>
                            <span className={styles.eventDetail}>📅 {evt.due_date}</span>
                            {evt.metadata?.event_time && <span className={styles.eventDetail}>🕐 {evt.metadata.event_time}</span>}
                            {evt.metadata?.is_online && evt.metadata?.google_meet_link && (
                              <span className={styles.eventDetail} style={{ cursor: 'pointer', color: '#10B981', textDecoration: 'underline' }} onClick={() => window.open(evt.metadata.google_meet_link, '_blank')}>
                                🔗 Join Meeting
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyTaskState}>
                      <p className={styles.emptyTaskText}>No events scheduled</p>
                      <p className={styles.emptyTaskSubtext}>Create one to get started! 📅</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Super Admin: Office Task History */}
            {superAdmin && (
              <div className={styles.officeTaskHistorySection}>
                <div className={styles.divider} />
                <h4 className="section-title" style={{ margin: '0 0 16px 0' }}>📊 Office Task & Event History</h4>
                <div className={styles.officeHistoryGrid}>
                  {officeTaskHistory.length > 0 ? (
                    officeTaskHistory.slice(0, 15).map(task => (
                      <div key={task.id} className={styles.historyItem}>
                        <div className={styles.historyItemHeader}>
                          <div className={styles.historyInfo}>
                            <span className={styles.historyStaffName}>{task.users?.full_name || 'Unknown'}</span>
                            <span className={styles.historyOfficeName}>🏢 {task.users?.offices?.name || 'No Office'}</span>
                          </div>
                          <span className={`${styles.historyPeriodBadge} ${styles[task.task_period]}`}>
                            {task.task_period === 'event' ? '📅 Event' : task.task_period}
                          </span>
                        </div>
                        <p className={styles.historyTaskContent}>{task.task_content}</p>
                        <div className={styles.historyMeta}>
                          <span className={styles.historyDate}>{new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          {task.is_completed && <span className={styles.completedBadge}>✅ Completed</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-dim)' }}>
                      <p>No task history yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Office Task Management (Super Admin Only) */}
          {superAdmin && (
            <div className={styles.officeTasksSection}>
              <div className={styles.divider} />
              <h4 className="section-title" style={{ margin: '0 0 16px 0' }}>🏢 Office Task Assignment</h4>
              
              {/* Task Details Grid */}
              <div className={styles.officeTaskGrid}>
                <div className={styles.officeTaskInputGroup}>
                  <label className={styles.inputLabel}>📝 Task Content</label>
                  <input
                    type="text"
                    className={styles.taskInput}
                    placeholder="What needs to be done?"
                    value={officeTaskInputs.content}
                    onChange={e => setOfficeTaskInputs({...officeTaskInputs, content: e.currentTarget.value})}
                  />
                </div>

                <div className={styles.officeTaskInputGroup}>
                  <label className={styles.inputLabel}>⏰ Period</label>
                  <select
                    className={styles.periodSelect}
                    value={officeTaskInputs.period}
                    onChange={e => setOfficeTaskInputs({...officeTaskInputs, period: e.currentTarget.value})}
                  >
                    <option value="daily">📅 Daily</option>
                    <option value="weekly">🗓️ Weekly</option>
                    <option value="monthly">📆 Monthly</option>
                  </select>
                </div>

                <div className={styles.officeTaskInputGroup}>
                  <label className={styles.inputLabel}>⭐ Priority</label>
                  <select
                    className={styles.prioritySelect}
                    value={officeTaskInputs.priority}
                    onChange={e => setOfficeTaskInputs({...officeTaskInputs, priority: e.currentTarget.value})}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="normal">🟡 Normal</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
              </div>

              {/* Smart Staff Selection */}
              <div className={styles.staffSelectionSection}>
                <div className={styles.staffSelectionHeader}>
                  <div>
                    <h5 className={styles.selectionTitle}>👥 Select Team Members</h5>
                    <p className={styles.selectionSubtitle}>{selectedStaffMembers.length} staff member(s) selected</p>
                  </div>
                  {selectedStaffMembers.length > 0 && (
                    <button
                      className={styles.clearBtn}
                      onClick={() => setSelectedStaffMembers([])}
                      title="Clear all selections"
                    >
                      ✕ Clear All
                    </button>
                  )}
                </div>

                {/* Filter and Search */}
                <div className={styles.filterSearchGrid}>
                  <div className={styles.filterGroup}>
                    <label className={styles.miniLabel}>Filter by Office</label>
                    <select
                      className={styles.periodSelect}
                      value={officeFilterForStaff}
                      onChange={e => setOfficeFilterForStaff(e.currentTarget.value)}
                    >
                      <option value="all">🌍 All Offices</option>
                      {officeStats.map(o => <option key={o.id} value={o.id}>🏢 {o.name}</option>)}
                    </select>
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.miniLabel}>Search Staff</label>
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Name or office..."
                      value={staffSearchQuery}
                      onChange={e => setStaffSearchQuery(e.currentTarget.value)}
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.miniLabel}>Quick Actions</label>
                    <div className={styles.quickActionButtons}>
                      <button
                        className={styles.quickActionBtn}
                        onClick={selectAllVisibleStaff}
                        title="Select all visible staff"
                      >
                        ✓ Select All
                      </button>
                      <button
                        className={styles.quickActionBtn}
                        onClick={deselectAllVisibleStaff}
                        title="Deselect all visible staff"
                      >
                        ✗ Deselect
                      </button>
                    </div>
                  </div>
                </div>

                {/* Staff Members List */}
                <div className={styles.staffMembersWrapper}>
                  {getFilteredStaffForDisplay().length > 0 ? (
                    <div className={styles.staffMembersList}>
                      {getFilteredStaffForDisplay().map(staff => (
                        <div
                          key={staff.id}
                          className={`${styles.staffMemberItem} ${selectedStaffMembers.includes(staff.id) ? styles.selected : ''}`}
                          onClick={() => toggleStaffMemberSelection(staff.id)}
                        >
                          <input
                            type="checkbox"
                            id={`staff-${staff.id}`}
                            checked={selectedStaffMembers.includes(staff.id)}
                            onChange={() => toggleStaffMemberSelection(staff.id)}
                            className={styles.staffCheckbox}
                          />
                          <div className={styles.staffMemberContent}>
                            <span className={styles.staffName}>{staff.full_name}</span>
                            <span className={styles.staffOffice}>
                              🏢 {staff.offices?.name || 'No Office'}
                            </span>
                          </div>
                          {selectedStaffMembers.includes(staff.id) && (
                            <span className={styles.selectedBadge}>✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyStaffState}>
                      <p className={styles.emptyStaffText}>😕 No staff members found</p>
                      <p className={styles.emptyStaffSubtext}>Try adjusting your filters</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Buttons */}
              <div className={styles.assignmentActions}>
                <button
                  className={styles.assignAllBtn}
                  onClick={() => {
                    setOfficeFilterForStaff('all');
                    setStaffSearchQuery('');
                    setSelectedStaffMembers(allStaff.map(s => s.id));
                  }}
                  disabled={isAssigningTask}
                >
                  📢 Assign to All Staff
                </button>
                <button
                  className={`${styles.assignSelectedBtn} ${officeTaskInputs.content.trim() === '' ? styles.disabled : ''}`}
                  onClick={handleAddOfficeTask}
                  disabled={isAssigningTask || officeTaskInputs.content.trim() === ''}
                >
                  {isAssigningTask ? (
                    <>⏳ Assigning...</>
                  ) : selectedStaffMembers.length > 0 ? (
                    <>📤 Assign to {selectedStaffMembers.length} Member(s)</>
                  ) : (
                    <>📤 Assign to Selected</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Official Notices Card (All Users) */}
          {broadcastNotifications.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--color-gold)', background: 'rgba(201, 162, 39, 0.04)' }}>
              <h3 className="section-title mb-16 flex align-center gap-8">
                📢 Official Notices
              </h3>
              <div className={styles.noticesList}>
                {broadcastNotifications.slice(0, 5).map(notice => (
                  <div key={notice.id} className={styles.noticeItem}>
                    <div className={styles.noticeHeader}>
                      <span className={styles.noticeTitle}>{notice.title}</span>
                      <span className={styles.noticeBadge}>Broadcast</span>
                    </div>
                    <p className={styles.noticeMessage}>{notice.message}</p>
                    <span className={styles.noticeTime}>
                      {new Date(notice.created_at).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="section-title mb-16">🌏 Upcoming Holidays</h3>
            <div className="flex flex-col gap-8">
              {(holidays || []).filter(h => h.country === user?.offices?.country).slice(0, 3).map(h => (
                <div key={h.id} className="flex-between p-8" style={{ background: 'rgba(201, 162, 39, 0.05)', borderRadius: '8px', border: '1px solid rgba(201, 162, 39, 0.1)' }}>
                  <div><p className="text-sm font-semibold">{h.name}</p><p className="text-xs text-muted">{h.holiday_date}</p></div>
                  <span className="badge badge-info">OFFICE OFF</span>
                </div>
              ))}
            </div>
          </div>
          {superAdmin && (
            <div className="card">
              <h3 className="section-title mb-12 flex-between">
                <span>📢 Broadcast Command</span>
                <span className="text-[10px] opacity-50 font-normal uppercase">Admin Only</span>
              </h3>
              <select className="form-select mb-8 text-xs" value={broadcast.target} onChange={e => setBroadcast({...broadcast, target: e.target.value})}>
                <option value="all">Every Staff (Global)</option>
                {officeStats.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <textarea className="form-textarea mb-8 text-sm" placeholder="Message to staff..." rows={2} value={broadcast.message} onChange={e => setBroadcast({...broadcast, message: e.target.value})} />
              <button className="btn btn-primary btn-sm w-full mb-16" onClick={handleBroadcast}>Send CRM Alert</button>

              {broadcastHistory.length > 0 && (
                <div className="mt-8 pt-12 border-t border-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-wider opacity-40 mb-8 font-bold">Recent Alerts History</p>
                  <div className="flex flex-col gap-6">
                    {broadcastHistory.map(h => (
                      <div key={h.id} className="p-8 rounded bg-white/[0.02] border border-white/[0.05]">
                        <p className="text-[11px] leading-tight text-white/80">{h.message}</p>
                        <div className="flex-between mt-4">
                          <span className="text-[9px] opacity-40">{new Date(h.created_at).toLocaleString()}</span>
                          <span className="text-[9px] px-4 py-1 rounded bg-blue-500/10 text-blue-400 capitalize">{h.metadata?.target_office === 'all' ? 'Global' : 'Office'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Promo Codes Widget */}
          {promoCodes.length > 0 && (
            <div className="card" style={{ border: '1px solid rgba(201, 162, 39, 0.2)', background: 'linear-gradient(145deg, rgba(20, 20, 30, 0.4), rgba(30, 30, 45, 0.4))' }}>
              <h3 className="section-title mb-20 flex align-center gap-8">
                <TicketIcon size={18} color="var(--color-gold)" /> 
                Office Promo Codes
              </h3>
              <div className="flex flex-col gap-12">
                {promoCodes.map(promo => (
                  <div key={promo.id} className={styles.promoTicket}>
                    <div className={styles.promoTicketContent}>
                      <div className="flex-between mb-4">
                        <div className="flex align-center gap-8">
                          <code className={styles.promoCodeText}>{promo.code}</code>
                          <button 
                            className={`${styles.copyBtn} ${copiedId === promo.id ? styles.copied : ''}`}
                            onClick={() => handleCopy(promo.code, promo.id)}
                            title="Copy to clipboard"
                          >
                            {copiedId === promo.id ? <Check size={14} /> : <Copy size={14} />}
                            {copiedId === promo.id && <span className={styles.copyLabel}>Copied!</span>}
                          </button>
                        </div>
                        <span className={styles.promoDiscountBadge}>
                          {promo.discount_type === 'percentage' ? `${promo.discount_amount}%` : `$${promo.discount_amount}`}
                          <span className={styles.promoDiscountLabel}> OFF</span>
                        </span>
                      </div>
                      <p className={styles.promoDesc}>{promo.description || 'Valid for next application'}</p>
                      <div className="flex-between mt-8">
                        <span className={`${styles.promoScope} ${promo.is_global ? styles.global : styles.office}`}>
                          {promo.is_global ? 'Global Access' : 'Office Exclusive'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.promoTicketStub}>
                      <div className={`${styles.punchHole} ${styles.top}`}></div>
                      <div className={`${styles.punchHole} ${styles.bottom}`}></div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted mt-16 text-center italic opacity-60">Unlock special student discounts during payment registration</p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className="card" style={{ flex: 1 }}>
          <h3 className="section-title mb-16">📅 Today&apos;s Appointments</h3>
          <div className="flex flex-col gap-10">
            {todayAppointments.length > 0 ? todayAppointments.map(appt => (
              <div key={appt.id} className="flex-between p-10 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex gap-10" style={{ alignItems: 'center' }}>
                  <div className="avatar avatar-xs" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                    {appt.students?.first_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none mb-4">{appt.students?.first_name} {appt.students?.last_name}</p>
                    <p className="text-[10px] text-muted opacity-60">Counselor: {appt.users?.full_name}</p>
                  </div>
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                  {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )) : (
              <p className="text-xs text-muted italic text-center py-20">No appointments scheduled for today</p>
            )}
          </div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <h3 className="section-title mb-16">Recent Activity</h3>
          {recentActivity.map(item => (
            <div key={item.id} className="text-xs mb-8 flex gap-8" style={{ alignItems: 'center' }}>
              <div className="avatar avatar-xs" style={{ width: '18px', height: '18px', fontSize: '0.6rem', background: 'var(--color-gold-muted)', color: 'var(--color-gold)' }}>
                {item.users?.full_name?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <span className="font-semibold">{item.users?.full_name}</span>: {item.content?.substring(0, 50)}...
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
