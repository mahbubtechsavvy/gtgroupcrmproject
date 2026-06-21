'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/components/layout/AppLayout';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import { generateMeetLink } from '@/lib/googleMeet';
import { ExecutiveHero, ExecutiveSection, MetricGrid } from '@/components/crm/ExecutivePage';
import { Video, Link as LinkIcon, Copy, Check, X, Plus, Search, Calendar, Star, CheckSquare, RefreshCw } from 'lucide-react';
import styles from './tasks-events.module.css';

const PERIODS = ['all', 'daily', 'weekly', 'monthly'];

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

  const officeSummary = officeStats.map((office) => {
    const officeStaffIds = allStaff.filter((staff) => staff.office_id === office.id).map((staff) => staff.id);
    const officeTasks = officeTaskHistory.filter((task) => officeStaffIds.includes(task.staff_id));
    return {
      id: office.id,
      name: office.name,
      assigned: officeTasks.length,
      completed: officeTasks.filter((task) => task.is_completed).length,
      pending: officeTasks.filter((task) => !task.is_completed).length,
    };
  }).filter((office) => office.assigned > 0);

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
      <ExecutiveHero
        eyebrow="Operations Hub"
        title="Tasks & Events"
        subtitle="A smarter one-stop system for company tasks, office assignments, calendars, and execution tracking."
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={loadData}><RefreshCw size={14} /> Refresh</button>
            <button className="btn btn-primary btn-sm" onClick={() => activeMainTab === 'tasks' ? setShowCreateTask((prev) => !prev) : setActiveMainTab('events')}>
              <Plus size={14} />
              {activeMainTab === 'tasks' ? 'New Task' : 'Create Event'}
            </button>
          </>
        }
      />

      <ExecutiveSection title="Operations Snapshot" subtitle="Current execution load across tasks and events.">
        <MetricGrid items={[
          { label: 'Total Tasks', value: stats.total },
          { label: 'Completed', value: stats.completed },
          { label: 'Pending', value: stats.pending },
          { label: 'Overdue', value: stats.overdue },
          { label: 'Events', value: stats.events },
        ]} />
      </ExecutiveSection>

      {superAdmin && officeSummary.length > 0 && (
        <ExecutiveSection title="Office Summary" subtitle="How each office is performing on assignments right now.">
          <div className="summary-stack">
            {officeSummary.map((office) => (
              <div key={office.id} className="summary-row">
                <strong>{office.name}</strong>
                <div className={styles.officeMeta}>
                  <span>Assigned <strong>{office.assigned}</strong></span>
                  <span>Pending <strong>{office.pending}</strong></span>
                  <span>Completed <strong>{office.completed}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </ExecutiveSection>
      )}

      <div className={styles.layout}>
        <section className={styles.mainPanel}>
          <div className={styles.toolbar}>
            <div className={styles.tabSet}>
              {['tasks', 'events'].map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tabButton} ${activeMainTab === tab ? styles.tabButtonActive : ''}`}
                  onClick={() => setActiveMainTab(tab)}
                >
                  {tab === 'tasks' ? <CheckSquare size={14} /> : <Calendar size={14} />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeMainTab === 'tasks' && (
              <div className={styles.inlineFilters}>
                <div className={styles.tabSet}>
                  {PERIODS.map((period) => (
                    <button
                      key={period}
                      className={`${styles.smallFilter} ${myTaskPeriod === period ? styles.smallFilterActive : ''}`}
                      onClick={() => setMyTaskPeriod(period)}
                    >
                      {period}
                    </button>
                  ))}
                </div>
                <div className={styles.searchBox}>
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {activeMainTab === 'tasks' && (
            <>
              {showCreateTask && (
                <div className={styles.createBlock}>
                  <div className={styles.createRow}>
                    <input
                      className="form-input"
                      placeholder="What needs to be done?"
                      value={newTaskContent}
                      onChange={(event) => setNewTaskContent(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleAddMyTask()}
                    />
                    <select className="form-select" value={newTaskPeriod} onChange={(event) => setNewTaskPeriod(event.target.value)}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <select className="form-select" value={newTaskPriority} onChange={(event) => setNewTaskPriority(event.target.value)}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={handleAddMyTask} disabled={!newTaskContent.trim() || isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Add'}
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.listPane}>
                {filteredMyTasks.length === 0 ? (
                  <div className="empty-state"><p>No tasks found for this filter.</p></div>
                ) : filteredMyTasks.map((task) => (
                  <article key={task.id} className={`${styles.taskCard} ${task.is_completed ? styles.taskDone : ''}`}>
                    <label className={styles.checkboxWrap}>
                      <input type="checkbox" checked={task.is_completed} onChange={() => handleToggleTask(task.id, task.is_completed)} />
                    </label>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTop}>
                        <div className={styles.cardTitleRow}>
                          {task.priority === 'high' && !task.is_completed && <Star size={12} className={styles.starIcon} />}
                          <h3>{task.task_content}</h3>
                        </div>
                        <div className={styles.badgeRow}>
                          <span className="badge badge-muted">{task.task_period}</span>
                          <span className={`badge ${task.priority === 'high' ? 'badge-danger' : task.priority === 'low' ? 'badge-success' : 'badge-warning'}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <div className={styles.cardMeta}>
                        <span>{task.users?.full_name || 'Self assigned'}</span>
                        <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteTask(task.id)}><X size={14} /></button>
                  </article>
                ))}
              </div>
            </>
          )}

          {activeMainTab === 'events' && (
            <div className={styles.eventsPanel}>
              <div className={styles.createBlock}>
                <div className={styles.eventsFormGrid}>
                  <input className="form-input" placeholder="Event title" value={newEvent.title} onChange={(event) => setNewEvent((prev) => ({ ...prev, title: event.target.value }))} />
                  <input className="form-input" type="date" value={newEvent.date} onChange={(event) => setNewEvent((prev) => ({ ...prev, date: event.target.value }))} />
                  <input className="form-input" type="time" value={newEvent.time} onChange={(event) => setNewEvent((prev) => ({ ...prev, time: event.target.value }))} />
                  {superAdmin && (
                    <select className="form-select" value={newEvent.office} onChange={(event) => setNewEvent((prev) => ({ ...prev, office: event.target.value }))}>
                      <option value="all">All Offices</option>
                      {officeStats.map((office) => <option key={office.id} value={office.id}>{office.name}</option>)}
                    </select>
                  )}
                </div>
                <div className={styles.meetRow}>
                  <label className={styles.inlineToggle}>
                    <input type="checkbox" checked={newEvent.isOnline} onChange={handleToggleMeetLink} />
                    <Video size={14} />
                    Google Meet
                  </label>
                  {generatedMeetLink && (
                    <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(generatedMeetLink, 'meet-link')}>
                      {copiedId === 'meet-link' ? <Check size={14} /> : <Copy size={14} />}
                      Copy Link
                    </button>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={handleAddEvent} disabled={isCreatingEvent}>
                    {isCreatingEvent ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              </div>

              <div className={styles.listPane}>
                {myEvents.length === 0 ? (
                  <div className="empty-state"><p>No upcoming events scheduled.</p></div>
                ) : myEvents
                  .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                  .map((evt) => (
                    <article key={evt.id} className={styles.eventCard}>
                      <div className={styles.eventDate}>
                        <strong>{new Date(evt.due_date).toLocaleDateString('en-US', { day: '2-digit' })}</strong>
                        <span>{new Date(evt.due_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      </div>
                      <div className={styles.cardBody}>
                        <h3>{evt.task_content}</h3>
                        <div className={styles.cardMeta}>
                          <span>{evt.metadata?.event_time || 'Time TBD'}</span>
                          <span>{evt.metadata?.is_online ? 'Online' : 'In person'}</span>
                          <span>{evt.metadata?.event_office === 'all' ? 'Global' : 'Office event'}</span>
                        </div>
                      </div>
                      <div className={styles.eventActions}>
                        {evt.metadata?.google_meet_link && (
                          <button className="btn btn-secondary btn-sm" onClick={() => window.open(evt.metadata.google_meet_link, '_blank')}>
                            <LinkIcon size={14} /> Join
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteTask(evt.id)}><X size={14} /></button>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          )}
        </section>

        {superAdmin && (
          <aside className={styles.sidePanel}>
            <div className={styles.sideCard}>
              <h3>Office Task Assignment</h3>
              <div className={styles.compactForm}>
                <textarea
                  className="form-textarea"
                  placeholder="Task content..."
                  value={officeTaskInput.content}
                  onChange={(event) => setOfficeTaskInput((prev) => ({ ...prev, content: event.target.value }))}
                />
                <div className={styles.formSplit}>
                  <select className="form-select" value={officeTaskInput.period} onChange={(event) => setOfficeTaskInput((prev) => ({ ...prev, period: event.target.value }))}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <select className="form-select" value={officeTaskInput.priority} onChange={(event) => setOfficeTaskInput((prev) => ({ ...prev, priority: event.target.value }))}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className={styles.formSplit}>
                  <select className="form-select" value={officeFilter} onChange={(event) => setOfficeFilter(event.target.value)}>
                    <option value="all">All Offices</option>
                    {officeStats.map((office) => <option key={office.id} value={office.id}>{office.name}</option>)}
                  </select>
                  <input className="form-input" placeholder="Search staff..." value={staffSearch} onChange={(event) => setStaffSearch(event.target.value)} />
                </div>
                <div className={styles.staffListCompact}>
                  {getFilteredStaff().slice(0, 8).map((staff) => (
                    <button
                      key={staff.id}
                      className={`${styles.staffPill} ${selectedStaff.includes(staff.id) ? styles.staffPillActive : ''}`}
                      onClick={() => toggleStaff(staff.id)}
                    >
                      {staff.full_name}
                    </button>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={handleAssignOfficeTask} disabled={isAssigning || !officeTaskInput.content.trim()}>
                  {isAssigning ? 'Assigning...' : selectedStaff.length > 0 ? `Assign to ${selectedStaff.length}` : 'Assign to Visible Staff'}
                </button>
              </div>
            </div>

            <div className={styles.sideCard}>
              <div className={styles.historyHeader}>
                <h3>Task History</h3>
                <div className={styles.tabSet}>
                  {PERIODS.map((period) => (
                    <button
                      key={period}
                      className={`${styles.smallFilter} ${historyPeriodFilter === period ? styles.smallFilterActive : ''}`}
                      onClick={() => setHistPeriod(period)}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.historyPane}>
                {filteredHistory.slice(0, 20).map((task) => (
                  <article key={task.id} className={styles.historyCard}>
                    <div className={styles.historyTop}>
                      <strong>{task.users?.full_name || 'Unknown'}</strong>
                      <span className="badge badge-muted">{task.task_period}</span>
                    </div>
                    <p>{task.task_content}</p>
                    <div className={styles.cardMeta}>
                      <span>{task.users?.offices?.name || 'No office'}</span>
                      <span>{new Date(task.created_at).toLocaleString()}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
