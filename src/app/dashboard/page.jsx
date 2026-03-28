'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/layout/AppLayout';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import styles from './dashboard.module.css';

const PIPELINE_STAGES = [
  { key: 'new_lead', label: 'New Lead', color: '#6B7280' },
  { key: 'initial_consultation', label: 'Consultation', color: '#3B82F6' },
  { key: 'documents_collecting', label: 'Documents', color: '#F59E0B' },
  { key: 'application_submitted', label: 'Applied', color: '#8B5CF6' },
  { key: 'offer_received', label: 'Offer Received', color: '#06B6D4' },
  { key: 'visa_applied', label: 'Visa Applied', color: '#F97316' },
  { key: 'visa_approved', label: 'Visa Approved', color: '#10B981' },
  { key: 'enrolled', label: 'Enrolled', color: '#C9A227' },
];

const LEAD_SOURCE_COLORS = {
  Facebook: '#1877F2',
  Instagram: '#E4405F',
  Referral: '#10B981',
  'Walk-in': '#F59E0B',
  Website: '#3B82F6',
  WhatsApp: '#25D366',
  LinkedIn: '#0A66C2',
  Other: '#6B7280',
};

const OFFICE_FLAGS = {
  'Bangladesh': '🇧🇩',
  'South Korea': '🇰🇷',
  'Sri Lanka': '🇱🇰',
  'Vietnam': '🇻🇳',
};

