'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { AI_MODELS } from '@/lib/ai/openrouter';
import Link from 'next/link';

export default function DocumentAnalysis() {
  const supabase = getSupabaseClient();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [history, setHistory] = useState([]);
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

  // Load documents and analysis history when student changes
  useEffect(() => {
    if (!selectedStudentId) {
      setDocuments([]);
      setAnalysisResult(null);
      setHistory([]);
      setSelectedStudent(null);
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
      }
    }

    async function loadHistory() {
      const { data, error } = await supabase
        .from('ai_document_analyses')
        .select('*')
        .eq('student_id', selectedStudentId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setHistory(data);
        if (data.length > 0) {
          // Auto-load most recent analysis
          setAnalysisResult(data[0]);
        } else {
          setAnalysisResult(null);
        }
      }
    }

    loadStudentDocs();
    loadHistory();
  }, [selectedStudentId, students]);

  // Run AI analysis
  async function handleRunAnalysis() {
    if (!selectedStudentId) return;
    setLoading(true);

    try {
      const docIds = documents.map(d => d.id);
      const res = await fetch('/api/ai/analyze-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          documentIds: docIds,
          model: AI_MODELS.GPT4O
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAnalysisResult(data);
        
        // Refresh history
        const { data: newHist } = await supabase
          .from('ai_document_analyses')
          .select('*')
          .eq('student_id', selectedStudentId)
          .order('created_at', { ascending: false });
        if (newHist) setHistory(newHist);
      } else {
        alert(data.error || 'Failed to complete document analysis');
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred during document analysis');
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
            <Link href="/ai" className="hover:text-gold">GT AI Platform</Link>
            <span>/</span>
            <span className="text-white/80">Document Analysis</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            🔍 AI Document Discrepancy Analyzer
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Select & Document List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-5 shadow-xl">
            <h2 className="text-white font-semibold text-sm border-b border-white/5 pb-2">
              Select student file
            </h2>

            {/* Student Search */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 block">Select Student</label>
              <input 
                type="text" 
                placeholder="Search student by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface-3 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full mb-2"
              />
              <select 
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-surface-3 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-gold/50 w-full"
              >
                <option value="">-- Choose Student --</option>
                {filteredStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Checklist in CRM */}
            {selectedStudentId && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Uploaded Files ({documents.length})</span>
                  <button 
                    onClick={handleRunAnalysis}
                    disabled={loading || documents.length === 0}
                    className="text-xs bg-gold hover:bg-gold-light disabled:bg-white/5 disabled:text-white/30 text-navy font-semibold px-3 py-1.5 rounded transition-all"
                  >
                    {loading ? 'Analyzing...' : 'Run OCR Scan'}
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {documents.length === 0 ? (
                    <p className="text-[10px] text-white/30 italic py-4 text-center">No documents uploaded yet for this student.</p>
                  ) : (
                    documents.map(d => (
                      <div 
                        key={d.id}
                        className="bg-surface-3 border border-white/5 p-2 rounded flex items-center justify-between text-[11px]"
                      >
                        <div className="space-y-0.5 truncate max-w-[70%]">
                          <p className="text-white font-medium truncate">{d.file_name || d.document_type}</p>
                          <p className="text-white/40 text-[9px]">{d.document_type}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${
                          d.status === 'verified'
                            ? 'bg-success/20 text-success'
                            : d.status === 'rejected'
                              ? 'bg-danger/20 text-danger'
                              : 'bg-warning/20 text-warning'
                        }`}>
                          {d.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* History Sidebar */}
          {selectedStudentId && history.length > 0 && (
            <div className="bg-surface-2 border border-white/5 rounded-xl p-5 space-y-3 shadow-xl">
              <h3 className="text-white font-semibold text-xs border-b border-white/5 pb-2">
                Analysis Logs
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setAnalysisResult(item)}
                    className={`w-full text-left bg-surface-3 hover:bg-surface-3/80 border p-2 rounded flex items-center justify-between transition-all ${
                      analysisResult?.id === item.id ? 'border-gold/40' : 'border-white/5'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-white font-medium">Scan completed</p>
                      <p className="text-[9px] text-white/40">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`text-[11px] font-bold ${
                      item.risk_score > 50 
                        ? 'text-danger' 
                        : item.risk_score > 20 
                          ? 'text-warning' 
                          : 'text-success'
                    }`}>
                      Risk: {item.risk_score}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Analysis Report */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="bg-surface-2 border border-white/5 rounded-xl p-12 text-center shadow-xl flex flex-col items-center justify-center gap-4 h-[550px]">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gold border-t-transparent" />
                <div className="absolute inset-0 flex items-center justify-center text-gold text-xs font-bold font-mono">OCR</div>
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-semibold text-sm">Vision AI OCR in progress</h3>
                <p className="text-white/40 text-xs max-w-sm">
                  Extracting passport credentials, certificate registration numbers, and dates to verify alignment with CRM registration profiles.
                </p>
              </div>
            </div>
          ) : analysisResult ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Risk Dial Card */}
              <div className="md:col-span-4 bg-surface-2 border border-white/5 rounded-xl p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">File Risk Score</h3>
                <div className="relative flex items-center justify-center">
                  {/* Visual gauge representation */}
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="54" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="64" cy="64" r="54" 
                      stroke={analysisResult.risk_score > 50 ? '#EF4444' : analysisResult.risk_score > 20 ? '#F59E0B' : '#10B981'} 
                      strokeWidth="8" fill="transparent"
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - analysisResult.risk_score / 100)}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold text-white">{analysisResult.risk_score}%</span>
                    <span className="text-[9px] text-white/40 font-medium uppercase">
                      {analysisResult.risk_score > 50 ? 'High Risk' : analysisResult.risk_score > 20 ? 'Medium' : 'Clean'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  {analysisResult.risk_score > 50 
                    ? 'Critical discrepancies detected. Document audit is required before submission.'
                    : analysisResult.risk_score > 20 
                      ? 'Minor warnings detected. Verify details.' 
                      : 'Excellent alignment. File is verified and clean.'}
                </p>
              </div>

              {/* Mismatch & Error details */}
              <div className="md:col-span-8 bg-surface-2 border border-white/5 rounded-xl p-6 shadow-xl space-y-5 flex flex-col h-[550px] overflow-y-auto">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-white font-semibold text-sm">Discrepancy Details</h3>
                  <p className="text-[10px] text-white/40">{analysisResult.comparison_result?.status_summary}</p>
                </div>

                {/* Error Lists */}
                <div className="space-y-3 flex-1">
                  {analysisResult.error_report && analysisResult.error_report.length > 0 ? (
                    analysisResult.error_report.map((err, idx) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded-lg border flex flex-col gap-2 ${
                          err.severity === 'high'
                            ? 'bg-danger/10 border-danger/30 text-white'
                            : 'bg-warning/10 border-warning/30 text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            err.severity === 'high' ? 'bg-danger/25 text-danger' : 'bg-warning/25 text-warning'
                          }`}>
                            {err.severity}
                          </span>
                          <span className="text-[10px] text-white/40 font-medium">{err.document} &bull; {err.field}</span>
                        </div>
                        <p className="text-[11px] text-white/80">{err.message}</p>
                        <div className="grid grid-cols-2 gap-2 bg-black/10 p-2 rounded text-[10px]">
                          <p><span className="text-white/40">CRM Profile:</span> <strong className="text-white font-medium">{err.crm_value}</strong></p>
                          <p><span className="text-white/40">Scanned Doc:</span> <strong className="text-white font-medium">{err.extracted_value}</strong></p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-white/30 text-xs py-8">
                      🎉 No discrepancies detected. All scanned document profiles match perfectly.
                    </div>
                  )}

                  {/* Missing documents list */}
                  {analysisResult.missing_documents && analysisResult.missing_documents.length > 0 && (
                    <div className="bg-surface-3 border border-white/5 p-4 rounded-lg space-y-2 mt-4">
                      <h4 className="text-white font-semibold text-xs flex items-center gap-1.5">
                        <span className="text-warning">⚠</span> Missing Critical Checklist Files ({analysisResult.missing_documents.length})
                      </h4>
                      <ul className="grid grid-cols-2 gap-1 text-[11px] text-white/60 list-disc list-inside">
                        {analysisResult.missing_documents.map((m, idx) => (
                          <li key={idx} className="truncate">{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested Fixes */}
                  {analysisResult.suggested_fixes && analysisResult.suggested_fixes.length > 0 && (
                    <div className="bg-surface-3 border border-white/5 p-4 rounded-lg space-y-2">
                      <h4 className="text-white font-semibold text-xs flex items-center gap-1.5">
                        <span className="text-gold">★</span> Suggested Action Plan
                      </h4>
                      <ul className="text-[11px] text-white/60 space-y-1.5 list-decimal list-inside leading-relaxed">
                        {analysisResult.suggested_fixes.map((fix, idx) => (
                          <li key={idx}>{fix}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-surface-2 border border-white/5 rounded-xl p-6 text-center shadow-xl flex flex-col items-center justify-center text-center p-12 text-white/30 space-y-2 h-[550px]">
              <svg className="w-16 h-16 text-white/15" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-white font-semibold text-sm">No analysis result loaded</h3>
              <p className="text-xs max-w-sm">Select a student and trigger "Run OCR Scan" to execute OCR discrepancy audits on uploaded document folders.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
