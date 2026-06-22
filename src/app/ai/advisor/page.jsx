'use client';

import { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { AI_MODELS } from '@/lib/ai/openrouter';
import Link from 'next/link';

export default function AdvisorChat() {
  const supabase = getSupabaseClient();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [model, setModel] = useState(AI_MODELS.GPT4O);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const chatEndRef = useRef(null);

  // Fetch student list
  useEffect(() => {
    async function loadStudents() {
      const { data, error } = await supabase
        .from('students')
        .select('*, destinations(country_name)')
        .order('first_name', { ascending: true });
      if (!error && data) {
        setStudents(data);
      }
    }
    loadStudents();
  }, []);

  // Set student profile context
  useEffect(() => {
    if (!selectedStudentId) {
      setSelectedStudent(null);
      setMessages([]);
      return;
    }
    const current = students.find(s => s.id === selectedStudentId);
    setSelectedStudent(current || null);

    // Initial greeting
    setMessages([
      {
        role: 'assistant',
        content: `👋 Hello! I am the **GT Student Advisor AI**. I have loaded the academic profile of **${current.first_name} ${current.last_name}**.

I can recommend matching universities, check admission eligibility, suggest scholarship programs, or provide student visa guidelines.

What would you like to consult about today?`
      }
    ]);
  }, [selectedStudentId, students]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Send message to advisor API
  async function handleSendMessage(e) {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMsgText = inputMessage;
    setInputMessage('');
    
    // Add user message to state
    const updatedMessages = [...messages, { role: 'user', content: userMsgText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Exclude initial greeting helper text from API payload history to save tokens
      const apiHistory = updatedMessages.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          messageHistory: apiHistory.slice(0, -1), // everything except the last user message
          userMessage: userMsgText,
          model,
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.output }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${data.error || 'Failed to fetch advice.'}` }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Network connection error occurred.' }]);
    } finally {
      setLoading(false);
    }
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
            <span className="text-white/80">Student Advisor</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            🤖 Student Advisor AI Chat
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[680px]">
        
        {/* Left Sidebar: Profile Settings */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-4 shadow-xl flex-1 flex flex-col overflow-y-auto">
            <h2 className="text-white font-semibold text-sm border-b border-white/5 pb-2">
              Advisor Scope & Profile
            </h2>

            {/* Student Search & Select */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 block">Select Student Context</label>
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
                <option value="">-- General / No Profile --</option>
                {filteredStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-xs text-white/60 block">AI Consultant Model</label>
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-surface-3 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-gold/50 w-full"
              >
                <option value={AI_MODELS.GPT4O}>GPT-4o (Reasoning & Speed)</option>
                <option value={AI_MODELS.CLAUDE_SONNET}>Claude 3.5 Sonnet (Best Advisor Quality)</option>
                <option value={AI_MODELS.GEMINI_PRO}>Gemini Pro 1.5 (Context Matching)</option>
                <option value={AI_MODELS.DEEPSEEK}>DeepSeek Chat (Analytical)</option>
              </select>
            </div>

            {/* Student Profile Overview Sidebar Info */}
            {selectedStudent && (
              <div className="bg-surface-3/50 border border-white/5 rounded-xl p-4 space-y-3 mt-4 flex-1">
                <h3 className="text-gold font-semibold text-xs border-b border-white/5 pb-1 uppercase tracking-wide">
                  Academic Passport
                </h3>
                <div className="space-y-2 text-xs text-white/80">
                  <p><span className="text-white/40 block">GPA / Grade</span> <strong className="text-white">{selectedStudent.gpa || 'N/A'}</strong></p>
                  <p><span className="text-white/40 block">Highest Level</span> <strong className="text-white">{selectedStudent.education_level || 'N/A'}</strong></p>
                  <p><span className="text-white/40 block">IELTS Band score</span> <strong className="text-white">{selectedStudent.ielts_overall || 'N/A'}</strong></p>
                  <p><span className="text-white/40 block">Target Program Preference</span> <strong className="text-white">{selectedStudent.target_course_name || 'N/A'}</strong></p>
                  <p><span className="text-white/40 block">Preferred Destination</span> <strong className="text-white">{selectedStudent.destinations?.country_name || 'Any Country'}</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Area: Interactive Chat Console */}
        <div className="lg:col-span-8 flex flex-col h-full bg-surface-2 border border-white/5 rounded-xl shadow-xl overflow-hidden">
          {/* Chat Header */}
          <div className="bg-surface-3/30 border-b border-white/5 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-white font-semibold">GT Advisor Bot</span>
            </div>
            <button 
              onClick={() => {
                if (confirm('Clear chat history?')) {
                  setMessages(prev => prev.slice(0, 1));
                }
              }}
              className="text-[10px] text-white/40 hover:text-white transition-colors"
            >
              Clear Chat
            </button>
          </div>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center text-white/30 text-xs">
                Select a student in the sidebar to start a guided consultation chat.
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-xl p-4 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gold text-navy font-medium rounded-tr-none'
                      : 'bg-surface-3 border border-white/5 text-white/90 rounded-tl-none whitespace-pre-line'
                  }`}>
                    {/* Render message output */}
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-3 border border-white/5 rounded-xl rounded-tl-none p-4 text-xs text-white/40 flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Advisor is analyzing profiles...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form 
            onSubmit={handleSendMessage}
            className="border-t border-white/5 p-4 bg-surface-3/20 flex items-center gap-3"
          >
            <input 
              type="text"
              placeholder={selectedStudentId ? "Ask for recommendations, scholarship rules, checklist details..." : "Search for a student profile on the left to start..."}
              disabled={!selectedStudentId || loading}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-surface-3 border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!selectedStudentId || !inputMessage.trim() || loading}
              className={`px-4 py-2.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1 ${
                !selectedStudentId || !inputMessage.trim() || loading
                  ? 'bg-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-gold hover:bg-gold-light text-navy'
              }`}
            >
              Send
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
