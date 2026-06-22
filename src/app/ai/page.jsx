'use client';

import Link from 'next/link';
import { useUser } from '@/components/layout/AppLayout';

export default function AIDashboard() {
  const user = useUser();

  const aiTools = [
    {
      title: 'SOP & Study Plan Generator',
      description: 'Generate Statement of Purpose, Study Plan, and Self-Introduction letters customized to the student\'s academic background.',
      href: '/ai/sop-generator',
      icon: (
        <svg className="text-gold w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
        </svg>
      )
    },
    {
      title: 'Resume & CV Builder',
      description: 'Build customized Resumes, CVs, and Cover Letters matching admissions standards and job application requirements.',
      href: '/ai/resume-builder',
      icon: (
        <svg className="text-gold w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: 'Student Advisor AI',
      description: 'Ask the AI Consultant for university recommendations, scholarship fits, and visa processing guidelines based on real academic profiles.',
      href: '/ai/advisor',
      icon: (
        <svg className="text-gold w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    },
    {
      title: 'AI Document Analysis (OCR)',
      description: 'OCR verify uploaded files, check discrepancies between passport/birth certificate and CRM, and calculate file integrity risk scores.',
      href: '/ai/document-analysis',
      icon: (
        <svg className="text-gold w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      title: 'Counselor Document Review',
      description: 'Access manual student folders audit forms, add corrections, assign compliance flags, and release approvals.',
      href: '/document-review',
      icon: (
        <svg className="text-gold w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-gold">★</span> GT AI Platform
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Centralized intelligent assistants and document verification systems powered by OpenRouter.
          </p>
        </div>
        <div className="bg-surface-3 border border-white/5 px-4 py-2 rounded-lg text-xs text-white/50">
          User Role: <span className="text-gold font-semibold uppercase">{user?.role || 'Guest'}</span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiTools.map((tool) => (
          <Link 
            key={tool.href}
            href={tool.href}
            className="group block bg-surface-2 hover:bg-surface-3 border border-white/5 hover:border-gold/30 rounded-xl p-6 shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/5 rounded-lg group-hover:bg-gold/10 transition-colors">
                {tool.icon}
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="font-display text-lg font-semibold text-white group-hover:text-gold transition-colors flex items-center gap-2">
                  {tool.title}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gold text-sm">→</span>
                </h3>
                <p className="text-white/60 text-xs leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Usage Analytics Promo banner */}
      <div className="bg-glass backdrop-blur-md border border-gold/10 rounded-xl p-6 shadow-gold flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h4 className="text-white font-semibold flex items-center gap-2 text-sm">
            <span className="text-gold">⚡</span> System Token & API Usage
          </h4>
          <p className="text-white/50 text-xs">
            OpenRouter usage and prompt token counts are logged automatically in compliance with SaaS billing policies.
          </p>
        </div>
        <Link 
          href="/settings"
          className="text-xs border border-gold/30 text-gold hover:bg-gold/10 px-4 py-2 rounded transition-all whitespace-nowrap self-start md:self-auto"
        >
          View Usage Logs
        </Link>
      </div>
    </div>
  );
}
