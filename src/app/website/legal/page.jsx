'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
const supabase = getSupabaseClient();
import { 
  FileText, Shield, Scale, 
  Save, Eye, RefreshCw, 
  Loader2, CheckCircle2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LegalManager() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [websiteType, setWebsiteType] = useState('study-abroad');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type) setWebsiteType(type);
    fetchPolicies(type || 'study-abroad');
  }, []);

  const fetchPolicies = async (type = websiteType) => {
    try {
      const { data, error } = await supabase
        .from('web_legal_content')
        .select('*')
        .eq('website_type', type);
      
      if (error) throw error;
      setPolicies(data || []);
      if (data?.length > 0) {
        setSelectedPolicy(data[0]);
        setContent(data[0].content);
      }
    } catch (error) {
      toast.error('Failed to load legal content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPolicy) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('web_legal_content')
        .update({ 
          content, 
          updated_at: new Date() 
        })
        .eq('id', selectedPolicy.id);

      if (error) throw error;
      toast.success('Policy updated successfully');
      fetchPolicies();
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-content space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Scale className="text-gold" />
            Compliance & Governance
          </h1>
          <p className="page-subtitle">Manage institutional privacy protocols, terms of service, and global regulatory disclosures</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary btn-lg shadow-gold min-w-[220px]"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20}/> Certify & Publish</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Pane */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between px-2">
            <label className="text-[10px] font-bold text-gold uppercase tracking-[0.2em]">Legal Artifacts</label>
            <span className="badge badge-secondary">{policies.length}</span>
          </div>
          
          <div className="space-y-3">
            {policies.map(p => (
              <button 
                key={p.id}
                onClick={() => { setSelectedPolicy(p); setContent(p.content); }}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex flex-col gap-4 group ${
                  selectedPolicy?.id === p.id 
                  ? 'bg-gold border-gold text-navy shadow-lg shadow-gold/20' 
                  : 'bg-surface-2 border-border hover:border-gold/30 text-text'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    selectedPolicy?.id === p.id ? 'bg-navy/10 text-navy' : 'bg-surface-1 text-gold'
                  }`}>
                    {p.type === 'privacy' ? <Shield size={18}/> : <FileText size={18}/>}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-sm leading-tight truncate">{p.title}</div>
                    <div className={`text-[10px] uppercase tracking-widest mt-1 font-mono ${
                      selectedPolicy?.id === p.id ? 'text-navy/60' : 'text-text-dim'
                    }`}>
                      REV: {new Date(p.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editorial Pane */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="card glass p-0 overflow-hidden border-border min-h-[750px] flex flex-col">
            <div className="bg-surface-2/50 px-8 py-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold shadow-inner border border-gold/20">
                  <Scale size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{selectedPolicy?.title}</h3>
                  <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-semibold italic">Official Institutional Disclosure</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2.5 bg-surface-1 rounded-xl text-text-dim hover:text-gold transition-colors border border-border">
                  <Eye size={18}/>
                </button>
                <div className="badge badge-gold">Active Protocol</div>
              </div>
            </div>
            
            <div className="relative flex-1 bg-surface-1">
              <div className="absolute top-8 left-8 text-gold/5 pointer-events-none">
                <Shield size={400} />
              </div>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full p-12 bg-transparent outline-none font-sans text-lg text-text leading-relaxed resize-none relative z-10 custom-scrollbar"
                placeholder="Draft the official legal content here... Use Markdown for structural precision."
              />
            </div>

            <div className="bg-surface-2 px-8 py-4 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-text-dim font-mono uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Regulatory Compliant</span>
              </div>
              <div className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em]">
                System ID: {selectedPolicy?.id?.slice(0, 8)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
