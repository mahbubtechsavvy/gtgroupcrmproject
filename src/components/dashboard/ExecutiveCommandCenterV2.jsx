'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, Users, Briefcase, Zap, 
  ArrowUpRight, Globe, Calendar, Layers,
  BarChart3, Rocket, ShieldCheck, DollarSign,
  ChevronRight, Activity, Filter, LayoutGrid
} from 'lucide-react';
import { 
  Tooltip, ResponsiveContainer, AreaChart, Area, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import v2 from './dashboard-v2.module.css';

export default function ExecutiveCommandCenterV2({
  superAdmin,
  user,
  router,
  stats,
  nexusStats,
  revenueData,
  tasks,
  handleToggleTask,
  recentActivity,
  officeStats
}) {
  const [viewMode, setViewMode] = useState('executive'); // executive, nexus, study_abroad

  // Multi-currency formatting
  const formatCurrency = (val, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Example: currencyRates = { USD: 1, KRW: 1350, BDT: 110 }
  const currencyRates = {
    USD: 1,
    KRW: 1350,
    BDT: 110,
    // Add more as needed
  };

  // Example: revenue in USD
  const globalRevenueUSD = 1240000 + (nexusStats?.totalRevenue || 0);
  const globalRevenueKRW = globalRevenueUSD * currencyRates.KRW;
  const globalRevenueBDT = globalRevenueUSD * currencyRates.BDT;

  const topMetrics = [
    { 
      label: 'Global Monthly Revenue', 
      value: formatCurrency(globalRevenueUSD, 'USD'),
      valueKRW: formatCurrency(globalRevenueKRW, 'KRW'),
      valueBDT: formatCurrency(globalRevenueBDT, 'BDT'),
      icon: <DollarSign size={24} />, 
      trend: '+18.4%', 
      color: '#10B981',
      desc: 'Combined Nexus & Consulting'
    },
    { 
      label: 'Nexus Enterprise Scale', 
      value: nexusStats?.activeProjects || 0, 
      icon: <Zap size={24} />, 
      trend: 'Active Contracts', 
      color: '#3B82F6',
      desc: 'High-Value Digital Solutions'
    },
    { 
      label: 'Student Mobility Index', 
      value: stats?.visaApproved || 0, 
      icon: <ShieldCheck size={24} />, 
      trend: '88% Success Rate', 
      color: '#F59E0B',
      desc: 'Approved Visa Protocols'
    },
  ];

  return (
    <div className={v2.v2Container}>
      
      {/* ── ADVANCED COMMAND HEADER ── */}
      <div className={`${v2.glassCard} p-10 mb-12 flex justify-between items-center`}>
        <div className={v2.floatingGlow} style={{ top: '-50px', right: '-50px', width: '300px', height: '300px' }} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <span className="badge badge-gold px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em]">PLATFORM V2.0</span>
            <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-widest">
              <div className={`${v2.statusIndicator} bg-emerald-500 ${v2.animatePulse}`} />
              Systems Operational
            </div>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter leading-none mb-4">
            GT Overview<span className="text-gold">.</span>
          </h1>
          <div className="flex items-center gap-6 text-text-dim font-bold">
            <span className="flex items-center gap-2"><Globe size={16} className="text-gold" /> Global Network active</span>
            <span className="flex items-center gap-2"><Calendar size={16} className="text-blue-500" /> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="flex gap-4 relative z-10">
          <div className="bg-surface-2 p-1.5 rounded-2xl border border-border flex gap-1">
            <button 
              onClick={() => setViewMode('executive')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'executive' ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'text-text-muted hover:text-white'}`}
            >
              Unified
            </button>
            <button 
              onClick={() => setViewMode('nexus')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'nexus' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-text-muted hover:text-white'}`}
            >
              Nexus
            </button>
            <button 
              onClick={() => setViewMode('study_abroad')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'study_abroad' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-text-muted hover:text-white'}`}
            >
              Study Abroad
            </button>
          </div>
          <button onClick={() => router.push('/students?action=add')} className="btn btn-primary btn-lg shadow-gold px-8 rounded-2xl gap-3">
            <Rocket size={20} /> Launch Lead
          </button>
        </div>
      </div>

      {/* ── THE "CEO TOP 3" METRICS ── */}
      <div className={v2.kpiGrid}>
        {/* Global Revenue Multi-Currency Widget */}
        <div className={v2.glassCard} style={{ padding: '40px' }}>
          <div className="flex justify-between items-start mb-10">
            <div className="w-16 h-16 rounded-3xl bg-surface-2 border border-border flex items-center justify-center text-gold shadow-inner" style={{ color: topMetrics[0].color }}>
              {topMetrics[0].icon}
            </div>
            <div className="text-right">
              <span className="text-xs font-black tracking-widest uppercase" style={{ color: topMetrics[0].color }}>{topMetrics[0].trend}</span>
              <p className="text-[10px] text-text-dim mt-1 font-bold uppercase">{topMetrics[0].desc}</p>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim mb-4">{topMetrics[0].label}</p>
          <h2 className={`${v2.metricValue} text-white mb-2`}>{topMetrics[0].value}</h2>
          <div className="flex gap-4 mb-4">
            <span className="text-xs font-bold text-gold">KRW: {topMetrics[0].valueKRW}</span>
            <span className="text-xs font-bold text-blue-400">BDT: {topMetrics[0].valueBDT}</span>
          </div>
          <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-gold" style={{ width: '85%', background: topMetrics[0].color }} />
          </div>
        </div>
        {/* Other Metrics */}
        {topMetrics.slice(1).map((m, i) => (
          <div key={i} className={v2.glassCard} style={{ padding: '40px' }}>
            <div className="flex justify-between items-start mb-10">
              <div className="w-16 h-16 rounded-3xl bg-surface-2 border border-border flex items-center justify-center text-gold shadow-inner" style={{ color: m.color }}>
                {m.icon}
              </div>
              <div className="text-right">
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: m.color }}>{m.trend}</span>
                <p className="text-[10px] text-text-dim mt-1 font-bold uppercase">{m.desc}</p>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim mb-4">{m.label}</p>
            <h2 className={`${v2.metricValue} text-white mb-6`}>{m.value}</h2>
            <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-gold" style={{ width: '85%', background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── GLOBAL OFFICE MONITOR (NEW) ── */}
      <div className={`${v2.glassCard} p-8 mb-12`}>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
              <Globe className="text-gold" />
              Global Infrastructure Monitor
            </h3>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-1">Live Status: Dhaka • Seoul • Colombo • Ho Chi Minh</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All Systems Nominal
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(officeStats || []).map((off, idx) => (
            <div key={idx} className="p-6 bg-surface-2 rounded-2xl border border-border group hover:border-gold/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-sm font-black text-white uppercase tracking-tight">{off.name}</h4>
                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md uppercase">Online</span>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mb-1">Students</p>
                  <p className="text-xl font-black text-white">{off.students || 0}</p>
                </div>
                <div className="w-px h-8 bg-border mt-2" />
                <div className="flex-1 text-right">
                  <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mb-1">Enrolled</p>
                  <p className="text-xl font-black text-gold">{off.enrolled || 0}</p>
                </div>
              </div>
              <div className="mt-4 h-1 w-full bg-surface-3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gold/50" 
                  style={{ width: off.students > 0 ? `${(off.enrolled / off.students) * 100}%` : '0%' }} 
                />
              </div>
            </div>
          ))}
          {(!officeStats || officeStats.length === 0) && (
            [1,2,3,4].map(i => (
              <div key={i} className="p-6 bg-surface-2 rounded-2xl border border-border border-dashed opacity-50 flex items-center justify-center">
                <span className="text-[10px] font-bold text-text-dim uppercase">Node {i} Offline</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── DYNAMIC COMMAND BOARDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Main Intelligence Board (70%) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Revenue Intelligence */}
          <div className={`${v2.glassCard} p-8`}>
            <div className={v2.sectionHeader}>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  <Activity className="text-gold" />
                  Financial Intelligence Engine
                </h3>
                <p className="text-text-muted text-sm font-bold uppercase tracking-widest mt-1">Global Revenue Velocity Analytics</p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-icon btn-secondary"><Filter size={18} /></button>
                <button className="btn btn-icon btn-secondary"><LayoutGrid size={18} /></button>
              </div>
            </div>
            
            <div className="h-[350px] mt-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A227" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C9A227" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNexus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12, fontWeight: 'bold'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12, fontWeight: 'bold'}} dx={-10} tickFormatter={val => `$${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                  />
                  <Area type="monotone" dataKey="Study Abroad" stroke="#C9A227" strokeWidth={4} fillOpacity={1} fill="url(#colorStudy)" />
                  <Area type="monotone" dataKey="Nexus" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorNexus)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Business Entity Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`${v2.glassCard} p-8 group cursor-pointer hover:border-blue-500/50 transition-all duration-700`}>
               <div className="flex justify-between items-center mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                   <Zap size={24} />
                 </div>
                 <ChevronRight className="text-text-dim group-hover:text-blue-500 group-hover:translate-x-2 transition-all" />
               </div>
               <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Nexus Digital Ops</h4>
               <p className="text-text-muted text-sm leading-relaxed mb-6">Software Architecture, AI Automation, and Enterprise Branding Division.</p>
               <div className="flex gap-4">
                 <div>
                   <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mb-1">Active</p>
                   <p className="text-xl font-black text-white">{nexusStats?.activeProjects || 0}</p>
                 </div>
                 <div className="w-px h-10 bg-border mt-2" />
                 <div>
                   <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mb-1">Pipeline</p>
                   <p className="text-xl font-black text-white">{formatCurrency(nexusStats?.totalRevenue / 10)}</p>
                 </div>
               </div>
            </div>

            <div className={`${v2.glassCard} p-8 group cursor-pointer hover:border-emerald-500/50 transition-all duration-700`}>
               <div className="flex justify-between items-center mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                   <Globe size={24} />
                 </div>
                 <ChevronRight className="text-text-dim group-hover:text-emerald-500 group-hover:translate-x-2 transition-all" />
               </div>
               <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Study Abroad Hub</h4>
               <p className="text-text-muted text-sm leading-relaxed mb-6">Global Education Consulting, Visa Protocols, and Student Placement.</p>
               <div className="flex gap-4">
                 <div>
                   <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mb-1">Success</p>
                   <p className="text-xl font-black text-white">{stats?.visaApproved || 0}</p>
                 </div>
                 <div className="w-px h-10 bg-border mt-2" />
                 <div>
                   <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mb-1">New Leads</p>
                   <p className="text-xl font-black text-white">{stats?.activeLeads || 0}</p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Side Operations Board (30%) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Global Stream (Real-time) */}
          <div className={`${v2.glassCard} p-8 h-full`}>
            <div className={v2.sectionHeader}>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                  <BarChart3 className="text-gold" />
                  Live Stream
                </h3>
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-1">Real-time Coordination Feed</p>
              </div>
            </div>

            <div className="space-y-6 mt-8">
              {recentActivity?.slice(0, 6).map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center text-gold font-black border border-border group-hover:bg-gold group-hover:text-navy transition-all">
                    {item.users?.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-white uppercase tracking-tight">{item.users?.full_name}</span>
                      <span className="text-[9px] text-text-dim font-bold">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] text-text-muted leading-tight line-clamp-2">{item.content}</p>
                  </div>
                </div>
              ))}
              {(!recentActivity || recentActivity.length === 0) && (
                 <div className="p-10 text-center border border-dashed border-border rounded-2xl">
                   <p className="text-text-dim text-xs font-bold uppercase">All quiet on the global front</p>
                 </div>
              )}
            </div>

            <button onClick={() => router.push('/chat')} className="btn btn-secondary w-full mt-10 rounded-xl py-4 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3">
              Enter Operations Room <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Quick Actions / Shortcuts */}
          <div className={`${v2.glassCard} p-8`}>
             <h4 className="text-xs font-black text-gold uppercase tracking-[0.2em] mb-6">Command Shortcuts</h4>
             <div className="grid grid-cols-2 gap-4">
               {[
                 { label: 'Visa Guides', icon: <ShieldCheck size={16} />, href: '/website/visa' },
                 { label: 'Uni Manager', icon: <LayoutGrid size={16} />, href: '/website/universities' },
                 { label: 'Nexus CMS', icon: <Layers size={16} />, href: '/website/nexus' },
                 { label: 'Team', icon: <Users size={16} />, href: '/website/team' }
               ].map((btn, i) => (
                 <button 
                   key={i} 
                   onClick={() => router.push(btn.href)}
                   className="p-4 bg-surface-2 rounded-xl border border-border hover:border-gold/50 hover:bg-gold/5 transition-all text-left group"
                 >
                   <div className="text-gold mb-3 group-hover:scale-110 transition-transform">{btn.icon}</div>
                   <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{btn.label}</span>
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
