'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  Rocket, Briefcase, FileText, CheckCircle2, 
  Clock, AlertCircle, MessageSquare, Download,
  ExternalLink, Globe, Layout, Cpu
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [visaStatus, setVisaStatus] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const supabase = getSupabaseClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Get Portal Profile
      const { data: portalUser } = await supabase
        .from('client_portal_users')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(portalUser);

      // 2. Conditional Fetch
      if (portalUser.client_type === 'nexus_b2b') {
        const { data: b2bProjects } = await supabase
          .from('nexus_projects')
          .select('*')
          .eq('client_id', portalUser.reference_id)
          .order('created_at', { ascending: false });
        setProjects(b2bProjects || []);
      } else {
        // Fetch Student Visa Progress
        const { data: student } = await supabase
          .from('students')
          .select('visa_status, university_name, course_name')
          .eq('id', portalUser.reference_id)
          .single();
        setVisaStatus(student);
      }
    } catch (err) {
      toast.error('Data synchronization failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-20 text-center"><div className="loading-spinner mx-auto"></div></div>;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[32px] p-10 border border-white/5 bg-surface-1 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-l from-gold to-transparent"></div>
        </div>
        
        <div className="relative z-10 space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight">
            Welcome back, <span className="text-gold">{profile?.full_name.split(' ')[0]}</span>
          </h1>
          <p className="text-text-muted text-lg">Nexus Protocol Status: <span className="text-emerald-500 font-bold uppercase tracking-widest text-sm">Synchronized</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {profile?.client_type === 'nexus_b2b' ? (
            <>
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Layout className="text-gold" /> Active Digital Missions
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {projects.length === 0 ? (
                  <div className="card glass p-10 text-center text-text-muted">No active projects found.</div>
                ) : (
                  projects.map(project => (
                    <div key={project.id} className="card glass p-6 group hover:border-gold/30 transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                            <Cpu size={24} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-gold transition-colors">{project.project_name}</h3>
                            <div className="text-xs text-text-muted uppercase tracking-widest mt-1">{project.project_type.replace('_', ' ')}</div>
                          </div>
                        </div>
                        <span className="badge badge-gold uppercase text-[10px] tracking-widest">{project.status}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-8 mb-6">
                        <div className="space-y-1">
                          <div className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Target Launch</div>
                          <div className="text-sm text-text font-medium flex items-center gap-2">
                            <Clock size={14} className="text-gold" /> {project.target_launch_date || 'TBD'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Development Link</div>
                          <div className="text-sm text-blue-400 font-medium flex items-center gap-2">
                            <Globe size={14} /> 
                            {project.live_url ? <a href={project.live_url} target="_blank">View Live <ExternalLink size={10} /></a> : 'In Preparation'}
                          </div>
                        </div>
                      </div>

                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className={`h-full bg-gold shadow-gold-sm transition-all duration-1000 w-[${project.status === 'completed' ? '100%' : project.status === 'testing' ? '85%' : '45%'}]`}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Rocket className="text-gold" /> Visa Application Intelligence
              </h2>
              <div className="card glass p-10 border-gold/20">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-24 h-24 rounded-full border-4 border-gold/20 flex items-center justify-center relative">
                    <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-navy shadow-gold animate-pulse">
                      <CheckCircle2 size={32} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{visaStatus?.visa_status || 'Processing'}</h3>
                    <p className="text-text-muted mt-2">
                      Your application for <strong>{visaStatus?.university_name}</strong> is currently being processed by our global visa unit.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-[10px] text-text-dim uppercase font-bold mb-1">University</div>
                      <div className="text-sm font-bold text-white truncate">{visaStatus?.university_name || 'Pending'}</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-[10px] text-text-dim uppercase font-bold mb-1">Course</div>
                      <div className="text-sm font-bold text-white truncate">{visaStatus?.course_name || 'Pending'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Document Hub */}
          <div className="card border-white/5 p-6 space-y-6">
            <h3 className="text-sm font-bold text-gold uppercase tracking-[0.2em] flex items-center gap-2">
              <FileText size={16} /> Document Vault
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-red-500/20 text-red-500 flex items-center justify-center text-xs font-bold">PDF</div>
                  <div className="text-xs font-medium text-text">Service Agreement</div>
                </div>
                <Download size={14} className="text-text-muted group-hover:text-white" />
              </div>
              <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">DOC</div>
                  <div className="text-xs font-medium text-text">Project Scope</div>
                </div>
                <Download size={14} className="text-text-muted group-hover:text-white" />
              </div>
            </div>
          </div>

          {/* Support Nexus */}
          <div className="card bg-gold/5 border-gold/10 p-6 space-y-4">
            <h3 className="text-sm font-bold text-gold uppercase tracking-[0.2em] flex items-center gap-2">
              <MessageSquare size={16} /> Support Nexus
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Need technical assistance or have questions about your application? Connect with your dedicated advisor.
            </p>
            <button className="btn btn-primary w-full shadow-gold-sm">Initialize Support Chat</button>
          </div>
        </div>
      </div>
    </div>
  );
}
