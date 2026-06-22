'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';

export default function DocumentReview() {
  const supabase = getSupabaseClient();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  
  // Review Form States
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [errorMarkings, setErrorMarkings] = useState({
    name: false,
    dob: false,
    passport_number: false,
    gpa: false,
    ielts: false,
    financial_statement: false
  });
  const [recommendations, setRecommendations] = useState([
    { text: 'Apostille bachelor degree certificate', checked: false },
    { text: 'Provide consular verified transcript copy', checked: false },
    { text: 'Obtain updated bank balance solvency letter ($20,000+ USD)', checked: false },
    { text: 'Correct name spelling in CRM profile', checked: false },
    { text: 'Re-upload clean scan of passport bio page', checked: false }
  ]);
  const [finalApproval, setFinalApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviewsHistory, setReviewsHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch student list
  useEffect(() => {
    async function loadStudents() {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('first_name', { ascending: true });
      if (!error && data) {
        setStudents(data);
      }
    }
    loadStudents();
  }, []);

  // Fetch documents and reviews history when student changes
  useEffect(() => {
    if (!selectedStudentId) {
      setDocuments([]);
      setActiveDoc(null);
      setReviewsHistory([]);
      setSelectedStudent(null);
      resetForm();
      return;
    }

    const current = students.find(s => s.id === selectedStudentId);
    setSelectedStudent(current || null);

    async function loadStudentDocs() {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('student_id', selectedStudentId)
        .order('uploaded_at', { ascending: false });
      if (!error && data) {
        setDocuments(data);
        if (data.length > 0) setActiveDoc(data[0]);
      }
    }

    async function loadReviews() {
      const { data, error } = await supabase
        .from('human_document_reviews')
        .select('*, users(full_name)')
        .eq('student_id', selectedStudentId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setReviewsHistory(data);
        if (data.length > 0) {
          // Pre-populate form with last review details
          const last = data[0];
          setStatus(last.status);
          setNotes(last.review_notes || '');
          if (last.error_markings) setErrorMarkings(last.error_markings);
          setFinalApproval(last.final_approval || false);
        } else {
          resetForm();
        }
      }
    }

    loadStudentDocs();
    loadReviews();
  }, [selectedStudentId, students]);

  function resetForm() {
    setStatus('pending');
    setNotes('');
    setErrorMarkings({
      name: false,
      dob: false,
      passport_number: false,
      gpa: false,
      ielts: false,
      financial_statement: false
    });
    setFinalApproval(false);
  }

  // Handle error markings toggle
  function handleToggleError(field) {
    setErrorMarkings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  }

  // Handle recommendation check
  function handleToggleRec(idx) {
    const updated = [...recommendations];
    updated[idx].checked = !updated[idx].checked;
    setRecommendations(updated);
  }

  // Submit human review
  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!selectedStudentId || loading) return;
    setLoading(true);

    try {
      const selectedRecs = recommendations
        .filter(r => r.checked)
        .map(r => r.text);

      const res = await fetch('/api/document-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          status,
          reviewNotes: notes,
          errorMarkings,
          recommendations: selectedRecs,
          finalApproval
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert('Review saved and updated successfully!');
        
        // Refresh reviews history
        const { data: newHist } = await supabase
          .from('human_document_reviews')
          .select('*, users(full_name)')
          .eq('student_id', selectedStudentId)
          .order('created_at', { ascending: false });
        if (newHist) setReviewsHistory(newHist);
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred while saving review');
    } finally {
      setLoading(false);
    }
  }

  // Filter students
  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
            <Link href="/ai" className="hover:text-gold">GT AI Platform</Link>
            <span>/</span>
            <span className="text-white/80">Document Review</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            🛡️ Counselor Human Document Review
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[650px]">
        
        {/* Left Side: Document Previewer */}
        <div className="lg:col-span-6 flex flex-col h-full bg-surface-2 border border-white/5 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-surface-3/30 border-b border-white/5 px-6 py-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-white font-semibold block">Uploaded Files Previewer</span>
              {selectedStudent && (
                <span className="text-[10px] text-white/50 block">Student: {selectedStudent.first_name} {selectedStudent.last_name}</span>
              )}
            </div>
            
            {/* Student Selector */}
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-surface-3 border border-white/10 rounded px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-gold/50 max-w-[200px]"
            >
              <option value="">-- Select Student Folder --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Documents List sidebar */}
            <div className="w-1/3 border-r border-white/5 overflow-y-auto p-3 space-y-2">
              {documents.length === 0 ? (
                <div className="text-[10px] text-white/30 text-center py-6">No uploads</div>
              ) : (
                documents.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setActiveDoc(d)}
                    className={`w-full text-left p-2 rounded text-[10px] border flex flex-col gap-1 transition-all ${
                      activeDoc?.id === d.id
                        ? 'bg-gold/10 border-gold/30 text-gold'
                        : 'bg-surface-3 border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    <span className="font-semibold truncate">{d.document_type}</span>
                    <span className="text-[8px] opacity-40">{new Date(d.uploaded_at).toLocaleDateString()}</span>
                  </button>
                ))
              )}
            </div>

            {/* Document details preview */}
            <div className="w-2/3 p-6 flex flex-col justify-between overflow-y-auto space-y-4">
              {activeDoc ? (
                <div className="space-y-4 flex-1">
                  <div className="bg-surface-3/60 p-4 rounded-xl border border-white/5 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="text-white font-semibold text-xs truncate">{activeDoc.file_name || activeDoc.document_type}</h4>
                      <span className="text-[9px] text-white/40">{Math.round(activeDoc.file_size / 1024 || 250)} KB</span>
                    </div>
                    <div className="text-[11px] text-white/60 space-y-1">
                      <p><span className="text-white/30">Document Type:</span> {activeDoc.document_type}</p>
                      <p><span className="text-white/30">Upload Date:</span> {new Date(activeDoc.uploaded_at).toLocaleString()}</p>
                      <p><span className="text-white/30">Status Flag:</span> {activeDoc.status}</p>
                    </div>
                  </div>

                  {/* Simulated File Preview frame */}
                  <div className="border border-white/5 bg-black/20 rounded-xl flex-1 flex flex-col items-center justify-center p-6 text-center text-white/30 min-h-[220px]">
                    <svg className="w-12 h-12 text-white/10 mb-2" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a1 1 0 011.414 0L15 15m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    <p className="text-[11px] font-medium text-white/50">Document File Attached</p>
                    <a 
                      href={activeDoc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] text-gold hover:underline mt-2 flex items-center gap-1"
                    >
                      Open Document in New Tab
                    </a>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-white/20 text-xs py-8">
                  No document selected to preview.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Compliance Review Form */}
        <div className="lg:col-span-6 flex flex-col h-full bg-surface-2 border border-white/5 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-surface-3/30 border-b border-white/5 px-6 py-4">
            <h3 className="text-white font-semibold text-xs uppercase tracking-wider">Verification Review Form</h3>
          </div>

          <form onSubmit={handleSubmitReview} className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              
              {/* Approval status */}
              <div className="space-y-2">
                <label className="text-xs text-white/60 block">Review Status</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { value: 'pending', label: 'Pending' },
                    { value: 'in_review', label: 'In Review' },
                    { value: 'approved', label: 'Approve' },
                    { value: 'rejected', label: 'Reject' },
                    { value: 'needs_fixes', label: 'Fixes' }
                  ].map(s => (
                    <button 
                      key={s.value}
                      type="button"
                      onClick={() => setStatus(s.value)}
                      className={`py-2 text-[10px] font-semibold rounded text-center border transition-all ${
                        status === s.value 
                          ? 'bg-gold/15 text-gold border-gold/40' 
                          : 'bg-surface-3 border-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error checklists */}
              <div className="space-y-2">
                <label className="text-xs text-white/60 block">Mark Discrepancies / Mistakes</label>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {Object.entries(errorMarkings).map(([field, checked]) => (
                    <label 
                      key={field}
                      className={`flex items-center gap-2.5 p-2 border rounded cursor-pointer transition-colors ${
                        checked 
                          ? 'bg-danger/10 border-danger/35 text-white' 
                          : 'bg-surface-3 border-white/5 text-white/50 hover:text-white'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={checked} 
                        onChange={() => handleToggleError(field)}
                        className="rounded border-white/10 text-danger focus:ring-transparent bg-transparent"
                      />
                      <span className="capitalize">{field.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Recommendations checklist */}
              <div className="space-y-2">
                <label className="text-xs text-white/60 block">Required Counselor Actions</label>
                <div className="space-y-1.5 text-[11px] max-h-40 overflow-y-auto pr-1">
                  {recommendations.map((rec, idx) => (
                    <label 
                      key={idx}
                      className={`flex items-start gap-2.5 p-2 border rounded cursor-pointer transition-all ${
                        rec.checked 
                          ? 'bg-gold/10 border-gold/30 text-white' 
                          : 'bg-surface-3 border-white/5 text-white/50 hover:text-white'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={rec.checked} 
                        onChange={() => handleToggleRec(idx)}
                        className="rounded border-white/10 text-gold focus:ring-transparent bg-transparent mt-0.5"
                      />
                      <span>{rec.text}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Review Notes */}
              <div className="space-y-2">
                <label className="text-xs text-white/60 block">Review Notes & Remarks</label>
                <textarea 
                  placeholder="Provide details about the discrepancies marked above or reasons for rejection..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="bg-surface-3 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full resize-none"
                />
              </div>

              {/* Final Approval verification */}
              <div className="flex items-center gap-2 bg-surface-3/30 border border-white/5 p-3 rounded-lg">
                <input 
                  type="checkbox" 
                  id="finalApproval"
                  checked={finalApproval} 
                  onChange={(e) => setFinalApproval(e.target.checked)}
                  className="rounded border-white/10 text-gold focus:ring-transparent bg-transparent"
                />
                <label htmlFor="finalApproval" className="text-xs text-white/80 cursor-pointer">
                  Release Final Folder Approval (Progress student folder state in CRM)
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-between border-t border-white/5 mt-4">
              <span className="text-[10px] text-white/30 italic">All actions are timestamped in logs.</span>
              <button
                type="submit"
                disabled={!selectedStudentId || loading}
                className={`px-6 py-2 rounded font-semibold text-xs transition-all ${
                  !selectedStudentId || loading
                    ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                    : 'bg-gold hover:bg-gold-light text-navy'
                }`}
              >
                {loading ? 'Saving...' : 'Save Audit Review'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
