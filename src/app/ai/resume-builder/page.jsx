'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { AI_MODELS } from '@/lib/ai/openrouter';
import { jsPDF } from 'jspdf';
import Link from 'next/link';

export default function ResumeBuilder() {
  const supabase = getSupabaseClient();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [docType, setDocType] = useState('resume');
  const [model, setModel] = useState(AI_MODELS.GPT4O);
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
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

    async function loadHistory() {
      const { data, error } = await supabase
        .from('ai_generations')
        .select('*')
        .eq('student_id', selectedStudentId)
        .in('type', ['resume', 'cv', 'cover_letter'])
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
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          type: docType,
          jobTitle,
          companyName,
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
          .in('type', ['resume', 'cv', 'cover_letter'])
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
    doc.setFontSize(10);
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
            <span className="text-white/80">Resume Builder</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            💼 Resume & CV Builder
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Parameters Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-5 shadow-xl">
            <h2 className="text-white font-semibold text-sm border-b border-white/5 pb-2">
              Resume Settings
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

            {/* Document Type */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 block">Document Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'resume', label: 'Resume' },
                  { value: 'cv', label: 'CV' },
                  { value: 'cover_letter', label: 'Cover Letter' }
                ].map(type => (
                  <button 
                    key={type.value}
                    type="button"
                    onClick={() => setDocType(type.value)}
                    className={`py-2 px-1 text-[10px] font-semibold rounded text-center border transition-all ${
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

            {/* Target Job Title (For Cover Letters / Resume Customization) */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 block">Target Program / Job Title</label>
              <input 
                type="text" 
                placeholder="e.g. Research Assistant / MSc Student"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="bg-surface-3 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full"
              />
            </div>

            {/* Company / Institution Name */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 block">Target School / Company Name</label>
              <input 
                type="text" 
                placeholder="e.g. KAIST Laboratory"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-surface-3 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full"
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 block">Skills & Work Details (Add Custom Context)</label>
              <textarea 
                placeholder="Describe specific work experience, achievements, technical tools, or projects to insert..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
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
                  Generating layout...
                </>
              ) : (
                '✦ Compile CV/Letter'
              )}
            </button>
          </div>

          {/* History Panel */}
          {selectedStudentId && history.length > 0 && (
            <div className="bg-surface-2 border border-white/5 rounded-xl p-5 space-y-3 shadow-xl">
              <h3 className="text-white font-semibold text-xs border-b border-white/5 pb-2">
                Previous CVs / Letters
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
                  Document Preview & Editor
                </h3>
                <p className="text-[10px] text-white/40">
                  Refine the layout structure. Use action verbs and highlight certifications.
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
                  <p className="text-xs">Consulting resume model endpoints...</p>
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs">No resume generated yet.</p>
                  <p className="text-[10px] text-white/20 max-w-xs">Select a student and click "Compile CV/Letter" to run the helper writer models.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
