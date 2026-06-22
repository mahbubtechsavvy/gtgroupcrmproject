'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { AI_MODELS } from '@/lib/ai/openrouter';
import { jsPDF } from 'jspdf';
import Link from 'next/link';

export default function SOPGenerator() {
  const supabase = getSupabaseClient();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [docType, setDocType] = useState('sop');
  const [model, setModel] = useState(AI_MODELS.GPT4O);
  const [targetUni, setTargetUni] = useState('');
  const [targetProg, setTargetProg] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [generationId, setGenerationId] = useState(null);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch student list
  useEffect(() => {
    async function loadStudents() {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, education_level, gpa, ielts_overall, target_course_name')
        .order('first_name', { ascending: true });
      if (!error && data) {
        setStudents(data);
      }
    }
    loadStudents();
  }, []);

  // Fetch history for selected student
  useEffect(() => {
    if (!selectedStudentId) {
      setHistory([]);
      setSelectedStudent(null);
      return;
    }

    const current = students.find(s => s.id === selectedStudentId);
    setSelectedStudent(current || null);
    if (current) {
      setTargetProg(current.target_course_name || '');
    }

    async function loadHistory() {
      const { data, error } = await supabase
        .from('ai_generations')
        .select('*')
        .eq('student_id', selectedStudentId)
        .in('type', ['sop', 'study_plan', 'self_intro'])
        .order('created_at', { ascending: false });
      if (!error && data) {
        setHistory(data);
      }
    }
    loadHistory();
  }, [selectedStudentId, students]);

  // Handle document generation
  async function handleGenerate() {
    if (!selectedStudentId) return;
    setLoading(true);
    setGeneratedText('');

    try {
      const res = await fetch('/api/ai/sop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          type: docType,
          targetUniversity: targetUni,
          targetProgram: targetProg,
          additionalNotes: notes,
          model,
        })
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedText(data.output);
        setGenerationId(data.id);
        
        // Refresh history
        const { data: newHistory } = await supabase
          .from('ai_generations')
          .select('*')
          .eq('student_id', selectedStudentId)
          .in('type', ['sop', 'study_plan', 'self_intro'])
          .order('created_at', { ascending: false });
        if (newHistory) setHistory(newHistory);
      } else {
        alert(data.error || 'Failed to generate document');
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred during generation');
    } finally {
      setLoading(false);
    }
  }

  // Save changes made in editor
  async function handleSaveChanges() {
    if (!generationId) return;
    try {
      const { error } = await supabase
        .from('ai_generations')
        .update({ final_text: generatedText, is_edited: true })
        .eq('id', generationId);
      
      if (error) throw error;
      alert('Changes saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save changes');
    }
  }

  // Export to PDF
  function handleExportPDF() {
    if (!generatedText) return;
    const doc = new jsPDF();
    const margin = 15;
    const width = 180;
    const textLines = doc.splitTextToSize(generatedText, width);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(textLines, margin, 20);
    
    const fileName = `${selectedStudent?.first_name || 'Student'}_${docType.toUpperCase()}.pdf`;
    doc.save(fileName);
  }

  // Copy to clipboard
  function handleCopyClipboard() {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    alert('Copied to clipboard!');
  }

  // Filter student list by search input
  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
            <Link href="/ai" className="hover:text-gold">GT AI Platform</Link>
            <span>/</span>
            <span className="text-white/80">SOP Generator</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            📄 SOP & Study Plan Writer
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Parameters Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-5 shadow-xl">
            <h2 className="text-white font-semibold text-sm border-b border-white/5 pb-2">
              Configuration Parameters
            </h2>

            {/* Student Search & Select */}
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
                    {s.first_name} {s.last_name} ({s.education_level || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            {/* Profile Context Display Card */}
            {selectedStudent && (
              <div className="bg-surface-3/50 border border-white/5 rounded-lg p-3 text-[11px] text-white/70 space-y-1">
                <p><span className="text-gold font-medium">Education:</span> {selectedStudent.education_level || 'Not Specified'}</p>
                <p><span className="text-gold font-medium">GPA / Grade:</span> {selectedStudent.gpa || 'Not Specified'}</p>
                <p><span className="text-gold font-medium">IELTS score:</span> {selectedStudent.ielts_overall || 'Not Specified'}</p>
              </div>
            )}

            {/* Document Type */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 block">Document Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'sop', label: 'SOP' },
                  { value: 'study_plan', label: 'Study Plan' },
                  { value: 'self_intro', label: 'Self Intro' }
                ].map(type => (
                  <button 
                    key={type.value}
                    type="button"
                    onClick={() => setDocType(type.value)}
                    className={`py-2 px-1 text-[11px] font-semibold rounded text-center border transition-all ${
                      docType === type.value 
                        ? 'bg-gold/15 text-gold border-gold/40' 
                        : 'bg-surface-3 border-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 block">AI Model</label>
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-surface-3 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-gold/50 w-full"
              >
                <option value={AI_MODELS.GPT4O}>GPT-4o (Standard)</option>
                <option value={AI_MODELS.CLAUDE_SONNET}>Claude 3.5 Sonnet (Premium)</option>
                <option value={AI_MODELS.GEMINI_PRO}>Gemini Pro 1.5 (Analytic)</option>
                <option value={AI_MODELS.DEEPSEEK}>DeepSeek Chat (Direct)</option>
              </select>
            </div>

            {/* Target University */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 block">Target University</label>
              <input 
                type="text" 
                placeholder="e.g. Yonsei University"
                value={targetUni}
                onChange={(e) => setTargetUni(e.target.value)}
                className="bg-surface-3 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full"
              />
            </div>

            {/* Target Program */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 block">Target Program</label>
              <input 
                type="text" 
                placeholder="e.g. Computer Science & Eng"
                value={targetProg}
                onChange={(e) => setTargetProg(e.target.value)}
                className="bg-surface-3 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full"
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 block">Additional Context / Notes</label>
              <textarea 
                placeholder="Write specific motivations, gaps, or accomplishments to highlight..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="bg-surface-3 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full resize-none"
              />
            </div>

            {/* Submit Button */}
            <button 
              type="button"
              disabled={loading || !selectedStudentId}
              onClick={handleGenerate}
              className={`w-full py-2.5 rounded font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                !selectedStudentId 
                  ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-gold hover:bg-gold-light text-navy'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-navy border-t-transparent" />
                  Generating draft...
                </>
              ) : (
                '✦ Generate Document'
              )}
            </button>
          </div>

          {/* Student Generation History */}
          {selectedStudentId && history.length > 0 && (
            <div className="bg-surface-2 border border-white/5 rounded-xl p-5 space-y-3 shadow-xl">
              <h3 className="text-white font-semibold text-xs border-b border-white/5 pb-2">
                Previous Generations
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setGeneratedText(item.final_text || item.output_text);
                      setGenerationId(item.id);
                      setDocType(item.type);
                      setModel(item.model_used);
                    }}
                    className="w-full text-left bg-surface-3 hover:bg-surface-3/80 border border-white/5 p-2 rounded flex flex-col gap-1 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gold font-medium uppercase">{item.type.replace('_', ' ')}</span>
                      <span className="text-white/40">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[10px] text-white/50 truncate">Model: {item.model_used.split('/')[1] || item.model_used}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Document Preview & Editor */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-4 shadow-xl flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-white font-semibold text-sm">
                  Document Editor
                </h3>
                <p className="text-[10px] text-white/40">
                  Review and edit the draft. Copy or export to PDF when finalized.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {generatedText && (
                  <>
                    <button 
                      onClick={handleCopyClipboard}
                      className="border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-xs px-3 py-1.5 rounded transition-all flex items-center gap-1"
                    >
                      Copy
                    </button>
                    <button 
                      onClick={handleExportPDF}
                      className="border border-gold/30 hover:border-gold/50 text-gold hover:bg-gold/10 text-xs px-3 py-1.5 rounded transition-all flex items-center gap-1"
                    >
                      Export PDF
                    </button>
                    {generationId && (
                      <button 
                        onClick={handleSaveChanges}
                        className="bg-gold hover:bg-gold-light text-navy font-semibold text-xs px-3 py-1.5 rounded transition-all"
                      >
                        Save Final
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Document Textarea Editor */}
            <div className="flex-1">
              {loading ? (
                <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-white/40">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-gold border-t-transparent" />
                  <p className="text-xs">Consulting advisor models via OpenRouter API...</p>
                </div>
              ) : generatedText ? (
                <textarea
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  className="w-full h-full bg-surface-3 border border-white/5 focus:border-gold/30 rounded p-4 text-xs text-white/90 placeholder:text-white/20 focus:outline-none resize-none leading-relaxed font-mono"
                />
              ) : (
                <div className="h-full w-full border border-dashed border-white/5 rounded flex flex-col items-center justify-center text-center p-6 text-white/30 space-y-2">
                  <svg className="w-12 h-12 text-white/15" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                  </svg>
                  <p className="text-xs">No draft generated yet.</p>
                  <p className="text-[10px] text-white/20 max-w-xs">Select a student and click "Generate Document" to run the helper writer models.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
