'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
const supabase = getSupabaseClient();
import { 
  Trophy, Plus, Search, 
  Edit, Trash2, Globe, 
  User, School, Loader2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SuccessStoriesManager() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentStory, setCurrentStory] = useState(null);

  const [websiteType, setWebsiteType] = useState('study-abroad');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type) setWebsiteType(type);
    fetchStories(type || 'study-abroad');
  }, []);

  const fetchStories = async (type = websiteType) => {
    try {
      const { data, error } = await supabase
        .from('web_success_stories')
        .select('*')
        .eq('website_type', type)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from('web_success_stories').delete().eq('id', id);
      if (error) throw error;
      toast.success('Story deleted');
      fetchStories();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="page-content space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Trophy className="text-gold" />
            Hall of Excellence
          </h1>
          <p className="page-subtitle">Immortalize student achievements and global success narratives to inspire the next generation</p>
        </div>
        <button 
          onClick={() => { setCurrentStory(null); setShowModal(true); }}
          className="btn btn-primary btn-lg shadow-gold"
        >
          <Plus size={20} /> Publish Success Story
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><Trophy size={24} /></div>
          <div className="kpi-value">{stories.length}</div>
          <div className="kpi-label">Alumni Stories</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><Globe size={24} /></div>
          <div className="kpi-value">{[...new Set(stories.map(s => s.destination_country))].filter(Boolean).length}</div>
          <div className="kpi-label">Global Destinations</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><User size={24} /></div>
          <div className="kpi-value">{stories.filter(s => s.is_published).length}</div>
          <div className="kpi-label">Live Testimonials</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-80 card glass animate-pulse" />)
        ) : stories.map(story => (
          <div key={story.id} className="card glass p-0 overflow-hidden group hover:border-gold/50 transition-all duration-500 flex flex-col">
            <div className="relative h-56 bg-surface-2">
              <img 
                src={story.image_url || '/placeholder-user.jpg'} 
                alt={story.student_name} 
                className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              
              <div className="absolute top-4 right-4 flex gap-2 z-10 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <button 
                  onClick={() => { setCurrentStory(story); setShowModal(true); }}
                  className="p-2.5 bg-navy/80 backdrop-blur rounded-xl text-gold hover:bg-gold hover:text-navy transition-all border border-gold/20"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(story.id)}
                  className="p-2.5 bg-navy/80 backdrop-blur rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="absolute bottom-4 left-6 z-10">
                <div className="flex items-center gap-2 text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-1">
                  <Globe size={12} /> {story.destination_country}
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors">{story.student_name}</h3>
              </div>
            </div>

            <div className="p-6 space-y-4 flex-1 flex flex-col">
              <div className="flex items-center gap-3 text-xs text-text-dim font-bold uppercase tracking-widest bg-surface-2/50 p-2 rounded-xl border border-border">
                <School size={14} className="text-blue-500" /> 
                <span className="truncate">{story.university_name}</span>
              </div>
              
              <p className="text-sm text-text leading-relaxed line-clamp-4 italic text-text-dim relative">
                <span className="text-2xl text-gold/20 absolute -top-2 -left-4">&quot;</span>
                {story.story?.replace(/<[^>]*>/g, '')}
              </p>

              <div className="pt-4 border-t border-border mt-auto flex items-center justify-between">
                <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                  Batch of {new Date(story.created_at).getFullYear()}
                </div>
                <div className={`badge ${story.is_published ? 'badge-success' : 'badge-muted'}`}>
                  {story.is_published ? 'Verified' : 'Review'}
                </div>
              </div>
            </div>
          </div>
        ))}

        {stories.length === 0 && !loading && (
          <div className="col-span-full empty-state">
            <Trophy size={64} className="text-text-dim opacity-20" />
            <h3>No Success Stories Yet</h3>
            <p>Gather testimonials from your global alumni and inspire future students.</p>
          </div>
        )}
      </div>
    </div>
  );
}
