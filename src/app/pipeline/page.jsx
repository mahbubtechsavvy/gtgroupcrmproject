'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';

const PIPELINE_STAGES = [
  { key: 'new_lead', label: 'New Lead', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  { key: 'initial_consultation', label: 'Initial Consultation', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  { key: 'documents_collecting', label: 'Documents Collecting', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  { key: 'application_submitted', label: 'Application Submitted', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  { key: 'offer_received', label: 'Offer Received', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
  { key: 'visa_applied', label: 'Visa Applied', color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
  { key: 'visa_approved', label: 'Visa Approved', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  { key: 'enrolled', label: 'Enrolled ✅', color: '#C9A227', bg: 'rgba(201,162,39,0.1)' },
];

export default function PipelinePage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [offices, setOffices] = useState([]);
  const [filterOffice, setFilterOffice] = useState('');
  const [filterCounselor, setFilterCounselor] = useState('');
  const [counselors, setCounselors] = useState([]);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*, offices(*)').eq('id', session.user.id).single();
      setUser(u);

      if (isSuperAdmin(u?.role)) {
        const { data: off } = await supabase.from('offices').select('id, name');
        setOffices(off || []);
      }

      const { data: counsel } = await supabase.from('users').select('id, full_name')
        .in('role', ['counselor', 'senior_counselor', 'office_manager'])
        .eq('is_active', true);
      setCounselors(counsel || []);

      await loadStudents(u);
    };
    init();
  }, []);

  const loadStudents = async (u) => {
    const supabase = getSupabaseClient();
    const superAdmin = isSuperAdmin(u?.role);

    let q = supabase.from('students').select(`
      id, first_name, last_name, pipeline_status, priority, created_at,
      offices(id, name),
      users!assigned_to(id, full_name),
      destinations(id, country_name, flag_emoji)
    `);

    if (!superAdmin) q = q.eq('office_id', u.office_id);
    if (filterOffice) q = q.eq('office_id', filterOffice);
    if (filterCounselor) q = q.eq('assigned_to', filterCounselor);

    const { data } = await q;
    setStudents(data || []);
    setLoading(false);
  };

  const moveStudent = async (studentId, newStatus) => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const student = students.find(s => s.id === studentId);
    if (!student || student.pipeline_status === newStatus) return;

    // Optimistic update
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, pipeline_status: newStatus } : s));

    await supabase.from('students').update({ pipeline_status: newStatus }).eq('id', studentId);
    await supabase.from('pipeline_history').insert({
      student_id: studentId,
      from_status: student.pipeline_status,
      to_status: newStatus,
      changed_by: session?.user?.id,
    });
    await supabase.from('interactions').insert({
      student_id: studentId,
      staff_id: session?.user?.id,
      type: 'status_change',
      content: `Moved from ${student.pipeline_status.replace(/_/g, ' ')} to ${newStatus.replace(/_/g, ' ')}`,
    });
  };

  const handleDragStart = (e, studentId) => {
    setDraggingId(studentId);
    e.dataTransfer.setData('studentId', studentId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stageKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageKey);
  };

  const handleDrop = (e, stageKey) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData('studentId');
    if (studentId) moveStudent(studentId, stageKey);
    setDragOverStage(null);
    setDraggingId(null);
  };

  const handleDragEnd = () => {
    setDragOverStage(null);
    setDraggingId(null);
  };

  const daysSince = (d) => Math.floor((Date.now() - new Date(d)) / 86400000);

  const stageStudents = (key) => students.filter(s => s.pipeline_status === key);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '16px' }}>
      <div className="loading-spinner" style={{ width: '32px', height: '32px' }} />
      <p className="text-muted">Loading pipeline...</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Application Pipeline</h1>
          <p className="page-subtitle">Drag cards between columns to update status</p>
        </div>
        <div className="flex gap-12">
          {offices.length > 0 && (
            <select className="form-select" style={{ width: 'auto' }} value={filterOffice}
              onChange={e => setFilterOffice(e.target.value)}>
              <option value="">All Offices</option>
              {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
          <select className="form-select" style={{ width: 'auto' }} value={filterCounselor}
            onChange={e => setFilterCounselor(e.target.value)}>
            <option value="">All Counselors</option>
            {counselors.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', minHeight: '70vh' }}>
        {PIPELINE_STAGES.map(stage => {
          const stageCards = stageStudents(stage.key);
          const isOver = dragOverStage === stage.key;
          return (
            <div
              key={stage.key}
              style={{
                minWidth: '240px',
                width: '240px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
              onDragOver={e => handleDragOver(e, stage.key)}
              onDrop={e => handleDrop(e, stage.key)}
              onDragLeave={() => setDragOverStage(null)}
            >
              {/* Column Header */}
              <div style={{
                background: stage.bg,
                border: `1px solid ${isOver ? stage.color : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
                boxShadow: isOver ? `0 0 12px ${stage.color}44` : 'none',
              }}>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: '600', color: stage.color }}>{stage.label}</p>
                </div>
                <span style={{
                  background: stage.color,
                  color: '#fff',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                }}>
                  {stageCards.length}
                </span>
              </div>

              {/* Drop Zone */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minHeight: '100px',
                padding: isOver ? '6px' : '0',
                borderRadius: '8px',
                border: isOver ? `2px dashed ${stage.color}66` : '2px dashed transparent',
                transition: 'all 0.15s ease',
              }}>
                {stageCards.map(student => (
                  <KanbanCard
                    key={student.id}
                    student={student}
                    stageColor={stage.color}
                    dragging={draggingId === student.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    daysSince={daysSince}
                  />
                ))}
                {stageCards.length === 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '80px',
                    color: 'var(--color-text-dim)',
                    fontSize: '0.8rem',
                    border: '1px dashed rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                  }}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({ student, stageColor, dragging, onDragStart, onDragEnd, daysSince }) {
  const days = daysSince(student.created_at);
  const isStale = days > 14;

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, student.id)}
      onDragEnd={onDragEnd}
      style={{
        background: dragging ? 'rgba(201,162,39,0.1)' : 'var(--color-surface)',
        border: `1px solid ${dragging ? 'var(--color-gold)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '10px',
        padding: '12px',
        cursor: 'grab',
        transition: 'all 0.15s ease',
        opacity: dragging ? 0.5 : 1,
        boxShadow: dragging ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
        <a
          href={`/students/${student.id}`}
          onClick={e => e.stopPropagation()}
          style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--color-white)', textDecoration: 'none', lineHeight: '1.3' }}
        >
          {student.first_name} {student.last_name}
        </a>
        {student.priority === 'high' && (
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', flexShrink: 0, marginTop: '4px' }} />
        )}
      </div>

      {student.destinations && (
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
          {student.destinations.flag_emoji} {student.destinations.country_name}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
        {student.users && (
          <span style={{
            fontSize: '0.72rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            padding: '2px 8px',
            color: 'var(--color-text-dim)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '110px',
          }}>
            {student.users.full_name}
          </span>
        )}
        <span style={{
          fontSize: '0.72rem',
          color: isStale ? '#F87171' : 'var(--color-text-dim)',
          fontWeight: isStale ? '600' : '400',
          whiteSpace: 'nowrap',
        }}>
          {days}d
        </span>
      </div>
    </div>
  );
}
