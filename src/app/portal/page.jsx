'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Check, Clock, FileText, Upload, MessageSquare, ChevronRight, Loader2 } from 'lucide-react';
import styles from './portal.module.css';

export default function ClientPortalDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPortalData();
  }, []);

  const fetchPortalData = async () => {
    const supabase = getSupabaseClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get Portal User Profile
      const { data: portalUser } = await supabase
        .from('client_portal_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!portalUser) return;
      setProfile(portalUser);

      // 2. Get Domain Specific Data
      if (portalUser.client_type === 'student') {
        const [studentRes, docsRes] = await Promise.all([
          supabase.from('students').select('*, users!counselor_id(full_name)').eq('id', portalUser.reference_id).single(),
          supabase.from('documents').select('*').eq('student_id', portalUser.reference_id)
        ]);
        setData(studentRes.data);
        setDocuments(docsRes.data || []);
      } else if (portalUser.client_type === 'nexus_b2b') {
        const { data: project } = await supabase
          .from('nexus_projects')
          .select('*, users!assigned_lead(full_name)')
          .eq('client_id', portalUser.reference_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        setData(project);
      }
    } catch (err) {
      console.error('Portal Data Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = getSupabaseClient();
    setUploading(true);
    try {
      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.reference_id}/${Math.random()}.${fileExt}`;
      const filePath = `portal-uploads/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('student-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('student-documents')
        .getPublicUrl(filePath);

      // 3. Create Document Record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          student_id: profile.reference_id,
          document_type: 'Portal Upload',
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          status: 'pending',
          notes: 'Uploaded via Client Portal'
        });

      if (dbError) throw dbError;

      // 4. Refresh List
      fetchPortalData();
    } catch (err) {
      console.error('Upload Error:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-gold" size={48} />
        <p className="text-text-muted font-black uppercase tracking-[0.3em] text-xs">Syncing with Nexus Mainframe...</p>
      </div>
    );
  }

  if (!profile || !data) {
    return (
      <div className={styles.welcomeSection}>
        <h1 className={styles.welcomeTitle}>System Error</h1>
        <p className={styles.welcomeSubtitle}>We couldn&apos;t retrieve your project data. Please contact support.</p>
      </div>
    );
  }

  // Logic for Student Pipeline
  const STUDENT_STAGES = [
    { id: 'new_lead', label: 'Consultation' },
    { id: 'documents_collecting', label: 'Documents' },
    { id: 'application_submitted', label: 'Applied' },
    { id: 'offer_received', label: 'Offer Received' },
    { id: 'visa_applied', label: 'Visa Applied' },
    { id: 'enrolled', label: 'Enrolled' }
  ];

  // Logic for Nexus Pipeline
  const NEXUS_STAGES = [
    { id: 'planning', label: 'Strategic Planning' },
    { id: 'in_progress', label: 'Active Dev' },
    { id: 'testing', label: 'QA / Testing' },
    { id: 'completed', label: 'Live / Deployed' }
  ];

  const isStudent = profile.client_type === 'student';
  const stages = isStudent ? STUDENT_STAGES : NEXUS_STAGES;
  const currentStatus = isStudent ? data.pipeline_status : data.status;
  
  const currentStepIndex = stages.findIndex(s => s.id === currentStatus);
  const progressPercentage = ((currentStepIndex + 1) / stages.length) * 100;

  const managerName = isStudent ? data.users?.full_name : data.users?.full_name;
  const projectTitle = isStudent ? `University Application (${data.university || 'Global Education'})` : `Digital Infrastructure: ${data.project_name}`;

  return (
    <div className="animate-fade-in">
      <div className={styles.welcomeSection}>
        <h1 className={styles.welcomeTitle}>Welcome back, {profile.full_name.split(' ')[0]}</h1>
        <p className={styles.welcomeSubtitle}>Real-time status monitor for {projectTitle}.</p>
      </div>

      <div className={styles.statusGrid}>
        {/* Main Tracking Card */}
        <div className={styles.mainCard}>
          <div className={styles.cardTitle}>
            <Clock className="text-gold" size={24} />
            {isStudent ? 'Application Milestone Tracker' : 'Project Lifecycle Velocity'}
          </div>
          
          <div className={styles.stepper}>
            <div className={styles.stepperLine}></div>
            <div className={styles.stepperProgress} style={{ width: `${progressPercentage}%` }}></div>
            
            {stages.map((stage, index) => {
              const isCompleted = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              
              return (
                <div 
                  key={stage.id} 
                  className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''}`}
                >
                  <div className={styles.stepCircle}>
                    {isCompleted ? <Check size={16} /> : (index + 1)}
                  </div>
                  <div className={styles.stepLabel}>{stage.label}</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '40px', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h4 style={{ color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isStudent ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                Current Protocol: <span className="text-gold">{stages[currentStepIndex]?.label || 'Active'}</span>
              </h4>
              <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">Last Update: {new Date(data.updated_at).toLocaleDateString()}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              {isStudent 
                ? `Your file is currently at the "${stages[currentStepIndex]?.label}" stage. Our global consulting team is coordinating with the respective departments. Your dedicated advisor, ${managerName || 'a Senior Counselor'}, is monitoring all updates.`
                : `Nexus Engineering is currently executing the "${stages[currentStepIndex]?.label}" phase of your digital infrastructure project. All systems are being optimized for performance and security according to the agreed specifications.`}
            </p>
          </div>
        </div>

        {/* Side Panel: Documents & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Documents Card (Only for Students for now, can be expanded for Nexus Assets) */}
          {isStudent && (
            <div className={styles.mainCard} style={{ padding: '24px' }}>
              <div className={styles.cardTitle} style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                <FileText className="text-gold" size={20} />
                Vault: Documents
              </div>
              
              <div className={styles.docList}>
                {documents.map((doc, idx) => (
                  <div key={idx} className={styles.docItem}>
                    <div className={styles.docInfo}>
                      <div className={styles.docIcon}><Check size={16} /></div>
                      <div>
                        <div className={styles.docName}>{doc.document_type.replace(/_/g, ' ')}</div>
                        <div className={styles.docMeta}>Verified: {new Date(doc.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className={`${styles.docStatus} ${styles.statusApproved}`}>Verified</div>
                  </div>
                ))}
                
                {documents.length === 0 && (
                  <div className="p-6 text-center border border-dashed border-border rounded-xl">
                    <p className="text-xs text-text-dim font-bold uppercase">No documents found in vault</p>
                  </div>
                )}

                  <div className={styles.docItem} style={{ borderStyle: 'dashed', borderColor: 'var(--gold-border)', background: 'rgba(239, 183, 72, 0.05)', marginTop: '20px' }}>
                    <div className={styles.docInfo}>
                      <div className={styles.docIcon} style={{ background: 'transparent', border: '1px solid var(--gold)' }}>
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      </div>
                      <div>
                        <div className={styles.docName} style={{ color: 'var(--gold)' }}>
                          {uploading ? 'Processing Architecture...' : 'Missing Artifacts?'}
                        </div>
                        <div className={styles.docMeta}>{uploading ? 'Syncing with secure vault' : 'Upload new documents to your file'}</div>
                      </div>
                    </div>
                    <label className={`btn btn-primary btn-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`} style={{ cursor: 'pointer' }}>
                      {uploading ? 'Uploading...' : 'Upload'}
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleUpload} 
                        disabled={uploading}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </label>
                  </div>
              </div>
            </div>
          )}

          {/* Nexus specific card if needed */}
          {!isStudent && (
            <div className={styles.mainCard} style={{ padding: '24px' }}>
               <div className={styles.cardTitle} style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                <FileText className="text-gold" size={20} />
                Engineering Assets
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-surface-2 rounded-xl border border-border">
                  <div className="text-[10px] text-text-dim font-bold uppercase tracking-widest mb-1">Architecture</div>
                  <div className="text-sm font-bold text-white">{data.project_type.replace(/_/g, ' ').toUpperCase()}</div>
                </div>
                {data.github_repo && (
                  <a href={data.github_repo} target="_blank" className="flex items-center justify-between p-4 bg-navy rounded-xl border border-border hover:border-gold/50 transition-all">
                    <span className="text-xs font-bold text-white">Project Repository</span>
                    <ChevronRight size={14} className="text-gold" />
                  </a>
                )}
                 {data.live_url && (
                  <a href={data.live_url} target="_blank" className="flex items-center justify-between p-4 bg-navy rounded-xl border border-border hover:border-gold/50 transition-all">
                    <span className="text-xs font-bold text-white">Staging Environment</span>
                    <ChevronRight size={14} className="text-gold" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Quick Support Card */}
          <div className={styles.mainCard} style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(239, 183, 72, 0.1) 0%, rgba(15, 17, 16, 0.8) 100%)' }}>
            <div className={styles.cardTitle} style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
              <MessageSquare className="text-gold" size={20} />
              Need Help?
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Direct encrypted communication line with your dedicated project lead.
            </p>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between' }}>
              Contact {managerName || 'Support'} <ChevronRight size={16} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
