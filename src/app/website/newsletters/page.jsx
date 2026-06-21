'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
const supabase = getSupabaseClient();
import { 
  Send, Users, Mail, 
  History, Eye, Trash2, 
  CheckCircle, Loader2, Sparkles 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function NewsletterManager() {
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('compose');
  
  // Compose state
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: subs } = await supabase.from('web_subscribers').select('*');
      const { data: cams } = await supabase.from('web_newsletter_campaigns').select('*').order('created_at', { ascending: false });
      
      setSubscribers(subs || []);
      setCampaigns(cams || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject || !content) return toast.error('Subject and content are required');
    
    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from('web_newsletter_campaigns')
        .insert([{
          subject,
          content,
          recipient_count: subscribers.length,
          status: 'sent',
          sent_at: new Date()
        }])
        .select();

      if (error) throw error;
      
      toast.success(`Newsletter sent to ${subscribers.length} subscribers!`);
      setSubject('');
      setContent('');
      fetchData();
      setActiveTab('history');
    } catch (error) {
      toast.error('Failed to send newsletter');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="page-content space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Mail className="text-gold" />
            Global Broadcast Center
          </h1>
          <p className="page-subtitle">Orchestrate multi-channel communications to your global student and alumni network</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-surface-2/80 px-6 py-3 rounded-2xl border border-border shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
              <Users size={20} />
            </div>
            <div>
              <div className="text-xl font-black text-white leading-none">{subscribers.length.toLocaleString()}</div>
              <div className="text-[10px] text-gold uppercase font-bold tracking-widest mt-1">Verified Audience</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-surface-2 rounded-2xl w-fit border border-border shadow-inner">
        <button 
          onClick={() => setActiveTab('compose')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
            activeTab === 'compose' ? 'bg-gold text-navy shadow-lg' : 'text-text-dim hover:text-white'
          }`}
        >
          <Send size={14}/> Intelligence Composer
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
            activeTab === 'history' ? 'bg-gold text-navy shadow-lg' : 'text-text-dim hover:text-white'
          }`}
        >
          <History size={14}/> Transmission Log
        </button>
      </div>

      {activeTab === 'compose' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="card glass p-8 space-y-8 border-border">
              <div className="flex items-center gap-4 border-b border-border pb-6">
                <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold border border-gold/20">
                  <Send size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">New Transmission</h3>
                  <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-semibold italic">Broadcasting to {subscribers.length} Global Nodes</p>
                </div>
              </div>

              <form onSubmit={handleSend} className="space-y-6">
                <div className="form-group">
                  <label className="form-label">Strategic Subject Line</label>
                  <input 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. [GT Group Exclusive] University Admission Portal - Fall 2026 Intake" 
                    className="form-input text-lg font-bold"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Transmission Payload (HTML Architecture)</label>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={15}
                    placeholder="Input your institutional communication payload here..." 
                    className="form-textarea font-mono text-sm leading-relaxed"
                  />
                </div>
                
                <div className="pt-4">
                  <button 
                    disabled={isSending || subscribers.length === 0}
                    className="btn btn-primary btn-lg w-full shadow-gold h-16 text-lg"
                  >
                    {isSending ? <Loader2 className="animate-spin" size={24} /> : <><Send size={24}/> Execute Global Broadcast</>}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="card glass p-6 border-gold/20 bg-gold/5 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 text-gold/5 pointer-events-none">
                <Sparkles size={120} />
              </div>
              <h4 className="font-bold text-gold flex items-center gap-2 mb-4 uppercase tracking-[0.2em] text-[10px]">
                <Sparkles size={14} /> Intelligence Suggestion
              </h4>
              <p className="text-sm text-text-dim leading-relaxed italic">
                Utilize dynamic tokens like <code className="text-gold font-bold font-mono px-1">{"{{name}}"}</code> and <code className="text-gold font-bold font-mono px-1">{"{{destination}}"}</code> to personalize transmission packets and increase engagement by 28%.
              </p>
            </div>

            <div className="card glass p-8 border-border bg-surface-2/30">
              <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6">Growth Velocity</h4>
              <div className="flex items-end gap-3 mb-6">
                <div className="text-5xl font-black text-emerald-500 tracking-tighter">+{subscribers.filter(s => new Date(s.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length}</div>
                <div className="text-[10px] text-text-dim font-bold uppercase tracking-widest mb-2 italic">New Nodes / 7D</div>
              </div>
              <div className="h-1.5 bg-navy rounded-full overflow-hidden border border-border shadow-inner">
                <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 w-2/3 shadow-[0_0_10px_rgba(52,211,153,0.3)]" />
              </div>
              <p className="text-[9px] text-text-muted mt-4 font-bold uppercase tracking-widest text-center">Audience integrity: 99.8% Verified</p>
            </div>

            <div className="p-6 rounded-3xl border border-border bg-surface-1 flex items-center gap-4 group cursor-pointer hover:border-gold transition-all duration-500">
              <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-navy transition-all duration-500">
                <Eye size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-widest">Live Preview</div>
                <div className="text-[10px] text-text-dim mt-1">Visualize on mobile/desktop</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {campaigns.map(cam => (
            <div key={cam.id} className="card glass p-6 flex justify-between items-center group hover:border-gold/50 transition-all duration-500">
              <div className="flex gap-6 items-center">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner group-hover:bg-emerald-500 group-hover:text-navy transition-all duration-500">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white group-hover:text-gold transition-colors">{cam.subject}</h4>
                  <div className="flex items-center gap-4 text-[10px] text-text-dim font-bold uppercase tracking-widest mt-2">
                    <span className="flex items-center gap-1.5"><Users size={12} className="text-gold" /> {cam.recipient_count} Nodes</span>
                    <span className="flex items-center gap-1.5"><History size={12} className="text-blue-500" /> {new Date(cam.sent_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                <button className="btn btn-secondary btn-sm" title="View Payload"><Eye size={16}/></button>
                <button className="btn btn-danger btn-sm" title="Purge Log"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}

          {campaigns.length === 0 && (
            <div className="empty-state">
              <History size={64} className="text-text-dim opacity-20" />
              <h3>No Transmission History</h3>
              <p>Your communication log is currently vacant. Execute your first broadcast to begin tracking.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
