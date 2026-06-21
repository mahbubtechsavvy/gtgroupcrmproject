'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
const supabase = getSupabaseClient();
import { 
  Globe, FileText, Save, 
  Eye, MapPin, Sparkles, 
  Loader2, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function VisaGuideManager() {
  const [destinations, setDestinations] = useState([]);
  const [selectedDest, setSelectedDest] = useState(null);
  const [guide, setGuide] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [websiteType, setWebsiteType] = useState('study-abroad');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'study-abroad';
    setWebsiteType(type);
  }, []);

  useEffect(() => {
    if (websiteType) fetchDestinations();
  }, [websiteType]);

  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from('web_destinations')
        .select('*')
        .eq('website_type', websiteType)
        .order('name', { ascending: true });
      
      if (error) throw error;
      setDestinations(data || []);
      if (data?.length > 0) {
        setSelectedDest(data[0]);
        setGuide(data[0].visa_guide || '');
      }
    } catch (error) {
      toast.error('Failed to load destinations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDest) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('web_destinations')
        .update({ 
          visa_guide: guide,
          updated_at: new Date() 
        })
        .eq('id', selectedDest.id);

      if (error) throw error;
      toast.success(`Visa guide for ${selectedDest.name} updated`);
    } catch (error) {
      toast.error('Failed to save guide');
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
            <Globe className="text-gold" />
            Visa Intelligence Hub
          </h1>
          <p className="page-subtitle">Develop comprehensive regulatory guides and application protocols for global study destinations</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary btn-lg shadow-gold min-w-[220px]"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20}/> Publish Updates</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Pane */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between px-2">
            <label className="text-[10px] font-bold text-gold uppercase tracking-[0.2em]">Destinations</label>
            <span className="badge badge-secondary">{destinations.length}</span>
          </div>
          
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {destinations.map(d => (
              <button 
                key={d.id}
                onClick={() => { setSelectedDest(d); setGuide(d.visa_guide || ''); }}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                  selectedDest?.id === d.id 
                  ? 'bg-gold border-gold text-navy shadow-lg shadow-gold/20' 
                  : 'bg-surface-2 border-border hover:border-gold/30 text-text'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    selectedDest?.id === d.id ? 'bg-navy/10 text-navy' : 'bg-surface-1 text-gold'
                  }`}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm leading-tight">{d.name}</div>
                    <div className={`text-[10px] uppercase tracking-widest mt-1 font-mono ${
                      selectedDest?.id === d.id ? 'text-navy/60' : 'text-text-dim'
                    }`}>
                      {d.visa_guide ? 'Guide Active' : 'Pending Content'}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className={`transition-transform duration-500 ${
                  selectedDest?.id === d.id ? 'translate-x-1 opacity-100' : 'opacity-0'
                }`} />
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
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Visa Protocol: {selectedDest?.name}</h3>
                  <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-semibold italic">Standard Operating Procedure for {selectedDest?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="badge badge-gold">Regulatory Sync</div>
              </div>
            </div>
            
            <div className="relative flex-1 bg-surface-1">
              <div className="absolute top-8 left-8 text-gold/5 pointer-events-none">
                <Globe size={400} />
              </div>
              <textarea 
                value={guide}
                onChange={(e) => setGuide(e.target.value)}
                className="w-full h-full p-12 bg-transparent outline-none font-sans text-lg text-text leading-relaxed resize-none relative z-10 custom-scrollbar"
                placeholder={`Draft the comprehensive visa guide for students traveling to ${selectedDest?.name}... Use Markdown for structural clarity.`}
              />
            </div>

            <div className="bg-surface-2 px-8 py-4 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-text-dim">
                <Sparkles size={14} className="text-gold" />
                <span>Advanced AI Content Assistance Enabled</span>
              </div>
              <div className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em]">
                Last Refined: {selectedDest?.updated_at ? new Date(selectedDest.updated_at).toLocaleDateString() : 'Initial Draft'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
