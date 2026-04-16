'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ArrowRight, 
  Calendar,
  User,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import styles from '../kanban.module.css';

const STAGES = [
  { key: 'new_lead', label: 'New Lead', color: '#6B7280' },
  { key: 'initial_consultation', label: 'Consultation', color: '#3B82F6' },
  { key: 'documents_collecting', label: 'Documents', color: '#F59E0B' },
  { key: 'application_submitted', label: 'Applied', color: '#8B5CF6' },
  { key: 'offer_received', label: 'Offer Received', color: '#06B6D4' },
  { key: 'visa_applied', label: 'Visa Applied', color: '#F97316' },
  { key: 'visa_approved', label: 'Visa Approved', color: '#10B981' },
  { key: 'enrolled', label: 'Enrolled', color: '#C9A227' },
];

export default function StudentPipelinePage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = getSupabaseClient();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: user } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setCurrentUser(user);

      let query = supabase.from('students').select('*, offices(name), users!assigned_counselor_id(full_name)');
      if (user.role !== 'ceo' && user.role !== 'coo') {
        query = query.eq('office_id', user.office_id);
      }
      
      const { data } = await query;
      setStudents(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const moveStudent = async (studentId, nextStage) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('students')
      .update({ pipeline_status: nextStage })
      .eq('id', studentId);
    
    if (!error) fetchData();
  };

  if (loading) return <div className="empty-state">Loading Pipeline...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <div className="flex-between mb-24">
         <div>
            <h1 className="page-title">Student Recruitment Pipeline</h1>
            <p className="page-subtitle">Visual tracking of student applications across all stages</p>
         </div>
         <div className="flex gap-12">
            <button className="btn btn-secondary">
               <Search size={18} />
            </button>
            <button className="btn btn-primary">
               <Plus size={18} /> Add Student
            </button>
         </div>
      </div>

      <div className={styles.kanbanBoard}>
        {STAGES.map((stage) => (
          <div key={stage.key} className={styles.column} style={{ borderTopColor: stage.color }}>
            <div className={styles.columnHeader}>
              <span className={styles.columnTitle}>{stage.label}</span>
              <span className={styles.count}>{students.filter(s => s.pipeline_status === stage.key).length}</span>
            </div>
            
            <div className={styles.cardList}>
              {students.filter(s => s.pipeline_status === stage.key).map((student) => {
                const stageIndex = STAGES.findIndex(s => s.key === stage.key);
                const nextStage = STAGES[stageIndex + 1];

                return (
                  <div key={student.id} className={styles.studentCard}>
                     <div className={styles.studentName}>{student.first_name} {student.last_name}</div>
                     <div className={styles.studentSub}>
                        <MapPin size={10} /> {student.destination_country || 'No Country'}
                     </div>
                     <div className={styles.studentSub}>
                        <GraduationCap size={10} /> {student.intended_university || 'No University'}
                     </div>
                     
                     <div className={styles.footer}>
                        <div className="flex items-center gap-4 text-xs text-muted">
                           <User size={10} /> 
                           {student.users?.full_name?.split(' ')[0]}
                        </div>
                        {nextStage && (
                          <button 
                            className="btn btn-ghost btn-xs" 
                            title={`Move to ${nextStage.label}`}
                            onClick={() => moveStudent(student.id, nextStage.key)}
                          >
                             <ArrowRight size={14} />
                          </button>
                        )}
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
