'use client';

import React, { useState } from 'react';
import { 
  Flame, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Zap,
  Coffee,
  CalendarDays
} from 'lucide-react';
import styles from './DailySchedule.module.css';

export default function DailySchedule({ tasks = [], onToggleTask }) {
  const [activeTab, setActiveTab] = useState('today');

  const getFilteredTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];

    if (activeTab === 'important') {
      return tasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
    }
    if (activeTab === 'tomorrow') {
      return tasks.filter(t => t.due_date?.startsWith(tomorrow));
    }
    // Default: Today
    return tasks.filter(t => t.due_date?.startsWith(today));
  };

  const filtered = getFilteredTasks();

  return (
    <div className={styles.scheduleBox}>
      <div className={styles.tabs}>
        <div 
          className={`${styles.tab} ${activeTab === 'important' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('important')}
        >
          <Flame size={14} style={{ marginRight: '6px' }} /> Important Work
        </div>
        <div 
          className={`${styles.tab} ${activeTab === 'today' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('today')}
        >
          <Zap size={14} style={{ marginRight: '6px' }} /> Today
        </div>
        <div 
          className={`${styles.tab} ${activeTab === 'tomorrow' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('tomorrow')}
        >
          <CalendarDays size={14} style={{ marginRight: '6px' }} /> Tomorrow
        </div>
      </div>

      <div className={styles.taskList}>
        {filtered.length > 0 ? filtered.map((task) => (
          <div 
            key={task.id} 
            className={`${styles.taskCard} ${task.priority === 'urgent' ? styles.importantCard : ''}`}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <div 
                 onClick={() => onToggleTask?.(task.id)} 
                 style={{ cursor: 'pointer', color: task.is_completed ? '#22c55e' : 'rgba(232, 232, 232, 0.2)' }}
               >
                 {task.is_completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
               </div>
               <div>
                  <div className={styles.taskTitle} style={{ textDecoration: task.is_completed ? 'line-through' : 'none', opacity: task.is_completed ? 0.5 : 1 }}>
                    {task.title}
                  </div>
                  <div className={styles.taskTime}>
                     <Clock size={10} style={{ marginRight: '4px' }} />
                     {task.due_time || 'No specific time'} 
                     {task.office_name && ` • ${task.office_name}`}
                  </div>
               </div>
            </div>
            {task.priority === 'urgent' && <div className="badge badge-danger" style={{ fontSize: '9px' }}>URGENT</div>}
          </div>
        )) : (
          <div className={styles.emptyState}>
            <Coffee size={32} style={{ marginBottom: '12px' }} />
            <p>No tasks scheduled for this section.</p>
            <small>Great job! You are all caught up.</small>
          </div>
        )}
      </div>
    </div>
  );
}
