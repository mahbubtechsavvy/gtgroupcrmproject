const fs = require('fs');
const file = 'src/app/dashboard/page.jsx';
const content = fs.readFileSync(file, 'utf8').split('\n');

// Find the return statement around line 607
const returnIndex = content.findIndex((line, i) => i > 500 && line.trim() === 'return (');
const topHalf = content.slice(0, returnIndex).join('\n');

const newReturn = \  return (
    <div className={styles.dashboard} style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* -- PREMIUM HEADER -- */}
      <div className={styles.pageHeader} style={{ marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-heading, Outfit)', background: 'linear-gradient(90deg, var(--gold-light), var(--gold-dark))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px', marginBottom: '8px' }}>
            {superAdmin ? 'Executive Command Center' : \\ Overview\}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: '500' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — Global Operations Live
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Internal Comms Quick Action */}
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontWeight: '600', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.3s' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }}></span>
            Global Comms
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/students?action=add')} style={{ padding: '10px 24px', fontSize: '1rem', fontWeight: '700', boxShadow: 'var(--shadow-gold)' }}>
            + New Lead
          </button>
        </div>
      </div>

      {/* -- GLOBAL KPIS (GLASS CARDS) -- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {[
          { label: 'Global Revenue (YTD)', value: '.24M', trend: '+14%', color: 'var(--success)' },
          { label: 'Active Pipeline Value', value: '', trend: '+5%', color: 'var(--gold)' },
          { label: 'Total Active Leads', value: stats?.total || 0, trend: 'Live', color: 'var(--info)' },
          { label: 'Visas / Contracts Won', value: stats?.visaApproved || 0, trend: 'Verified', color: 'var(--purple)' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: \adial-gradient(circle, \22 0%, transparent 70%)\, transform: 'translate(30%, -30%)' }}></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>{kpi.label}</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text)', margin: 0, lineHeight: 1 }}>{kpi.value}</h2>
              <span style={{ color: kpi.color, fontWeight: '700', fontSize: '0.9rem', paddingBottom: '4px' }}>{kpi.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* -- SEPARATED COMPANY METRICS -- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
        
        {/* NEXUS DIGITAL COLUMN */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'rgba(59, 130, 246, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--info)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '20px', background: 'var(--info)', borderRadius: '2px' }}></div>
              GT Group Nexus Digital
            </h3>
            <span style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>B2B Enterprise</span>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Active Dev Projects</p>
                <h4 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text)' }}>12</h4>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Proposals Sent</p>
                <h4 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text)' }}>5</h4>
              </div>
            </div>
            {/* Minimalist Chart Placeholder */}
            <div style={{ height: '180px', width: '100%', background: 'linear-gradient(to top, rgba(59, 130, 246, 0.1), transparent)', borderBottom: '2px solid var(--info)', position: 'relative', borderRadius: '8px' }}>
               <div style={{ position: 'absolute', bottom: '10px', left: '10px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>AI & Software Revenue Trend</div>
            </div>
          </div>
        </div>

        {/* STUDY ABROAD COLUMN */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'rgba(239, 183, 72, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '20px', background: 'var(--gold)', borderRadius: '2px' }}></div>
              Study Abroad Consultancy
            </h3>
            <span style={{ fontSize: '0.8rem', background: 'rgba(239, 183, 72, 0.1)', color: 'var(--gold)', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>B2C Education</span>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>New Applications</p>
                <h4 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text)' }}>{stats?.activeLeads || 0}</h4>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Visas Processing</p>
                <h4 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text)' }}>28</h4>
              </div>
            </div>
            <div style={{ height: '180px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--surface-3)', border: 'none', borderRadius: '8px', color: 'var(--text)' }} />
                  <Bar dataKey="Revenue" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* -- UNIFIED TASKS & RECENT ACTIVITY -- */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        
        {/* Unified Task Board (Kanban Prelude) */}
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: '24px', boxShadow: 'var(--glass-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text)' }}>Unified Task Center</h3>
            <button style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer' }}>View Kanban Board ?</button>
          </div>
          <DailySchedule 
            tasks={tasks.filter(t => t.staff_id === user.id && t.task_period !== 'event')} 
            onToggleTask={(id) => {
              const t = tasks.find(task => task.id === id);
              if (t) handleToggleTask(id, t.is_completed);
            }}
          />
        </div>

        {/* Global Communications / Activity Feed */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text)', marginBottom: '24px' }}>Global Comms Feed</h3>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentActivity.slice(0, 6).map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontWeight: '700', flexShrink: 0 }}>
                  {item.users?.full_name?.charAt(0)}
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--text)' }}>
                    <strong style={{ color: 'var(--gold)' }}>{item.users?.full_name}</strong> {item.content}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '40px' }}>No recent activity today.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
\;

fs.writeFileSync(file, topHalf + '\n' + newReturn);
console.log('Successfully replaced dashboard return statement.');
