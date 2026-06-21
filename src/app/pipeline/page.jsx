'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { ExecutiveHero, ExecutiveSection, MetricGrid } from '@/components/crm/ExecutivePage';
import { isSuperAdmin } from '@/lib/permissions';
import { sendEmailNotification } from '@/lib/notifications';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Calendar, Building2, User, DollarSign, 
  Clock, AlertCircle, ChevronRight, Globe,
  ShieldCheck, GraduationCap, MapPin
} from 'lucide-react';
import FlagIcon from '@/components/ui/FlagIcon';
import styles from './pipeline.module.css';

const PIPELINE_STAGES = [
  { key: 'new_lead', label: 'New Lead', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  { key: 'initial_consultation', label: 'Consultation', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  { key: 'documents_collecting', label: 'Docs Collecting', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  { key: 'application_submitted', label: 'Applied', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  { key: 'offer_received', label: 'Offer Received', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
  { key: 'visa_applied', label: 'Visa Applied', color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
  { key: 'visa_approved', label: 'Visa Approved', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  { key: 'enrolled', label: 'Enrolled ✅', color: '#C9A227', bg: 'rgba(201,162,39,0.1)' },
];

function SortableCard({ student, stageColor }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: student.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${styles.card} ${isDragging ? styles.cardDragging : ''}`}
    >
      <div className={styles.stageIndicator} style={{ backgroundColor: stageColor }} />
      <div className="flex justify-between items-start mb-4">
        <h4 className={styles.clientName}>{student.first_name} {student.last_name}</h4>
        {student.priority === 'high' && <div className={styles.priorityHigh} />}
      </div>

      <div className="space-y-2 mb-4">
        {student.destinations && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-text-dim uppercase tracking-widest">
            <Globe size={12} className="text-gold" />
            {student.destinations.country_name}
          </div>
        )}
        <div className="flex items-center gap-2 text-[10px] font-bold text-text-dim uppercase tracking-widest">
          <User size={12} />
          {student.users?.full_name || 'Unassigned'}
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className="flex items-center gap-1.5 text-gold font-black text-[10px]">
          <Calendar size={12} />
          {new Date(student.created_at).toLocaleDateString()}
        </div>
        <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-text-muted">
           <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [offices, setOffices] = useState([]);
  const [filterOffice, setFilterOffice] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [viewMode, setViewMode] = useState('overview');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*, offices!users_office_id_fkey(*)').eq('id', session.user.id).single();
      setUser(u);

      if (isSuperAdmin(u?.role)) {
        const { data: off } = await supabase.from('offices').select('id, name, country');
        setOffices(off || []);
      }
      await loadStudents(u);
    };
    init();
  }, [filterOffice]);

  const loadStudents = async (u) => {
    const supabase = getSupabaseClient();
    const superAdmin = isSuperAdmin(u?.role);

    let q = supabase.from('students').select(`
      id, first_name, last_name, pipeline_status, priority, created_at,
      offices(id, name, country),
      users!assigned_to(id, full_name, email),
      destinations(id, country_name, flag_emoji)
    `);

    if (!superAdmin) q = q.eq('office_id', u.office_id);
    if (filterOffice) q = q.eq('office_id', filterOffice);

    const { data } = await q;
    setStudents(data || []);
    setLoading(false);
  };

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const isOverColumn = PIPELINE_STAGES.some((s) => s.key === overId);
    let newStatus = '';

    if (isOverColumn) {
      newStatus = overId;
    } else {
      const overStudent = students.find((s) => s.id === overId);
      if (overStudent) newStatus = overStudent.pipeline_status;
    }

    const student = students.find((s) => s.id === activeId);
    if (student && newStatus && student.pipeline_status !== newStatus) {
      const oldStudents = [...students];
      setStudents(students.map((s) => (s.id === activeId ? { ...s, pipeline_status: newStatus } : s)));

      const supabase = getSupabaseClient();
      const { error } = await supabase.from('students').update({ pipeline_status: newStatus }).eq('id', activeId);
      
      if (error) {
        setStudents(oldStudents);
      } else {
        // Log history & send notification (optional/background)
        supabase.from('pipeline_history').insert({ student_id: activeId, from_status: student.pipeline_status, to_status: newStatus, changed_by: user.id });
      }
    }
  };

  if (loading) return <div className="p-20 text-center"><div className="loading-spinner mx-auto" /></div>;

  const metricItems = PIPELINE_STAGES.map((stage) => ({
    label: stage.label,
    value: students.filter((student) => student.pipeline_status === stage.key).length,
  }));

  const officeSummary = offices.map((office) => {
    const officeStudents = students.filter((student) => student.offices?.id === office.id);
    return {
      id: office.id,
      name: office.name,
      country: office.country,
      total: officeStudents.length,
      active: officeStudents.filter((student) => !['enrolled', 'rejected', 'deferred'].includes(student.pipeline_status)).length,
      enrolled: officeStudents.filter((student) => student.pipeline_status === 'enrolled').length,
    };
  }).filter((office) => office.total > 0);

  const counselorWorkload = Object.values(students.reduce((acc, student) => {
    const key = student.users?.id || 'unassigned';
    acc[key] ||= { name: student.users?.full_name || 'Unassigned', total: 0, active: 0, high: 0 };
    acc[key].total += 1;
    if (!['enrolled', 'rejected', 'deferred'].includes(student.pipeline_status)) acc[key].active += 1;
    if (student.priority === 'high') acc[key].high += 1;
    return acc;
  }, {})).sort((a, b) => b.active - a.active).slice(0, 8);

  return (
    <div className={styles.boardContainer}>
      <ExecutiveHero
        eyebrow="Application Control"
        title="Application Pipeline"
        subtitle="Executive office summary, counselor workload, aging visibility, and drag-and-drop stage management."
        actions={
          <div className="flex gap-2">
            <button className={`btn btn-sm ${viewMode === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('overview')}>Overview</button>
            <button className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('kanban')}>Kanban</button>
            {offices.length > 0 && (
              <select className="form-select" value={filterOffice} onChange={e => setFilterOffice(e.target.value)}>
                <option value="">Global Network</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            )}
          </div>
        }
      />

      <ExecutiveSection title="Stage Summary" subtitle="A quick premium tracking view for all pipeline statuses.">
        <MetricGrid items={metricItems} />
      </ExecutiveSection>

      {officeSummary.length > 0 && (
        <ExecutiveSection title="Office Pipeline Summary" subtitle="Global office strength, active applications, and enrollment output.">
          <div className="office-summary-grid">
            {officeSummary.map((office) => (
              <div key={office.id} className="office-summary-card">
                <div className="office-summary-card__title">
                  <FlagIcon countryName={office.country || office.name} size="sm" />
                  <span>{office.name}</span>
                </div>
                <div className="office-summary-card__metrics">
                  <div className="mini-stat"><strong>{office.total}</strong><span>Total</span></div>
                  <div className="mini-stat"><strong>{office.active}</strong><span>Active</span></div>
                  <div className="mini-stat"><strong>{office.enrolled}</strong><span>Enrolled</span></div>
                </div>
              </div>
            ))}
          </div>
        </ExecutiveSection>
      )}

      {viewMode === 'overview' && (
        <ExecutiveSection title="At-Risk and Counselor Workload" subtitle="Students needing action before they stall inside the funnel.">
          <div className="data-grid-2">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Stage</th>
                    <th>Counselor</th>
                    <th>Destination</th>
                    <th>Age</th>
                  </tr>
                </thead>
                <tbody>
                  {students
                    .filter((student) => !['enrolled', 'rejected'].includes(student.pipeline_status))
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    .slice(0, 12)
                    .map((student) => (
                      <tr key={student.id}>
                        <td>{student.first_name} {student.last_name}</td>
                        <td>{PIPELINE_STAGES.find((stage) => stage.key === student.pipeline_status)?.label || student.pipeline_status}</td>
                        <td>{student.users?.full_name || 'Unassigned'}</td>
                        <td>{student.destinations?.country_name || '-'}</td>
                        <td>{Math.max(0, Math.floor((Date.now() - new Date(student.created_at)) / 86400000))}d</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="summary-stack">
              {counselorWorkload.map((row) => (
                <div key={row.name} className="summary-row">
                  <strong>{row.name}</strong>
                  <div className="flex gap-4 text-sm">
                    <span>Active <strong>{row.active}</strong></span>
                    <span>High <strong>{row.high}</strong></span>
                    <span>Total <strong>{row.total}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ExecutiveSection>
      )}

      {viewMode === 'kanban' && (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.kanbanBoard}>
          {PIPELINE_STAGES.map((stage) => {
            const stageStudents = students.filter((s) => s.pipeline_status === stage.key);
            return (
              <div key={stage.key} className={styles.column} id={stage.key}>
                <div className={styles.columnHeader}>
                  <div className={styles.columnTitle}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color, boxShadow: `0 0 10px ${stage.color}` }} />
                    {stage.label}
                  </div>
                  <span className={styles.itemCount}>{stageStudents.length}</span>
                </div>
                
                <SortableContext items={stageStudents.map(s => s.id)}>
                  <div className={styles.columnBody}>
                    {stageStudents.map((student) => (
                      <SortableCard key={student.id} student={student} stageColor={stage.color} />
                    ))}
                    {stageStudents.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center text-[10px] font-black text-text-dim uppercase tracking-widest">
                        Empty Stage
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeId ? (
            <div className={styles.card} style={{ opacity: 0.9, transform: 'rotate(2deg)', cursor: 'grabbing', border: '1px solid var(--gold)' }}>
              <h4 className={styles.clientName}>{students.find(s => s.id === activeId)?.first_name}</h4>
              <div className="text-[10px] text-text-dim uppercase font-bold">Relocating Lead...</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      )}
    </div>
  );
}
