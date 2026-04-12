'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/components/layout/AppLayout';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import { generateMeetLink } from '@/lib/googleMeet';
import { Video, Link as LinkIcon, Copy, Check, X, Plus, Search, Filter, ChevronDown, Calendar, Clock, Users, Star, CheckSquare, Zap, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import styles from './tasks-events.module.css';

const PERIODS = ['all', 'daily', 'weekly', 'monthly'];
const PERIOD_ICONS = { 
  all: <BarChart3 size={14} />, 
  daily: <Calendar size={14} />, 
  weekly: <Clock size={14} />, 
  monthly: <Calendar size={14} /> 
};
const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: '#10b981', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)'  },
  normal: { label: 'Normal', color: '#C9A227', bg: 'rgba(201,162,39,0.15)', border: 'rgba(201,162,39,0.3)'  },
  high:   { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.3)'   },
};

export default function TasksEventsPage() {
  const user = useUser();
  const superAdmin = isSuperAdmin(user?.role);

  // Data state
  const [tasks, setTasks]               = useState([]);
  const [officeTaskHistory, setOfficeTaskHistory] = useState([]);
  const [allStaff, setAllStaff]         = useState([]);
  const [officeStats, setOfficeStats]   = useState([]);
  const [loading, setLoading]           = useState(true);

  // UI state
  const [activeMainTab, setActiveMainTab]   = useState('tasks');   // tasks | events
  const [myTaskPeriod, setMyTaskPeriod]       = useState('all');
  const [historyPeriodFilter, setHistPeriod]  = useState('all');
  const [searchQuery, setSearchQuery]         = useState('');
  const [showCreateTask, setShowCreateTask]   = useState(false);
  const [newTaskContent, setNewTaskContent]   = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('normal');
  const [newTaskPeriod, setNewTaskPeriod]     = useState('daily');
  const [isSubmitting, setIsSubmitting]       = useState(false);

  // Event creation state
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', office: 'all', isOnline: false });
  const [generatedMeetLink, setGeneratedMeetLink] = useState(null);
  const [isCreatingEvent, setIsCreatingEvent]     = useState(false);
  const [copiedId, setCopiedId]                   = useState(null);

  // Office Task Assignment (Super Admin)
  const [officeTaskInput, setOfficeTaskInput]     = useState({ content: '', period: 'daily', priority: 'normal' });
  const [selectedStaff, setSelectedStaff]         = useState([]);
  const [staffSearch, setStaffSearch]             = useState('');
  const [officeFilter, setOfficeFilter]           = useState('all');
  const [isAssigning, setIsAssigning]             = useState(false);

  // ─── Load Data ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user) return;
    const supabase = getSupabaseClient();
    setLoading(true);

    try {
      // My tasks
      const { data: t } = await supabase
        .from('staff_tasks')
        .select('*, users!created_by(full_name)')
        .order('created_at', { ascending: false });
      setTasks(t || []);

      if (superAdmin) {
        // Office task history
        const { data: oh } = await supabase
          .from('staff_tasks')
          .select('*, users!staff_id(full_name, office_id, offices!office_id(name)), created_by_user:users!created_by(full_name)')
          .order('created_at', { ascending: false })
          .limit(50);
        setOfficeTaskHistory(oh || []);

        // Staff list
        const { data: st } = await supabase
          .from('users')
          .select('id, full_name, office_id, offices!office_id(name)')
          .eq('is_active', true);
        setAllStaff(st || []);

        // Office list
        const { data: off } = await supabase.from('offices').select('*');
        setOfficeStats(off || []);
      }
    } catch (err) {
      console.error('Tasks & Events load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, superAdmin]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const myTasks = tasks.filter(t =>
    (superAdmin ? true : t.staff_id === user?.id) && t.task_period !== 'event'
  );

  const myEvents = tasks.filter(t =>
    (superAdmin ? true : t.staff_id === user?.id) && t.task_period === 'event'
  );

  const filteredMyTasks = myTasks
    .filter(t => myTaskPeriod === 'all' || t.task_period === myTaskPeriod)
    .filter(t => !searchQuery || t.task_content?.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredHistory = officeTaskHistory
    .filter(t => historyPeriodFilter === 'all' || t.task_period === historyPeriodFilter)
    .filter(t => !searchQuery || t.task_content?.toLowerCase().includes(searchQuery.toLowerCase()));

  const stats = {
    total:     myTasks.length,
    completed: myTasks.filter(t => t.is_completed).length,
    pending:   myTasks.filter(t => !t.is_completed).length,
    events:    myEvents.length,
    overdue:   myTasks.filter(t => !t.is_completed && t.due_date && new Date(t.due_date) < new Date()).length,
  };

  const getFilteredStaff = () => {
    let filtered = allStaff;
    if (officeFilter !== 'all') filtered = filtered.filter(s => s.office_id === officeFilter);
    if (staffSearch.trim()) {
      const q = staffSearch.toLowerCase();
      filtered = filtered.filter(s =>
        (s.full_name || '').toLowerCase().includes(q) ||
        (s.offices?.name || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const handleToggleTask = async (id, current) => {
    const supabase = getSupabaseClient();
    const newVal = !current;
    const { error } = await supabase.from('staff_tasks').update({ is_completed: newVal }).eq('id', id);
    if (!error) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: newVal } : t));
      // Notify assigner if completed
      const task = tasks.find(t => t.id === id);
      if (newVal && task?.created_by !== user?.id) {
        await supabase.from('notifications').insert({
          user_id: task.created_by,
          title: 'Task Accomplished! ✅',
          message: `${user.full_name} completed task: ${task.task_content}`,
          type: 'success'
        });
      }
    }
  };

  const handleAddMyTask = async () => {
    if (!newTaskContent.trim()) return;
    setIsSubmitting(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('staff_tasks').insert({
      staff_id: user.id,
      task_content: newTaskContent.trim(),
      priority: newTaskPriority,
      created_by: user.id,
      task_period: newTaskPeriod,
      due_date: new Date().toISOString().split('T')[0],
    }).select().single();

    if (!error && data) {
      setTasks(prev => [data, ...prev]);
      setNewTaskContent('');
      setNewTaskPriority('normal');
      setNewTaskPeriod('daily');
      setShowCreateTask(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('staff_tasks').delete().eq('id', id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date) {
      alert('Please fill in event title and date');
      return;
    }
    setIsCreatingEvent(true);
    const supabase = getSupabaseClient();
    try {
      const { data, error } = await supabase.from('staff_tasks').insert({
        staff_id: user.id,
        task_content: newEvent.title.trim(),
        priority: 'normal',
        created_by: user.id,
        task_period: 'event',
        due_date: newEvent.date,
        metadata: {
          is_event: true,
          event_time: newEvent.time || null,
          event_office: newEvent.office || 'all',
          is_online: newEvent.isOnline,
          google_meet_link: newEvent.isOnline ? generatedMeetLink : null,
          created_by_name: user.full_name,
        }
      }).select().single();

      if (error) throw new Error(error.message);
      if (data) {
        setTasks(prev => [data, ...prev]);
        setNewEvent({ title: '', date: '', time: '', office: 'all', isOnline: false });
        setGeneratedMeetLink(null);
        alert(`✅ Event "${data.task_content}" created!`);
      }
    } catch (err) {
      alert('❌ Failed to create event: ' + err.message);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleToggleMeetLink = () => {
    const online = !newEvent.isOnline;
    setNewEvent(prev => ({ ...prev, isOnline: online }));
    setGeneratedMeetLink(online ? generateMeetLink() : null);
  };

  const handleAssignOfficeTask = async () => {
    if (!officeTaskInput.content.trim()) { alert('Please enter task content'); return; }
    const targets = selectedStaff.length > 0 ? selectedStaff : allStaff.map(s => s.id);
    if (targets.length === 0) { alert('No staff members to assign to'); return; }
    setIsAssigning(true);
    const supabase = getSupabaseClient();
    try {
      await supabase.from('staff_tasks').insert(targets.map(tid => ({
        staff_id: tid,
        task_content: officeTaskInput.content.trim(),
        priority: officeTaskInput.priority,
        created_by: user.id,
        task_period: officeTaskInput.period,
        due_date: new Date().toISOString().split('T')[0],
      })));
      await supabase.from('notifications').insert(targets.map(tid => ({
        user_id: tid,
        title: `${officeTaskInput.period.charAt(0).toUpperCase() + officeTaskInput.period.slice(1)} Task Assigned 📌`,
        message: officeTaskInput.content.trim(),
        type: 'info'
      })));
      setOfficeTaskInput({ content: '', period: 'daily', priority: 'normal' });
      setSelectedStaff([]);
      await loadData();
      alert(`✅ Task assigned to ${targets.length} staff member(s)!`);
    } catch (err) {
      alert('❌ ' + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleStaff = (id) => setSelectedStaff(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!user || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Loading Tasks & Events...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.titleIcon}>
            <CheckSquare size={32} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Tasks & Events</h1>
            <p className={styles.pageSubtitle}>Manage your work, track progress, and schedule events</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshBtn} onClick={loadData} title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button
            className={styles.primaryBtn}
            onClick={() => {
              if (activeMainTab === 'tasks') setShowCreateTask(true);
              else setActiveMainTab('events');
            }}
          >
            <Plus size={16} />
            {activeMainTab === 'tasks' ? 'New Task' : 'Create Event'}
          </button>
        </div>
      </div>

      {/* ── KPI STATS ───────────────────────────────────────────── */}
      <div className={styles.statsRow}>
        {[
          { icon: <BarChart3 size={24} />, label: 'Total Tasks', value: stats.total,     class: styles.total },
          { icon: <CheckSquare size={24} />, label: 'Completed',   value: stats.completed, class: styles.completed },
          { icon: <Clock size={24} />, label: 'Pending',     value: stats.pending,   class: styles.pending },
          { icon: <AlertCircle size={24} />,   label: 'Overdue',     value: stats.overdue,   class: styles.overdue },
          { icon: <Calendar size={24} />,  label: 'Events',      value: stats.events,    class: styles.total },
        ].map((s, i) => (
          <div key={i} className={styles.statCard}>
            <div className={`${styles.statIcon} ${s.class}`}>{s.icon}</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT GRID ────────────────────────────────────── */}
      <div className={`${styles.mainGrid} ${superAdmin ? styles.adminGrid : ''}`}>

        {/* ── LEFT PANEL: MY TASKS & EVENTS ──────────────────────── */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <CheckSquare size={20} className={styles.titleIconInline} /> My Tasks & Events
            </h2>
            <div className={styles.mainTabs}>
              {['tasks', 'events'].map(tab => (
                <button
                  key={tab}
                  className={`${styles.mainTab} ${activeMainTab === tab ? styles.active : ''}`}
                  onClick={() => setActiveMainTab(tab)}
                >
                  {tab === 'tasks' ? <CheckSquare size={14} /> : <Calendar size={14} />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* ── TASKS TAB ──────────────────────────────────────────── */}
          {activeMainTab === 'tasks' && (
            <div className={styles.tabContent}>
              {/* Period Filter Bar */}
              <div className={styles.filterBar}>
                <div className={styles.periodTabs}>
                  {PERIODS.map(p => (
                    <button
                      key={p}
                      className={`${styles.periodTab} ${myTaskPeriod === p ? styles.active : ''}`}
                      onClick={() => setMyTaskPeriod(p)}
                    >
                      {PERIOD_ICONS[p]}
                      {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
                <div className={styles.searchBox}>
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                  {searchQuery && (
                    <button className={styles.clearSearch} onClick={() => setSearchQuery('')}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Add Task */}
              {!showCreateTask ? (
                <button className={styles.quickAddBtn} onClick={() => setShowCreateTask(true)}>
                  <Plus size={14} />
                  <span>Add a new task...</span>
                </button>
              ) : (
                <div className={styles.createTaskForm}>
                  <div className={styles.createTaskTop}>
                    <input
                      type="text"
                      className={styles.taskTitleInput}
                      placeholder="What needs to be done?"
                      value={newTaskContent}
                      onChange={e => setNewTaskContent(e.target.value)}
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleAddMyTask()}
                    />
                    <button className={styles.cancelCreateBtn} onClick={() => { setShowCreateTask(false); setNewTaskContent(''); }}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className={styles.createTaskOptions}>
                    <select
                      className={styles.optionSelect}
                      value={newTaskPeriod}
                      onChange={e => setNewTaskPeriod(e.target.value)}
                    >
                      <option value="daily">📅 Daily</option>
                      <option value="weekly">🗓️ Weekly</option>
                      <option value="monthly">📆 Monthly</option>
                    </select>
                    <select
                      className={styles.optionSelect}
                      value={newTaskPriority}
                      onChange={e => setNewTaskPriority(e.target.value)}
                    >
                      <option value="low">🟢 Low</option>
                      <option value="normal">🟡 Normal</option>
                      <option value="high">🔴 High</option>
                    </select>
                    <button
                      className={styles.addTaskBtn}
                      onClick={handleAddMyTask}
                      disabled={!newTaskContent.trim() || isSubmitting}
                    >
                      {isSubmitting ? '...' : 'Add Task'}
                    </button>
                  </div>
                </div>
              )}

              {/* Task List */}
              <div className={styles.taskList}>
                {filteredMyTasks.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>🎯</span>
                    <p className={styles.emptyTitle}>
                      {searchQuery ? 'No tasks match your search' : `No ${myTaskPeriod === 'all' ? '' : myTaskPeriod} tasks`}
                    </p>
                    <p className={styles.emptySubtitle}>
                      {searchQuery ? 'Try a different search term' : "You're all caught up! 🎉"}
                    </p>
                  </div>
                ) : (
                  filteredMyTasks.map(task => (
                    <div
                      key={task.id}
                      className={`${styles.taskItem} ${task.is_completed ? styles.taskDone : ''} ${
                        task.priority === 'high' && !task.is_completed ? styles.taskHigh : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        className={styles.taskCheckbox}
                        checked={task.is_completed}
                        onChange={() => handleToggleTask(task.id, task.is_completed)}
                      />
                      <div className={styles.taskBody}>
                        <div className={styles.taskRow}>
                          {task.priority === 'high' && !task.is_completed && (
                            <Star size={12} className={styles.starIcon} />
                          )}
                          <span className={styles.taskText}>{task.task_content}</span>
                          <div className={styles.taskBadges}>
                            {task.task_period && task.task_period !== 'event' && (
                              <span className={`${styles.badge} ${styles.periodBadge}`}>
                                {task.task_period}
                              </span>
                            )}
                            <span
                              className={styles.badge}
                              style={{
                                color: PRIORITY_CONFIG[task.priority]?.color || '#C9A227',
                                background: PRIORITY_CONFIG[task.priority]?.bg || 'rgba(201,162,39,0.15)',
                                border: `1px solid ${PRIORITY_CONFIG[task.priority]?.border || 'rgba(201,162,39,0.3)'}`,
                              }}
                            >
                              {PRIORITY_CONFIG[task.priority]?.label || task.priority}
                            </span>
                          </div>
                        </div>
                        {task.created_by !== user?.id && task.users && (
                          <span className={styles.assignerText}>by {task.users?.full_name}</span>
                        )}
                        {task.due_date && (
                          <span className={styles.dueDateText}>
                            📅 Due: {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteTask(task.id)}
                        title="Delete"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── EVENTS TAB ─────────────────────────────────────────── */}
          {activeMainTab === 'events' && (
            <div className={styles.tabContent}>
              {/* Create Event Form */}
              <div className={styles.eventForm}>
                <h3 className={styles.eventFormTitle}><Plus size={18} className={styles.titleIconInline} /> Schedule New Event</h3>
                <div className={styles.eventFormGrid}>
                  <div className={styles.eventFormGroup} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.fieldLabel}>📌 Event Title</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      placeholder="Event name or description..."
                      value={newEvent.title}
                      onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                      disabled={isCreatingEvent}
                    />
                  </div>
                  <div className={styles.eventFormGroup}>
                    <label className={styles.fieldLabel}>📅 Date</label>
                    <input
                      type="date"
                      className={styles.fieldInput}
                      value={newEvent.date}
                      onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))}
                      disabled={isCreatingEvent}
                    />
                  </div>
                  <div className={styles.eventFormGroup}>
                    <label className={styles.fieldLabel}>🕐 Time</label>
                    <input
                      type="time"
                      className={styles.fieldInput}
                      value={newEvent.time}
                      onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))}
                      disabled={isCreatingEvent}
                    />
                  </div>
                  {superAdmin && (
                    <div className={styles.eventFormGroup} style={{ gridColumn: '1 / -1' }}>
                      <label className={styles.fieldLabel}>🏢 Office</label>
                      <select
                        className={styles.fieldSelect}
                        value={newEvent.office}
                        onChange={e => setNewEvent(p => ({ ...p, office: e.target.value }))}
                        disabled={isCreatingEvent}
                      >
                        <option value="all">🌍 All Offices</option>
                        {officeStats.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {/* Google Meet Toggle */}
                <div className={styles.meetToggle}>
                  <label className={styles.meetToggleLabel}>
                    <input
                      type="checkbox"
                      checked={newEvent.isOnline}
                      onChange={handleToggleMeetLink}
                      disabled={isCreatingEvent}
                      className={styles.meetCheckbox}
                    />
                    <Video size={16} style={{ color: '#C9A227' }} />
                    <span>Online Meeting (Google Meet)</span>
                  </label>
                  {newEvent.isOnline && generatedMeetLink && (
                    <div className={styles.meetLinkBox}>
                      <LinkIcon size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                      <code className={styles.meetLinkCode}>{generatedMeetLink}</code>
                      <button
                        className={styles.copyBtn}
                        onClick={() => copyToClipboard(generatedMeetLink, 'meetLink')}
                        title="Copy link"
                      >
                        {copiedId === 'meetLink' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  className={styles.createEventBtn}
                  onClick={handleAddEvent}
                  disabled={isCreatingEvent}
                >
                  {isCreatingEvent ? '⏳ Creating...' : '📅 Create Event'}
                </button>
              </div>

              {/* Events List */}
              <div className={styles.eventsListSection}>
                <h3 className={styles.sectionSubTitle}><Calendar size={18} className={styles.titleIconInline} /> Upcoming Events</h3>
                {myEvents.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📭</span>
                    <p className={styles.emptyTitle}>No events scheduled</p>
                    <p className={styles.emptySubtitle}>Create one above to get started! 📅</p>
                  </div>
                ) : (
                  <div className={styles.eventsGrid}>
                    {myEvents
                      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                      .map(evt => (
                        <div key={evt.id} className={styles.eventCard}>
                          <div className={styles.eventCardLeft}>
                            <div className={styles.eventDate}>
                              <span className={styles.eventDay}>
                                {new Date(evt.due_date).toLocaleDateString('en-US', { day: 'numeric' })}
                              </span>
                              <span className={styles.eventMonth}>
                                {new Date(evt.due_date).toLocaleDateString('en-US', { month: 'short' })}
                              </span>
                            </div>
                          </div>
                          <div className={styles.eventCardBody}>
                            <h4 className={styles.eventTitle}>{evt.task_content}</h4>
                            <div className={styles.eventMeta}>
                              {evt.metadata?.event_time && (
                                <span className={styles.eventMetaItem}>
                                  <Clock size={12} /> {evt.metadata.event_time}
                                </span>
                              )}
                              <span className={`${styles.eventMetaItem} ${styles.eventTypeBadge}`}
                                style={{
                                  color: evt.metadata?.is_online ? '#3b82f6' : '#10b981',
                                  background: evt.metadata?.is_online ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                                }}
                              >
                                {evt.metadata?.is_online ? '📞 Online' : '📍 In-Person'}
                              </span>
                              {evt.metadata?.event_office === 'all' && (
                                <span className={styles.eventMetaItem}>🌍 Global</span>
                              )}
                            </div>
                            {evt.metadata?.is_online && evt.metadata?.google_meet_link && (
                              <button
                                className={styles.joinMeetBtn}
                                onClick={() => window.open(evt.metadata.google_meet_link, '_blank')}
                              >
                                🔗 Join Meeting
                              </button>
                            )}
                          </div>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteTask(evt.id)}
                            title="Delete event"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: SUPER ADMIN TOOLS ──────────────────────── */}
        {superAdmin && (
          <div className={styles.adminPanel}>
            {/* Office Task Assignment */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                  <Users size={20} className={styles.titleIconInline} /> Office Task Assignment
                </h2>
              </div>
              <div className={styles.assignmentForm}>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>📝 Task Content</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="What needs to be done?"
                    value={officeTaskInput.content}
                    onChange={e => setOfficeTaskInput(p => ({ ...p, content: e.target.value }))}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.fieldLabel}>⏰ Period</label>
                    <select
                      className={styles.fieldSelect}
                      value={officeTaskInput.period}
                      onChange={e => setOfficeTaskInput(p => ({ ...p, period: e.target.value }))}
                    >
                      <option value="daily">📅 Daily</option>
                      <option value="weekly">🗓️ Weekly</option>
                      <option value="monthly">📆 Monthly</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.fieldLabel}>⭐ Priority</label>
                    <select
                      className={styles.fieldSelect}
                      value={officeTaskInput.priority}
                      onChange={e => setOfficeTaskInput(p => ({ ...p, priority: e.target.value }))}
                    >
                      <option value="low">🟢 Low</option>
                      <option value="normal">🟡 Normal</option>
                      <option value="high">🔴 High</option>
                    </select>
                  </div>
                </div>

                {/* Staff Selection */}
                <div className={styles.staffSection}>
                  <div className={styles.staffHeader}>
                    <h3 className={styles.staffTitle}>
                      <Users size={14} /> Select Staff Members
                    </h3>
                    <div className={styles.staffCount}>
                      {selectedStaff.length > 0
                        ? `${selectedStaff.length} selected`
                        : `All (${allStaff.length})`}
                    </div>
                  </div>

                  <div className={styles.staffFilterRow}>
                    <select
                      className={styles.fieldSelect}
                      value={officeFilter}
                      onChange={e => setOfficeFilter(e.target.value)}
                    >
                      <option value="all">🌍 All Offices</option>
                      {officeStats.map(o => <option key={o.id} value={o.id}>🏢 {o.name}</option>)}
                    </select>
                    <div className={styles.staffSearchBox}>
                      <Search size={12} />
                      <input
                        type="text"
                        placeholder="Search staff..."
                        value={staffSearch}
                        onChange={e => setStaffSearch(e.target.value)}
                        className={styles.staffSearchInput}
                      />
                    </div>
                  </div>

                  <div className={styles.staffQuickActions}>
                    <button className={styles.quickBtn} onClick={() => setSelectedStaff(getFilteredStaff().map(s => s.id))}>
                      ✓ Select All
                    </button>
                    <button className={styles.quickBtn} onClick={() => setSelectedStaff([])}>
                      ✗ Clear
                    </button>
                  </div>

                  <div className={styles.staffList}>
                    {getFilteredStaff().map(staff => (
                      <div
                        key={staff.id}
                        className={`${styles.staffItem} ${selectedStaff.includes(staff.id) ? styles.staffSelected : ''}`}
                        onClick={() => toggleStaff(staff.id)}
                      >
                        <div className={styles.staffAvatar}>
                          {staff.full_name?.charAt(0) || '?'}
                        </div>
                        <div className={styles.staffInfo}>
                          <span className={styles.staffName}>{staff.full_name}</span>
                          <span className={styles.staffOffice}>🏢 {staff.offices?.name || 'No Office'}</span>
                        </div>
                        {selectedStaff.includes(staff.id) && (
                          <Check size={14} className={styles.staffCheck} />
                        )}
                      </div>
                    ))}
                    {getFilteredStaff().length === 0 && (
                      <p className={styles.noStaffText}>No staff found</p>
                    )}
                  </div>
                </div>

                <div className={styles.assignActions}>
                  <button
                    className={styles.assignAllBtn}
                    onClick={() => {
                      setOfficeFilter('all');
                      setStaffSearch('');
                      setSelectedStaff(allStaff.map(s => s.id));
                    }}
                    disabled={isAssigning}
                  >
                    📢 Select All Staff
                  </button>
                  <button
                    className={`${styles.assignBtn} ${!officeTaskInput.content.trim() ? styles.disabled : ''}`}
                    onClick={handleAssignOfficeTask}
                    disabled={isAssigning || !officeTaskInput.content.trim()}
                  >
                    {isAssigning ? '⏳ Assigning...' : selectedStaff.length > 0
                      ? `📤 Assign to ${selectedStaff.length}`
                      : '📤 Assign to All'}
                  </button>
                </div>
              </div>
            </div>

            {/* Office Task History */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                  <span>📊</span> Office Task History
                </h2>
                <div className={styles.periodTabs}>
                  {PERIODS.map(p => (
                    <button
                      key={p}
                      className={`${styles.periodTab} ${styles.small} ${historyPeriodFilter === p ? styles.active : ''}`}
                      onClick={() => setHistPeriod(p)}
                    >
                      {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.historyList}>
                {filteredHistory.slice(0, 20).length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📭</span>
                    <p className={styles.emptyTitle}>No task history yet</p>
                  </div>
                ) : (
                  filteredHistory.slice(0, 20).map(task => (
                    <div key={task.id} className={styles.historyItem}>
                      <div className={styles.historyTop}>
                        <div className={styles.historyStaff}>
                          <span className={styles.historyAvatar}>
                            {task.users?.full_name?.charAt(0) || '?'}
                          </span>
                          <div>
                            <span className={styles.historyName}>{task.users?.full_name || 'Unknown'}</span>
                            <span className={styles.historyOffice}>🏢 {task.users?.offices?.name || 'No Office'}</span>
                          </div>
                        </div>
                        <span className={`${styles.badge} ${
                          task.task_period === 'event' ? styles.eventBadge :
                          task.task_period === 'daily' ? styles.dailyBadge :
                          task.task_period === 'weekly' ? styles.weeklyBadge :
                          styles.monthlyBadge
                        }`}>
                          {task.task_period === 'event' ? '📅 Event' : task.task_period}
                        </span>
                      </div>
                      <p className={styles.historyContent}>{task.task_content}</p>
                      <div className={styles.historyMeta}>
                        <span className={styles.historyDate}>
                          {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {task.is_completed && <span className={styles.completedBadge}>✅ Done</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
