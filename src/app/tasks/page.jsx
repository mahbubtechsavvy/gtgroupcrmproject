'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import styles from './tasks.module.css';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Filters
  const [taskFilter, setTaskFilter] = useState('all'); // all, open, in_progress, completed
  const [taskSort, setTaskSort] = useState('due_date'); // due_date, priority, created_at
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    due_date: '',
    assigned_to: ''
  });

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: u } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setCurrentUser(u);
      
      await loadTasks();
      await loadEvents();
    };
    init();
  }, []);

  const loadTasks = async () => {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('tasks')
      .select('*, created_by_user:created_by(*), assigned_to_user:assigned_to(*)')
      .order(taskSort, { ascending: taskSort !== 'priority' });
    
    if (taskFilter !== 'all') {
      query = query.eq('status', taskFilter);
    }
    
    const { data } = await query;
    setTasks(data || []);
  };

  const loadEvents = async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true });
    
    setEvents(data || []);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.from('tasks').insert({
      ...taskForm,
      created_by: currentUser.id,
      assigned_to: taskForm.assigned_to || null
    });

    if (error) {
      alert('Error creating task: ' + error.message);
      return;
    }

    alert('Task created successfully!');
    setShowTaskModal(false);
    setTaskForm({ title: '', description: '', status: 'open', priority: 'medium', due_date: '', assigned_to: '' });
    await loadTasks();
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', taskId);

    if (error) {
      alert('Error updating task: ' + error.message);
      return;
    }

    await loadTasks();
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      alert('Error deleting task: ' + error.message);
      return;
    }

    await loadTasks();
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      open: '#ff6b6b',
      in_progress: '#4ecdc4',
      completed: '#95e77d',
      cancelled: '#95a5a6',
      on_hold: '#f39c12'
    };
    return colors[status] || '#999';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      low: '🟢',
      medium: '🟡',
      high: '🔴',
      urgent: '⚫'
    };
    return icons[priority] || '⚪';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Tasks & Events</h1>
          <p className="page-subtitle">Manage your team's tasks and calendar events</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Task
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search tasks..."
          className="form-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <select
          className="form-select"
          value={taskFilter}
          onChange={(e) => { setTaskFilter(e.target.value); loadTasks(); }}
          style={{ width: 'auto' }}
        >
          <option value="all">All Tasks</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          className="form-select"
          value={taskSort}
          onChange={(e) => setTaskSort(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="due_date">Due Date</option>
          <option value="priority">Priority</option>
          <option value="created_at">Created</option>
        </select>
      </div>

      {/* Tasks Grid */}
      <div className={styles.tasksGrid}>
        {filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No tasks found</p>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowTaskModal(true)}>
              Create one now
            </button>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className={styles.taskCard}>
              <div className={styles.taskHeader}>
                <h3>{task.title}</h3>
                <span style={{ color: getStatusColor(task.status), fontSize: '12px', fontWeight: 'bold' }}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {task.description && (
                <p className={styles.description}>{task.description}</p>
              )}

              <div className={styles.taskMeta}>
                <span className={styles.priority}>
                  {getPriorityIcon(task.priority)} {task.priority}
                </span>
                {task.due_date && (
                  <span className={styles.dueDate}>
                    📅 {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>

              {task.assigned_to_user && (
                <div className={styles.assignee}>
                  👤 {task.assigned_to_user.full_name}
                </div>
              )}

              <div className={styles.actions}>
                <select
                  value={task.status}
                  onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                  className="form-select"
                  style={{ fontSize: '12px' }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteTask(task.id)}
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Create New Task</h2>
              <button onClick={() => setShowTaskModal(false)} className={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign To</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="User email (optional)"
                  value={taskForm.assigned_to}
                  onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
