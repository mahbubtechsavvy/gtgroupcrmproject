'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const PIPELINE_STAGES = [
  { key: 'new_lead', label: 'New Leads', color: '#6B7280' },
  { key: 'initial_consultation', label: 'Consultation', color: '#3B82F6' },
  { key: 'documents_collecting', label: 'Documents', color: '#F59E0B' },
  { key: 'application_submitted', label: 'Applied', color: '#8B5CF6' },
  { key: 'offer_received', label: 'Offer', color: '#06B6D4' },
  { key: 'visa_applied', label: 'Visa Applied', color: '#F97316' },
  { key: 'visa_approved', label: 'Visa Approved', color: '#10B981' },
  { key: 'enrolled', label: 'Enrolled', color: '#C9A227' },
];

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [conversionData, setConversionData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [counselorData, setCounselorData] = useState([]);
  const [destData, setDestData] = useState([]);
  const [officeRevData, setOfficeRevData] = useState([]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: u } = await supabase.from('users').select('*, offices!users_office_id_fkey(*)').eq('id', session.user.id).single();
      setUser(u);
      await loadReports(u);
    };
    init();
  }, []);

  const loadReports = async (u) => {
    const supabase = getSupabaseClient();
    const superAdmin = isSuperAdmin(u?.role);

    let studentQ = supabase.from('students').select(`
      id, pipeline_status, lead_source, created_at, office_id,
      offices(id, name),
      users!assigned_to(id, full_name),
      destinations(id, country_name, flag_emoji)
    `);
    if (!superAdmin) studentQ = studentQ.eq('office_id', u.office_id);
    const { data: students } = await studentQ;

    if (!students) { setLoading(false); return; }

    // Conversion funnel
    const stageCounts = {};
    PIPELINE_STAGES.forEach(s => { stageCounts[s.key] = 0; });
    students.forEach(s => {
      if (stageCounts[s.pipeline_status] !== undefined) stageCounts[s.pipeline_status]++;
      else stageCounts['new_lead']++;
    });

    // Cumulative funnel (everyone who reached stage or beyond)
    let running = students.length;
    const funnel = PIPELINE_STAGES.map(s => {
      const count = stageCounts[s.key];
      return { name: s.label, count, color: s.color };
    });
    setConversionData(funnel);

    // Monthly trend (12 months)
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        y: d.getFullYear(), m: d.getMonth(),
        count: 0, enrolled: 0
      });
    }
    students.forEach(s => {
      const d = new Date(s.created_at);
      const entry = months.find(mo => mo.y === d.getFullYear() && mo.m === d.getMonth());
      if (entry) {
        entry.count++;
        if (s.pipeline_status === 'enrolled') entry.enrolled++;
      }
    });
    setMonthlyData(months.map(m => ({ name: m.name, 'Leads': m.count, 'Enrolled': m.enrolled })));

    // Lead sources
    const srcMap = {};
    students.forEach(s => {
      const src = s.lead_source || 'Other';
      srcMap[src] = (srcMap[src] || 0) + 1;
    });
    setSourceData(Object.entries(srcMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));

    // Top counselors
    const counselMap = {};
    students.forEach(s => {
      if (s.users) {
        const key = s.users.full_name;
        if (!counselMap[key]) counselMap[key] = { name: key, total: 0, enrolled: 0 };
        counselMap[key].total++;
        if (s.pipeline_status === 'enrolled') counselMap[key].enrolled++;
      }
    });
    setCounselorData(Object.values(counselMap).sort((a, b) => b.total - a.total).slice(0, 10));

    // Destination popularity
    const destMap = {};
    students.forEach(s => {
      if (s.destinations) {
        const key = `${s.destinations.flag_emoji} ${s.destinations.country_name}`;
        destMap[key] = (destMap[key] || 0) + 1;
      }
    });
    setDestData(Object.entries(destMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));

    // Office comparison (super admin)
    if (superAdmin) {
      const offMap = {};
      students.forEach(s => {
        if (s.offices) {
          const key = s.offices.name;
          if (!offMap[key]) offMap[key] = { name: key, students: 0, enrolled: 0 };
          offMap[key].students++;
          if (s.pipeline_status === 'enrolled') offMap[key].enrolled++;
        }
      });
      setOfficeRevData(Object.values(offMap));
    }

    // Summary stats
    const total = students.length;
    const enrolled = students.filter(s => s.pipeline_status === 'enrolled').length;
    const visaApproved = students.filter(s => ['visa_approved', 'enrolled'].includes(s.pipeline_status)).length;
    const convRate = total > 0 ? ((enrolled / total) * 100).toFixed(1) : 0;
    setStats({ total, enrolled, visaApproved, convRate });

    setLoading(false);
  };

  const TABS = isSuperAdmin(user?.role)
    ? ['Conversion Funnel', 'Monthly Trend', 'Lead Sources', 'Counselors', 'Destinations', 'Office Comparison']
    : ['Conversion Funnel', 'Monthly Trend', 'Lead Sources', 'Counselors', 'Destinations'];

  const SOURCE_COLORS = ['#C9A227', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '16px' }}>
      <div className="loading-spinner" style={{ width: '32px', height: '32px' }} />
      <p className="text-muted">Loading reports...</p>
    </div>
  );

  return (
    <div>
      <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Performance insights across your operations</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-grid mb-24">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div className="kpi-value">{stats?.total || 0}</div>
          <div className="kpi-label">Total Students</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(201,162,39,0.15)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0C040" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="kpi-value">{stats?.enrolled || 0}</div>
          <div className="kpi-label">Enrolled</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="kpi-value">{stats?.visaApproved || 0}</div>
          <div className="kpi-label">Visa Approved</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div className="kpi-value">{stats?.convRate || 0}%</div>
          <div className="kpi-label">Conversion Rate</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((tab, i) => (
          <button key={tab} className={`tab-btn ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Charts */}
      {activeTab === 0 && (
        <div className="card">
          <h3 className="section-title mb-24">Pipeline Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={conversionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="#6B7280" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={12} width={120} />
              <Tooltip contentStyle={{ background: '#16213E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#E8E8E8' }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {conversionData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 1 && (
        <div className="card">
          <h3 className="section-title mb-24">Monthly Leads & Enrollments (12 months)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip contentStyle={{ background: '#16213E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#E8E8E8' }} />
              <Legend />
              <Line type="monotone" dataKey="Leads" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Enrolled" stroke="#C9A227" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="card">
            <h3 className="section-title mb-24">Lead Sources Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" outerRadius={110} dataKey="value" labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {sourceData.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#16213E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#E8E8E8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="section-title mb-16">By Count</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Source</th><th>Students</th><th>%</th></tr></thead>
                <tbody>
                  {sourceData.map((s, i) => (
                    <tr key={s.name}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: SOURCE_COLORS[i % SOURCE_COLORS.length], display: 'inline-block' }} />
                        {s.name}
                      </td>
                      <td className="font-semibold">{s.value}</td>
                      <td className="text-muted">{((s.value / stats?.total) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="card">
          <h3 className="section-title mb-24">Top Counselors Performance</h3>
          {counselorData.length === 0 ? (
            <div className="empty-state"><p>No counselor data yet</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={counselorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip contentStyle={{ background: '#16213E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#E8E8E8' }} />
                <Legend />
                <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Total Students" />
                <Bar dataKey="enrolled" fill="#C9A227" radius={[4, 4, 0, 0]} name="Enrolled" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {activeTab === 4 && (
        <div className="card">
          <h3 className="section-title mb-24">Destination Popularity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={destData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip contentStyle={{ background: '#16213E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#E8E8E8' }} />
              <Bar dataKey="value" fill="#C9A227" radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 5 && isSuperAdmin(user?.role) && (
        <div className="card">
          <h3 className="section-title mb-24">Office Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={officeRevData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="name" stroke="#6B7280" fontSize={11}/>
              <YAxis stroke="#6B7280" fontSize={12}/>
              <Tooltip contentStyle={{ background: '#16213E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#E8E8E8' }}/>
              <Legend/>
              <Bar dataKey="students" fill="#3B82F6" name="Total Students" radius={[4,4,0,0]}/>
              <Bar dataKey="enrolled" fill="#C9A227" name="Enrolled" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
