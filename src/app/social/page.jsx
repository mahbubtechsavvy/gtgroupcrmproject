'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/layout/AppLayout';
import { toast } from 'react-hot-toast';

export default function GTSocialPage() {
  const user = useUser();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [successStory, setSuccessStory] = useState('');
  const [building, setBuilding] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    fetchStudents();
    fetchTemplates();
  }, []);

  async function fetchStudents() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, visa_status, target_country')
        .order('full_name');
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchTemplates() {
    try {
      setLoadingTemplates(true);
      const { data, error } = await supabase
        .from('marketing_assets')
        .select('*')
        .eq('type', 'template');
      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTemplates(false);
    }
  }

  function handleBuildSuccessStory() {
    if (!selectedStudentId) {
      toast.error('Please select a student');
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    setBuilding(true);
    // Simulate generation of premium card content
    setTimeout(() => {
      setSuccessStory(`🏆 VISA SUCCESS STORY: CONGRATULATIONS ${student.full_name.toUpperCase()}! 🏆

We are thrilled to announce that our student, ${student.full_name}, has successfully received their Student Visa for ${student.target_country || 'their target destination'}! 🌟

Here is a glimpse of their journey:
- Student Name: ${student.full_name}
- Destination: ${student.target_country || 'South Korea'}
- Visa Class: Student D-2
- Consulting Office: GT Group

Processing a student visa requires meticulous documentation and expert strategy. Thanks to the hard work of our counseling team, ${student.full_name} is now ready to fly and begin their higher education journey abroad! ✈️🎓

Want to be our next success story? Book your free assessment session today!
👉 Send us a DM or call +880-1234-567890

#VisaSuccess #StudyAbroad #GTGroupSuccess #StudyInKorea #HigherEducation #GlobalStudents`);
      setBuilding(false);
      toast.success('Visa success promo copy compiled!');
    }, 500);
  }

  async function handleCopyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied!');
    } catch (err) {
      toast.error('Copy failed');
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
          <span className="text-gold">✨</span> GT Social Hub
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Access high-performing marketing templates and generate visual success story copy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Story Builder Panel */}
        <div className="lg:col-span-1 bg-surface-2 border border-white/5 rounded-xl p-6 h-fit space-y-6">
          <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <span className="text-gold">★</span> Success Story Builder
          </h3>
          <p className="text-white/60 text-xs leading-relaxed">
            Select a student who received visa approval to compile a high-converting social media spotlight banner copy.
          </p>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-white/70 text-xs font-semibold">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
              >
                <option value="">-- Select Student --</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>{st.full_name} ({st.visa_status || 'Under review'})</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleBuildSuccessStory}
              disabled={building}
              className="w-full bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2 rounded-lg transition-all text-sm"
            >
              {building ? 'Compiling Banner...' : 'Build Promo Copy'}
            </button>
          </div>

          {successStory && (
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/50">Promo Copy</span>
                <button
                  onClick={() => handleCopyToClipboard(successStory)}
                  className="text-xs text-gold hover:underline"
                >
                  Copy Copy
                </button>
              </div>
              <div className="bg-surface-3 border border-white/5 rounded-lg p-4 font-mono text-[10px] text-white/70 h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {successStory}
              </div>
            </div>
          )}
        </div>

        {/* Templates Library & Performance Rankings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Templates Library */}
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-6">
            <h3 className="font-display text-lg font-bold text-white">Office Templates Library</h3>

            {loadingTemplates ? (
              <p className="text-white/40 text-center py-6 text-sm">Loading templates...</p>
            ) : templates.length === 0 ? (
              <div className="bg-surface-3 border border-white/5 rounded-lg p-6 text-center text-xs text-white/40">
                No templates saved yet. You can create templates in Settings.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="bg-surface-3 border border-white/5 rounded-lg p-4 flex flex-col justify-between space-y-4 hover:border-gold/20 transition-all">
                    <div className="space-y-2">
                      <h4 className="font-display text-sm font-bold text-white">{tpl.title}</h4>
                      <p className="text-white/60 text-xs leading-relaxed line-clamp-3 font-mono bg-navy/40 p-2 rounded border border-white/5">
                        {tpl.content}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <div className="flex gap-1">
                        {tpl.tags?.slice(0, 2).map((t, idx) => (
                          <span key={idx} className="bg-white/5 text-white/50 text-[9px] px-1.5 py-0.5 rounded font-mono">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleCopyToClipboard(tpl.content)}
                        className="text-xs text-gold hover:underline"
                      >
                        Copy Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance rankings scoreboard */}
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-white">GT Office Spotlight Leaderboard</h3>
            <p className="text-white/60 text-xs leading-relaxed">
              Global ranking of offices by active enrollment metrics for building marketing spotlight articles.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 text-xs font-semibold">
                    <th className="py-2 px-3">Rank</th>
                    <th className="py-2 px-3">Office Branch</th>
                    <th className="py-2 px-3">Conversion Rate</th>
                    <th className="py-2 px-3 text-right">Active Students</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-3 text-gold font-bold">#1</td>
                    <td className="py-2 px-3 font-semibold text-white">Dhaka Main Office</td>
                    <td className="py-2 px-3 text-success">84.2% conversion</td>
                    <td className="py-2 px-3 text-right font-mono">142 students</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-3 text-white/60">#2</td>
                    <td className="py-2 px-3 font-semibold text-white">Chittagong Office</td>
                    <td className="py-2 px-3 text-success font-medium">78.5% conversion</td>
                    <td className="py-2 px-3 text-right font-mono">87 students</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-3 text-white/60">#3</td>
                    <td className="py-2 px-3 font-semibold text-white">Sylhet Branch</td>
                    <td className="py-2 px-3 text-warning">64.1% conversion</td>
                    <td className="py-2 px-3 text-right font-mono">41 students</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
