'use client';

import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Zap, 
  ArrowUpRight, 
  Globe, 
  Calendar,
  Layers,
  BarChart3,
  Rocket
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis 
} from 'recharts';
import DailySchedule from './DailySchedule';

export default function ExecutiveCommandCenter({
  superAdmin,
  user,
  router,
  stats,
  nexusStats,
  revenueData,
  tasks,
  handleToggleTask,
  recentActivity
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="animate-fadeIn" style={{ padding: '0', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      
      {/* ── PREMIUM GLASS HEADER ── */}
      <div style={{ 
        marginBottom: '32px', 
        padding: '32px', 
        background: 'var(--glass-bg)', 
        backdropFilter: 'blur(30px)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Glow */}
        <div style={{ 
          position: 'absolute', 
          top: '-100px', 
          right: '-100px', 
          width: '300px', 
          height: '300px', 
          background: 'radial-gradient(circle, var(--gold-glow) 0%, transparent 70%)',
          zIndex: 0
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span className="badge badge-gold">V2.0 PRO</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>GT GROUP GLOBAL CRM</span>
          </div>
          <h1 style={{ 
            fontSize: '2.8rem', 
            fontWeight: '900', 
            fontFamily: 'Outfit, sans-serif', 
            color: 'var(--text)', 
            letterSpacing: '-1px', 
            margin: 0,
            lineHeight: 1.1
          }}>
            {superAdmin ? 'Executive Command' : `${user?.offices?.name || 'Office'} Hub`}
            <span style={{ color: 'var(--gold)' }}>.</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '8px', fontWeight: '500' }}>
            <Calendar size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
          <button className="btn btn-secondary glass" style={{ padding: '12px 24px', borderRadius: 'var(--radius-lg)' }}>
            <Globe size={18} className="text-gold" />
            Global Network
          </button>
          <button 
            onClick={() => router.push('/students?action=add')} 
            className="btn btn-primary shadow-gold" 
            style={{ padding: '12px 28px', borderRadius: 'var(--radius-lg)', gap: '10px' }}
          >
            <Rocket size={18} />
            Launch New Lead
          </button>
        </div>
      </div>

      {/* ── TOP TIER METRICS (GOLDEN GLASS) ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '24px', 
        marginBottom: '40px' 
      }}>
        {[
          { label: 'Total Revenue', value: formatCurrency(1240000 + (nexusStats?.totalRevenue || 0)), icon: <TrendingUp size={24} />, trend: '+12.5%', color: 'var(--success)' },
          { label: 'Active Pipeline', value: formatCurrency(450000), icon: <Layers size={24} />, trend: 'Live', color: 'var(--gold)' },
          { label: 'Nexus Projects', value: nexusStats?.activeProjects || 0, icon: <Zap size={24} />, trend: '95% Completion', color: 'var(--info)' },
          { label: 'Student Success', value: stats?.visaApproved || 0, icon: <Users size={24} />, trend: '88% Approval', color: 'var(--purple)' },
        ].map((kpi, i) => (
          <div key={i} className="glass" style={{ 
            borderRadius: 'var(--radius-lg)', 
            padding: '28px', 
            position: 'relative', 
            overflow: 'hidden',
            transition: 'transform 0.3s ease'
          }}>
            <div style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              color: kpi.color, 
              opacity: 0.8 
            }}>
              {kpi.icon}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 16px 0' }}>{kpi.label}</p>
            <h2 style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--text)', margin: '0 0 8px 0', fontFamily: 'Outfit' }}>{kpi.value}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                fontSize: '0.8rem', 
                fontWeight: '700', 
                color: kpi.color, 
                padding: '2px 8px', 
                background: `${kpi.color}15`, 
                borderRadius: '6px' 
              }}>
                {kpi.trend}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── DUAL COMPANY INTELLIGENCE ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
        gap: '32px', 
        marginBottom: '40px' 
      }}>
        
        {/* NEXUS DIGITAL BOARD */}
        <div style={{ 
          background: 'var(--surface-1)', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius-lg)', 
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
          position: 'relative'
        }}>
          <div style={{ 
            padding: '24px', 
            borderBottom: '1px solid var(--border)', 
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.08), transparent)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--info)', borderRadius: '12px', display: 'flex', alignItems: 'center', justify_content: 'center', color: 'white', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                <Zap size={20} fill="white" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text)' }}>Nexus Digital Operations</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Software & AI Solutions</p>
              </div>
            </div>
            <button className="btn btn-icon btn-secondary" style={{ borderRadius: '10px' }} onClick={() => router.push('/website/nexus')}>
              <ArrowUpRight size={18} />
            </button>
          </div>

          <div style={{ padding: '28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius)' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>ACTIVE PROJECTS</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text)', fontWeight: '800' }}>{nexusStats?.activeProjects || 0}</h4>
                  <div style={{ background: 'var(--success)20', color: 'var(--success)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>LIVE</div>
                </div>
              </div>
              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius)' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>ENTERPRISE CLIENTS</p>
                <h4 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text)', fontWeight: '800' }}>{nexusStats?.totalClients || 0}</h4>
              </div>
            </div>
            
            <div style={{ height: '200px', width: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'Mon', val: 4000 },
                  { name: 'Tue', val: 3000 },
                  { name: 'Wed', val: 5000 },
                  { name: 'Thu', val: 8000 },
                  { name: 'Fri', val: 6000 },
                  { name: 'Sat', val: 9000 },
                  { name: 'Sun', val: 12000 },
                ]}>
                  <defs>
                    <linearGradient id="colorNexus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--info)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--info)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="val" stroke="var(--info)" strokeWidth={3} fillOpacity={1} fill="url(#colorNexus)" />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: 0, left: 0, padding: '10px', pointerEvents: 'none' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--info)', textTransform: 'uppercase' }}>Service Delivery Velocity</span>
              </div>
            </div>
          </div>
        </div>

        {/* STUDY ABROAD BOARD */}
        <div style={{ 
          background: 'var(--surface-1)', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius-lg)', 
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
          position: 'relative'
        }}>
          <div style={{ 
            padding: '24px', 
            borderBottom: '1px solid var(--border)', 
            background: 'linear-gradient(90deg, rgba(239, 183, 72, 0.08), transparent)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--gold)', borderRadius: '12px', display: 'flex', alignItems: 'center', justify_content: 'center', color: '#000', boxShadow: '0 4px 12px rgba(239,183,72,0.3)' }}>
                <Users size={20} fill="#000" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text)' }}>Study Abroad Pipeline</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>International Education Hub</p>
              </div>
            </div>
            <button className="btn btn-icon btn-secondary" style={{ borderRadius: '10px' }} onClick={() => router.push('/students')}>
              <ArrowUpRight size={18} />
            </button>
          </div>

          <div style={{ padding: '28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius)' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>TOTAL LEADS</p>
                <h4 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text)', fontWeight: '800' }}>{stats?.total || 0}</h4>
              </div>
              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius)' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>VISA SUCCESS</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text)', fontWeight: '800' }}>{stats?.visaApproved || 0}</h4>
                  <div style={{ background: 'var(--purple)20', color: 'var(--purple)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>88%</div>
                </div>
              </div>
            </div>
            
            <div style={{ height: '200px', width: '100%' }}>
              {revenueData && revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold-light)" stopOpacity={1}/>
                        <stop offset="100%" stopColor="var(--gold-dark)" stopOpacity={1}/>
                      </linearGradient>
                    </defs>
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                    <Bar dataKey="Revenue" fill="url(#colorGold)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                  No Enrollment Data Available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── UNIFIED OPERATIONS (TASKS & FEED) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        
        {/* TASK HUB */}
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: 'var(--glass-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: 'var(--text)', fontFamily: 'Outfit' }}>Operations Checkpoint</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Daily tasks across all companies</p>
            </div>
            <div style={{ background: 'var(--gold-glow)', color: 'var(--gold-light)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', border: '1px solid var(--gold-border)' }}>
              {tasks.filter(t => !t.is_completed).length} Pending
            </div>
          </div>
          
          <DailySchedule 
            tasks={tasks.filter(t => t.staff_id === user?.id && t.task_period !== 'event')} 
            onToggleTask={handleToggleTask}
          />
        </div>

        {/* GLOBAL ACTIVITY FEED */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: 'var(--text)', fontFamily: 'Outfit' }}>Global Stream</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time coordination feed</p>
            </div>
            <BarChart3 size={20} className="text-muted" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((item, idx) => (
                <div key={item.id} style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  paddingBottom: idx === 4 ? 0 : '20px', 
                  borderBottom: idx === 4 ? 'none' : '1px solid var(--border)' 
                }}>
                  <div style={{ 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '14px', 
                    background: 'var(--surface-3)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'var(--gold)', 
                    fontWeight: '800', 
                    flexShrink: 0,
                    border: '1px solid var(--border-strong)',
                    fontSize: '1.1rem'
                  }}>
                    {item.users?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.95rem' }}>{item.users?.full_name || 'System'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '600' }}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{item.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                Quiet day globally. All systems optimal.
              </div>
            )}
          </div>
          
          <button className="btn btn-secondary" style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}>
            Enter Global Operations Room
          </button>
        </div>

      </div>
    </div>
  );
}
