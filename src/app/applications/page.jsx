'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/layout/AppLayout';
import { toast } from 'react-hot-toast';

const STAGES = [
  { slug: 'draft', label: 'Draft' },
  { slug: 'submitted', label: 'Submitted' },
  { slug: 'gt_review', label: 'GT Review' },
  { slug: 'under_review', label: 'Under Review' },
  { slug: 'docs_required', label: 'Docs Required' },
  { slug: 'accepted', label: 'Accepted' },
  { slug: 'offer_issued', label: 'Offer Issued' },
  { slug: 'enrolled', label: 'Enrolled' }
];

export default function ApplicationsPage() {
  const user = useUser();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [programs, setPrograms] = useState([]);

  const [formData, setFormData] = useState({
    student_id: '',
    university_id: '',
    program_id: '',
    intake_year: new Date().getFullYear(),
    intake_month: '',
    notes: ''
  });

  useEffect(() => {
    fetchApplications();
    fetchFormDropdowns();
  }, []);

  async function fetchApplications() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('university_applications')
        .select(`
          *,
          students(full_name),
          universities(name),
          programs(name)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  async function fetchFormDropdowns() {
    try {
      const { data: stData } = await supabase.from('students').select('id, full_name').order('full_name');
      const { data: uniData } = await supabase.from('universities').select('id, name').order('name');
      const { data: progData } = await supabase.from('programs').select('id, name').order('name');

      setStudents(stData || []);
      setUniversities(uniData || []);
      setPrograms(progData || []);
    } catch (err) {
      console.error('Failed loading selector lists', err);
    }
  }

  async function handleCreateApplication(e) {
    e.preventDefault();
    if (!formData.student_id || !formData.university_id || !formData.program_id) {
      toast.error('Required fields: Student, University, Program');
      return;
    }

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit application');

      toast.success('University application created!');
      setIsModalOpen(false);
      setFormData({
        student_id: '',
        university_id: '',
        program_id: '',
        intake_year: new Date().getFullYear(),
        intake_month: '',
        notes: ''
      });
      fetchApplications();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  }

  async function moveStage(appId, nextStageSlug) {
    try {
      const response = await fetch(`/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_status: nextStageSlug,
          note: `Stage changed directly via pipeline board.`
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Application updated to ${nextStageSlug.replace('_', ' ').toUpperCase()}`);
      fetchApplications();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Stage transition failed');
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-gold">🎓</span> University Applications
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Track student application submissions, document requests, and enrollments across partner universities.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 self-start md:self-auto shadow-md"
        >
          <span>＋</span> New Application
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STAGES.map((stage) => {
            const stageApps = applications.filter((app) => app.status === stage.slug);
            return (
              <div key={stage.slug} className="bg-surface-2 border border-white/5 rounded-xl p-4 space-y-4 flex flex-col justify-between h-[450px]">
                <div className="space-y-4 overflow-hidden flex-1 flex flex-col">
                  {/* Stage Heading */}
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">{stage.label}</h3>
                    <span className="bg-white/5 text-[10px] font-mono px-2 py-0.5 rounded-full text-white/50">{stageApps.length}</span>
                  </div>

                  {/* Apps scrollarea */}
                  <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                    {stageApps.length === 0 ? (
                      <p className="text-white/30 text-[10px] text-center py-12">No files at this stage</p>
                    ) : (
                      stageApps.map((app) => (
                        <div key={app.id} className="bg-surface-3 border border-white/5 rounded-lg p-3 space-y-2 hover:border-gold/30 transition-all text-xs">
                          <div className="font-semibold text-white truncate">{app.students?.full_name}</div>
                          <div className="text-[10px] text-white/50 truncate">{app.universities?.name}</div>
                          <div className="text-[10px] text-gold/80 font-medium truncate">{app.programs?.name}</div>
                          
                          <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[9px] text-white/40">
                            <span>Intake: {app.intake_month} {app.intake_year}</span>
                            <Link href={`/applications/${app.id}`} className="text-gold hover:underline">Details</Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Stage Controls */}
                {stageApps.length > 0 && (
                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <select
                      onChange={(e) => {
                        const [appId, nextStage] = e.target.value.split(':');
                        moveStage(appId, nextStage);
                        e.target.value = '';
                      }}
                      className="bg-navy border border-white/10 rounded px-2 py-1 text-[10px] text-white/80 w-full focus:outline-none focus:border-gold/35"
                    >
                      <option value="">Move selected application...</option>
                      {STAGES.filter(s => s.slug !== stage.slug).map(s => (
                        stageApps.map(app => (
                          <option key={`${app.id}-${s.slug}`} value={`${app.id}:${s.slug}`}>
                            {app.students?.full_name.substring(0, 12)}... → {s.label}
                          </option>
                        ))
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-surface-2 border border-gold/20 rounded-xl max-w-md w-full p-6 space-y-6 animate-slide-up">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="font-display text-xl font-bold text-white">Apply to Partner University</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white text-2xl">&times;</button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-4">
              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">Select Student *</label>
                <select
                  required
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>{st.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">University *</label>
                <select
                  required
                  value={formData.university_id}
                  onChange={(e) => setFormData({ ...formData, university_id: e.target.value })}
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                >
                  <option value="">-- Choose University --</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>{uni.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">Program / Major *</label>
                <select
                  required
                  value={formData.program_id}
                  onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                >
                  <option value="">-- Choose Program --</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>{prog.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-white/70 text-xs font-semibold">Intake Year</label>
                  <input
                    type="number"
                    value={formData.intake_year}
                    onChange={(e) => setFormData({ ...formData, intake_year: e.target.value })}
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-white/70 text-xs font-semibold">Intake Month</label>
                  <input
                    type="text"
                    value={formData.intake_month}
                    onChange={(e) => setFormData({ ...formData, intake_month: e.target.value })}
                    placeholder="e.g. March / Fall"
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">Additional Notes</label>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Scholarship requests, secondary preferences..."
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-sm"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="border border-white/10 text-white/70 hover:bg-white/5 px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