export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState([]);
  const [leadSourceData, setLeadSourceData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [officeStats, setOfficeStats] = useState([]);

  const superAdmin = isSuperAdmin(user?.role);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    const supabase = getSupabaseClient();
    setLoading(true);

    try {
      // Build base query for students
      let studentQuery = supabase.from('students').select('id, pipeline_status, lead_source, created_at, office_id');
      if (!superAdmin) {
        studentQuery = studentQuery.eq('office_id', user.office_id);
      }

      const { data: students } = await studentQuery;

      if (students) {
        // KPI stats
        const total = students.length;
        const activeLeads = students.filter(s =>
          !['enrolled', 'rejected', 'deferred'].includes(s.pipeline_status)
        ).length;
        const enrolled = students.filter(s => s.pipeline_status === 'enrolled').length;
        const visaApproved = students.filter(s =>
          ['visa_approved', 'enrolled'].includes(s.pipeline_status)
        ).length;

        setStats({ total, activeLeads, enrolled, visaApproved });

        // Pipeline distribution
        const pipelineCounts = {};
        PIPELINE_STAGES.forEach(s => { pipelineCounts[s.key] = 0; });
        students.forEach(s => {
          if (pipelineCounts[s.pipeline_status] !== undefined) {
            pipelineCounts[s.pipeline_status]++;
          }
        });
        setPipelineData(
          PIPELINE_STAGES.map(s => ({
            name: s.label,
            count: pipelineCounts[s.key],
            color: s.color
          })).filter(s => s.count > 0)
        );

        // Lead source
        const sourceCounts = {};
        students.forEach(s => {
          const src = s.lead_source || 'Other';
          sourceCounts[src] = (sourceCounts[src] || 0) + 1;
        });
        setLeadSourceData(
          Object.entries(sourceCounts).map(([name, value]) => ({
            name, value, color: LEAD_SOURCE_COLORS[name] || '#6B7280'
          }))
        );

        // Monthly trend (last 6 months)
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            name: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            month: d.getMonth(),
            count: 0,
          });
        }
        students.forEach(s => {
          const d = new Date(s.created_at);
          const monthEntry = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
          if (monthEntry) monthEntry.count++;
        });
        setMonthlyTrend(months.map(m => ({ name: m.name, 'New Leads': m.count })));
      }

      // Today's appointments
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      let apptQuery = supabase
        .from('appointments')
        .select('*, students(first_name, last_name), users!counselor_id(full_name)')
        .gte('scheduled_at', todayStr + 'T00:00:00')
        .lte('scheduled_at', todayStr + 'T23:59:59')
        .eq('status', 'scheduled')
        .order('scheduled_at');

      if (!superAdmin) {
        apptQuery = apptQuery.eq('office_id', user.office_id);
      }

      const { data: appointments } = await apptQuery;
      setTodayAppointments(appointments || []);

      // Recent interactions
      let interactQuery = supabase
        .from('interactions')
        .select('*, students(first_name, last_name), users!staff_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(8);

      const { data: interactions } = await interactQuery;
      setRecentActivity(interactions || []);

      // Office stats (super admin only)
      if (superAdmin) {
        const { data: offices } = await supabase
          .from('offices')
          .select('id, name, country');

        if (offices && students) {
          const offStats = offices.map(office => {
            const offStudents = students.filter(s => s.office_id === office.id);
            return {
              name: office.name,
              country: office.country,
              students: offStudents.length,
              enrolled: offStudents.filter(s => s.pipeline_status === 'enrolled').length,
            };
          });
          setOfficeStats(offStats);
        }
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    }

    setLoading(false);
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const activityIcon = (type) => {
    const icons = {
      note: '📝', call: '📞', email: '✉️', meeting: '🤝',
      whatsapp: '💬', document: '📄', payment: '💰', status_change: '🔄',
    };
    return icons[type] || '📌';
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className="loading-spinner" style={{ width: '36px', height: '36px' }} />
        <p className="text-muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className="page-title">
            {superAdmin ? 'Global Overview' : `${user?.offices?.name || 'Office'} Dashboard`}
          </h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-secondary btn-sm" onClick={loadDashboardData}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/students?action=add')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Student
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" id="kpi-total-students">
          <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="kpi-value">{stats?.total || 0}</div>
          <div className="kpi-label">Total Students</div>
        </div>

        <div className="kpi-card" id="kpi-active-leads">
          <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="kpi-value">{stats?.activeLeads || 0}</div>
          <div className="kpi-label">Active Leads</div>
        </div>

        <div className="kpi-card" id="kpi-visa-approved">
          <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="kpi-value">{stats?.visaApproved || 0}</div>
          <div className="kpi-label">Visa Approved</div>
        </div>

        <div className="kpi-card" id="kpi-enrolled">
          <div className="kpi-icon" style={{ background: 'rgba(201, 162, 39, 0.15)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F0C040" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div className="kpi-value">{stats?.enrolled || 0}</div>
          <div className="kpi-label">Enrolled</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Monthly Trend */}
        <div className={`card ${styles.chartCard}`}>
          <div className="card-header">
            <h3 className="section-title">Monthly Lead Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#16213E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#E8E8E8' }}
              />
              <Line type="monotone" dataKey="New Leads" stroke="#C9A227" strokeWidth={2.5} dot={{ fill: '#C9A227', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Sources Pie */}
        <div className={`card ${styles.chartCard} ${styles.chartCardSm}`}>
          <div className="card-header">
            <h3 className="section-title">Lead Sources</h3>
          </div>
          {leadSourceData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={leadSourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {leadSourceData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#16213E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#E8E8E8' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.legendList}>
                {leadSourceData.map((item) => (
                  <div key={item.name} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: item.color }} />
                    <span className="text-sm text-muted">{item.name}</span>
                    <span className="text-sm font-semibold" style={{ marginLeft: 'auto', color: 'var(--color-white)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '40px 16px' }}>
              <p>No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Bar Chart */}
      {pipelineData.length > 0 && (
        <div className={`card mb-24`}>
          <div className="card-header">
            <h3 className="section-title">Pipeline Distribution</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/pipeline')}>
              View Kanban →
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip contentStyle={{ background: '#16213E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#E8E8E8' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {pipelineData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Office Stats (Super Admin) */}
      {superAdmin && officeStats.length > 0 && (
        <div className="mb-24">
          <h3 className="section-title mb-16">Office Performance</h3>
          <div className={styles.officeGrid}>
            {officeStats.map((office) => (
              <div key={office.name} className={`card ${styles.officeCard}`}>
                <div className={styles.officeFlag}>
                  {OFFICE_FLAGS[office.country] || '🌍'}
                </div>
                <h4 className={styles.officeName}>{office.name}</h4>
                <p className="text-muted text-sm">{office.country}</p>
                <div className={styles.officeKpis}>
                  <div>
                    <div className={styles.officeNum}>{office.students}</div>
                    <div className="text-xs text-muted">Students</div>
                  </div>
                  <div>
                    <div className={styles.officeNum} style={{ color: 'var(--color-gold-light)' }}>{office.enrolled}</div>
                    <div className="text-xs text-muted">Enrolled</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Row: Today's Appointments + Activity Feed */}
      <div className={styles.bottomRow}>
        {/* Today's Appointments */}
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Today's Appointments</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/appointments')}>
              View All →
            </button>
          </div>
          {todayAppointments.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p>No appointments today</p>
            </div>
          ) : (
            <div className={styles.apptList}>
              {todayAppointments.map(appt => (
                <div key={appt.id} className={styles.apptItem}>
                  <div className={styles.apptTime}>{formatTime(appt.scheduled_at)}</div>
                  <div className={styles.apptInfo}>
                    <p className="font-medium text-sm">
                      {appt.students?.first_name} {appt.students?.last_name}
                    </p>
                    <p className="text-xs text-muted">{appt.type}</p>
                  </div>
                  <span className="badge badge-info">{appt.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Recent Activity</h3>
          </div>
          {recentActivity.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px' }}>
              <p>No recent activity</p>
            </div>
          ) : (
            <div className={styles.activityList}>
              {recentActivity.map(item => (
                <div key={item.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>{activityIcon(item.type)}</div>
                  <div className={styles.activityContent}>
                    <p className="text-sm">
                      <span className="font-medium">{item.users?.full_name}</span>
                      {' → '}
                      <span>{item.students?.first_name} {item.students?.last_name}</span>
                    </p>
                    <p className="text-xs text-muted" style={{ marginTop: '2px' }}>
                      {item.content?.substring(0, 60)}{item.content?.length > 60 ? '...' : ''}
                    </p>
                  </div>
                  <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
                    {timeAgo(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
