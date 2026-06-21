'use client';

import React from 'react';
import { 
  Globe, 
  Settings, 
  FileText, 
  Image as ImageIcon, 
  Users, 
  MessageSquare, 
  Calendar,
  Layout,
  ExternalLink,
  ShieldCheck,
  MousePointer2,
  GraduationCap,
  Building2
} from 'lucide-react';
import Link from 'next/link';

const CMS_MODULES = [
  { label: 'News & Blog', icon: <FileText size={20} />, href: '/website/news', color: '#3B82F6' },
  { label: 'Events & Workshops', icon: <Calendar size={20} />, href: '/website/events', color: '#10B981' },
  { label: 'Testimonials', icon: <MessageSquare size={20} />, href: '/website/testimonials', color: '#F59E0B' },
  { label: 'Nexus Services', icon: <Settings size={20} />, href: '/website/nexus-services', color: '#10B981', nexusOnly: true },
  { label: 'Portfolio / Cases', icon: <ImageIcon size={20} />, href: '/website/nexus-portfolio', color: '#8B5CF6', nexusOnly: true },
  { label: 'Our Team', icon: <Users size={20} />, href: '/website/team', color: '#6366F1' },
  { label: 'Success Stories', icon: <ShieldCheck size={20} />, href: '/website/success-stories', color: '#8B5CF6' },
  { label: 'Destinations', icon: <Globe size={20} />, href: '/website/destinations', color: '#0EA5E9', studyAbroadOnly: true },
  { label: 'Universities', icon: <Building2 size={20} />, href: '/website/universities', color: '#EF4444', studyAbroadOnly: true },
  { label: 'Courses & Training', icon: <GraduationCap size={20} />, href: '/website/courses', color: '#06B6D4', studyAbroadOnly: true },
  { label: 'Scholarships', icon: <ShieldCheck size={20} />, href: '/website/scholarships', color: '#D946EF', studyAbroadOnly: true },
  { label: 'Visa Guides', icon: <Globe size={20} />, href: '/website/visa', color: '#F97316', studyAbroadOnly: true },
  { label: 'Appointments', icon: <Calendar size={20} />, href: '/website/appointments', color: '#14B8A6' },
  { label: 'FAQs', icon: <MessageSquare size={20} />, href: '/website/faqs', color: '#6366F1' },
  { label: 'Newsletters', icon: <FileText size={20} />, href: '/website/newsletters', color: '#EC4899' },
  { label: 'Subscribers', icon: <MousePointer2 size={20} />, href: '/website/subscribers', color: '#10B981' },
  { label: 'Legal / Privacy', icon: <ShieldCheck size={20} />, href: '/website/legal', color: '#64748B' },
];

export default function WebsiteManagerHub({ type, title, subtitle, liveUrl }) {
  const filteredModules = CMS_MODULES.filter(m => {
    if (type !== 'study_abroad' && m.studyAbroadOnly) return false;
    if (type !== 'nexus' && m.nexusOnly) return false;
    return true;
  });

  return (
    <div className="animate-fadeIn">
      <div className="flex-between mb-32" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="flex items-center gap-12 mb-8">
            <span className="badge badge-gold">WEBSITE CMS</span>
            <span className="text-muted text-sm font-bold uppercase tracking-widest">{type.replace('_', ' ')} EDITION</span>
          </div>
          <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <a 
          href={liveUrl} 
          target="_blank" 
          rel="noreferrer" 
          className="btn btn-secondary glass" 
          style={{ padding: '12px 24px', borderRadius: '12px' }}
        >
          <ExternalLink size={18} className="text-gold" />
          View Live Website
        </a>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '24px' 
      }}>
        {filteredModules.map((module, i) => (
          <Link 
            key={i} 
            href={`${module.href}?type=${type}`} 
            className="glass-card-interactive"
            style={{ 
              padding: '24px', 
              borderRadius: '20px', 
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '14px', 
              background: `${module.color}15`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: module.color,
              boxShadow: `0 8px 16px ${module.color}10`
            }}>
              {module.icon}
            </div>
            
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text)', fontWeight: '700' }}>{module.label}</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage your website&apos;s {module.label.toLowerCase()} dynamic content.</p>
            </div>

            <div style={{ 
              marginTop: 'auto', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '0.85rem', 
              fontWeight: '700', 
              color: 'var(--gold)' 
            }}>
              Open Manager 
              <ArrowRight size={14} />
            </div>

            {/* Subtle Gradient Glow */}
            <div style={{ 
              position: 'absolute', 
              bottom: '-20px', 
              right: '-20px', 
              width: '80px', 
              height: '80px', 
              background: `radial-gradient(circle, ${module.color}10 0%, transparent 70%)` 
            }}></div>
          </Link>
        ))}
      </div>

      <div style={{ 
        marginTop: '48px', 
        padding: '32px', 
        background: 'var(--surface-1)', 
        borderRadius: '24px', 
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--gold-glow)', display: 'flex', alignItems: 'center', justify_content: 'center', color: 'var(--gold)' }}>
            <ShieldCheck size={32} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text)' }}>Production Stability Center</h4>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>All changes made here go live instantly to the production website. Review carefully.</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: 'var(--success)', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
            Connected to Supabase
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Last synced: Just now</p>
        </div>
      </div>
    </div>
  );
}

function ArrowRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
