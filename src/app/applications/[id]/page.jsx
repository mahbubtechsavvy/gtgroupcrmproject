'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/layout/AppLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const STATUS_OPTIONS = [
  { slug: 'draft', label: 'Draft' },
  { slug: 'submitted', label: 'Submitted (Agency)' },
  { slug: 'gt_review', label: 'GT Group Review' },
  { slug: 'under_review', label: 'Under Review (University)' },
  { slug: 'docs_required', label: 'Docs Required' },
  { slug: 'accepted', label: 'Accepted' },
  { slug: 'rejected', label: 'Rejected' },
  { slug: 'offer_issued', label: 'Offer Issued' },
  { slug: 'enrolled', label: 'Enrolled' }
];

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useUser();

  const [app, setApp] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [transitionNote, setTransitionNote] = useState('');

  // Additional settings
  const [notes, setNotes] = useState('');
  const [offerUrl, setOfferUrl] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  async function fetchDetails() {
    try {
      setLoading(true);

      // 1. Fetch application details
      const { data: appData, error: appErr } = await supabase
        .from('university_applications')
        .select(`
          *,
          students(full_name, email, phone),
          universities(name, country),
          programs(name)
        `)
        .eq('id', id)
        .single();

      if (appErr) throw appErr;
      setApp(appData);
      setNotes(appData.notes || '');
      setOfferUrl(appData.offer_letter_url || '');
      setRejectionReason(appData.rejection_reason || '');

      // 2. Fetch history
      const { data: histData, error: histErr } = await supabase
        .from('application_status_history')
        .select('*, users(full_name)')
        .eq('application_id', id)
        .order('changed_at', { ascending: false });

      if (histErr) throw histErr;
      setHistory(histData || []);

    } catch (err) {
      console.error(err);
      toast.error('Failed to load application details');
      router.push('/applications');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(e) {
    e.preventDefault();
    if (!targetStatus) return;

    try {
      setTransitioning(true);

      const response = await fetch(`/api/applications/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_status: targetStatus,
          note: transitionNote
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success('Status updated successfully');
      setTargetStatus('');
      setTransitionNote('');
      fetchDetails();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Status transition failed');
    } finally {
      setTransitioning(false);
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    try {
      setSavingSettings(true);

      const { error } = await supabase
        .from('university_applications')
        .update({
          notes,
          offer_letter_url: offerUrl,
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Details updated successfully');
      fetchDetails();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (!app) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div className="text-sm">
        <Link href="/applications" className="text-gold hover:underline">← Back to Applications</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  {app.students?.full_name || 'Unknown Student'}
                </h1>
                <p className="text-white/60 text-xs mt-1">
                  Target Program: <span className="text-gold font-medium">{app.programs?.name}</span>
                </p>
                <p className="text-white/60 text-xs">
                  University: <span className="text-white/80">{app.universities?.name} ({app.universities?.country})</span>
                </p>
              </div>
              <span className="bg-gold/20 text-gold border border-gold/30 px-3 py-1 rounded text-xs font-semibold uppercase">
                {app.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5 text-xs text-white/50">
              <div>
                <p className="font-semibold text-white/80">Intake Semester</p>
                <p>{app.intake_month} {app.intake_year}</p>
              </div>
              <div>
                <p className="font-semibold text-white/80">Email</p>
                <p>{app.students?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold text-white/80">Phone</p>
                <p>{app.students?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold text-white/80">Fee Status</p>
                <p className={app.application_fee_paid ? 'text-success font-medium' : 'text-danger'}>
                  {app.application_fee_paid ? 'Paid' : 'Unpaid'}
                </p>
              </div>
            </div>
          </div>

          {/* Form: Additional fields */}
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-white">Application Details & Files</h3>
            
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">Offer Letter Document URL</label>
                <input
                  type="url"
                  value={offerUrl}
                  onChange={(e) => setOfferUrl(e.target.value)}
                  placeholder="e.g. https://storage.supabase.co/offer-letter.pdf"
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-xs font-mono"
                />
              </div>

              {app.status === 'rejected' && (
                <div className="space-y-1">
                  <label className="text-white/70 text-xs font-semibold">Rejection Reason</label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Academic quota full"
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-sm"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">Application Notes</label>
                <textarea
                  rows="4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Counseling checklists, credit scores, transcript reviews..."
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-sm"
                ></textarea>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="bg-white/5 hover:bg-gold/10 border border-white/10 hover:border-gold/30 text-white font-medium px-4 py-2 rounded-lg transition-all text-xs"
                >
                  {savingSettings ? 'Saving Details...' : 'Save Worksheet Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Status Transitions & Status History */}
        <div className="lg:col-span-1 space-y-6">
          {/* Transition status */}
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-white">Update Enrollment Stage</h3>
            
            <form onSubmit={handleStatusChange} className="space-y-4">
              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">Target Stage</label>
                <select
                  required
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                >
                  <option value="">-- Select Stage --</option>
                  {STATUS_OPTIONS.filter(o => o.slug !== app.status).map(o => (
                    <option key={o.slug} value={o.slug}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">Transition Log Note</label>
                <textarea
                  rows="2"
                  value={transitionNote}
                  onChange={(e) => setTransitionNote(e.target.value)}
                  placeholder="e.g. Received acceptance letter from Yonsei Admission office today."
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-1.5 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-xs"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={transitioning || !targetStatus}
                className="w-full bg-gold hover:bg-gold-light disabled:bg-white/5 disabled:text-white/20 text-navy font-semibold px-4 py-2 rounded-lg transition-all text-sm"
              >
                {transitioning ? 'Updating Stage...' : 'Commit Status Transition'}
              </button>
            </form>
          </div>

          {/* Status Timeline */}
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-6 max-h-[350px] overflow-y-auto">
            <h3 className="font-display text-lg font-bold text-white border-b border-white/10 pb-2">Status Timeline</h3>
            
            {history.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-6">No status log changes found.</p>
            ) : (
              <div className="relative border-l border-white/10 ml-2 pl-4 space-y-6 text-xs">
                {history.map((log) => (
                  <div key={log.id} className="relative space-y-1">
                    {/* Circle marker */}
                    <div className="absolute -left-[21px] top-1 bg-gold h-2.5 w-2.5 rounded-full border border-surface-2"></div>
                    <div className="flex justify-between items-center text-white/50 text-[10px]">
                      <span>{new Date(log.changed_at).toLocaleString()}</span>
                      <span>By: {log.users?.full_name || 'System'}</span>
                    </div>
                    <div className="font-bold text-white flex items-center gap-1">
                      <span className="text-[10px] text-white/40 uppercase">{log.from_status || 'INIT'}</span>
                      <span className="text-gold">→</span>
                      <span className="text-gold font-bold uppercase">{log.to_status}</span>
                    </div>
                    {log.note && (
                      <p className="text-white/60 text-[10px] leading-relaxed bg-white/5 p-2 rounded">
                        {log.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
