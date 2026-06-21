import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    // 1. Authorization check
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET || 'daily_report_secret_key';

    if (process.env.NODE_ENV === 'production' && secret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch all active office managers
    const { data: managers, error: managerError } = await supabase
      .from('users')
      .select('id, full_name, email, office_id, offices(name)')
      .eq('role', 'office_manager')
      .eq('is_active', true);

    if (managerError) throw managerError;

    if (!managers || managers.length === 0) {
      return NextResponse.json({ status: 'success', message: 'No active office managers found to email.' });
    }

    const reportResults = [];

    // 3. Generate and send report for each manager's office
    for (const manager of managers) {
      const officeId = manager.office_id;
      if (!officeId) continue;

      const officeName = manager.offices?.name || 'Your Branch';

      // Fetch all employees in this office
      const { data: employees, error: empError } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('office_id', officeId)
        .eq('is_active', true);

      if (empError) continue;
      if (!employees || employees.length === 0) continue;

      // Define today's time bounds
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const employeeStats = [];
      let totalBranchPresentSeconds = 0;
      let totalBranchTrackingSeconds = 0;

      for (const emp of employees) {
        // Fetch logs for this employee today
        const { data: logs, error: logsError } = await supabase
          .from('cctv_tracking_logs')
          .select('*')
          .eq('employee_id', emp.id)
          .gte('logged_at', startOfDay.toISOString())
          .lte('logged_at', endOfDay.toISOString())
          .order('logged_at', { ascending: true });

        if (logsError) continue;

        let presentSeconds = 0;
        let absentSeconds = 0;

        // Sum up durations
        if (logs && logs.length > 0) {
          logs.forEach(log => {
            if (log.status === 'PRESENT') {
              // Duration spent ABSENT immediately prior to returning
              absentSeconds += log.duration_seconds || 0;
            } else {
              // Duration spent PRESENT immediately prior to leaving
              presentSeconds += log.duration_seconds || 0;
            }
          });
        }

        const totalSeconds = presentSeconds + absentSeconds;
        totalBranchPresentSeconds += presentSeconds;
        totalBranchTrackingSeconds += totalSeconds;

        const presentPct = totalSeconds > 0 ? Math.round((presentSeconds / totalSeconds) * 100) : 0;
        const absentPct = totalSeconds > 0 ? 100 - presentPct : 0;

        employeeStats.push({
          name: emp.full_name,
          role: emp.role,
          presentHours: (presentSeconds / 3600).toFixed(1),
          absentHours: (absentSeconds / 3600).toFixed(1),
          presentPct,
          absentPct,
          activeTracking: totalSeconds > 0
        });
      }

      // Calculate branch metrics
      const branchPresenceRate = totalBranchTrackingSeconds > 0
        ? Math.round((totalBranchPresentSeconds / totalBranchTrackingSeconds) * 100)
        : 0;

      // 4. Build a beautiful premium HTML Email Template
      const reportDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #0b0b14;
              color: #f8fafc;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .wrapper {
              background-color: #0b0b14;
              width: 100%;
              padding: 40px 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #111122;
              border: 1px solid rgba(255, 255, 255, 0.05);
              border-radius: 24px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            }
            .header {
              padding: 32px;
              background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
              border-bottom: 1px solid rgba(255, 255, 255, 0.05);
              text-align: center;
            }
            .logo {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #ffd700;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .title {
              font-size: 24px;
              font-weight: 800;
              color: #ffffff;
              margin: 0;
              letter-spacing: -0.5px;
            }
            .subtitle {
              font-size: 14px;
              color: #94a3b8;
              margin-top: 6px;
            }
            .content {
              padding: 32px;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 16px;
              margin-bottom: 32px;
            }
            .metric-card {
              background: rgba(255, 255, 255, 0.02);
              border: 1px solid rgba(255, 255, 255, 0.05);
              border-radius: 16px;
              padding: 20px;
              text-align: center;
            }
            .metric-val {
              font-size: 36px;
              font-weight: 800;
              color: #ffd700;
              line-height: 1;
              margin-bottom: 4px;
            }
            .metric-lbl {
              font-size: 12px;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .section-title {
              font-size: 14px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #ffd700;
              margin-bottom: 16px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.05);
              padding-bottom: 8px;
            }
            .employee-row {
              background: rgba(255, 255, 255, 0.01);
              border: 1px solid rgba(255, 255, 255, 0.03);
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 12px;
            }
            .employee-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .employee-name {
              font-weight: 700;
              font-size: 14px;
              color: #ffffff;
            }
            .employee-role {
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
            }
            .progress-bar-container {
              height: 8px;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 4px;
              overflow: hidden;
              display: flex;
            }
            .progress-present {
              height: 100%;
              background: #22c55e;
            }
            .progress-absent {
              height: 100%;
              background: #ef4444;
            }
            .progress-stats {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #94a3b8;
              margin-top: 6px;
            }
            .stat-green {
              color: #22c55e;
              font-weight: 600;
            }
            .stat-red {
              color: #ef4444;
              font-weight: 600;
            }
            .footer {
              padding: 24px;
              text-align: center;
              background: rgba(0,0,0,0.2);
              border-top: 1px solid rgba(255, 255, 255, 0.05);
              font-size: 11px;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <div class="logo">GT Group CRM</div>
                <div class="title">Workstation Analytics Report</div>
                <div class="subtitle">${officeName} • ${reportDate}</div>
              </div>
              <div class="content">
                <div class="metrics-grid">
                  <div class="metric-card">
                    <div class="metric-val">${branchPresenceRate}%</div>
                    <div class="metric-lbl">Branch Office Presence Rate</div>
                  </div>
                </div>

                <div class="section-title">Staff Presence Breakdown</div>
                
                ${employeeStats.map(emp => `
                  <div class="employee-row">
                    <div class="employee-info">
                      <span class="employee-name">${emp.name}</span>
                      <span class="employee-role">${emp.role}</span>
                    </div>
                    ${emp.activeTracking ? `
                      <div class="progress-bar-container">
                        <div class="progress-present" style="width: ${emp.presentPct}%"></div>
                        <div class="progress-absent" style="width: ${emp.absentPct}%"></div>
                      </div>
                      <div class="progress-stats">
                        <span>Present: <span class="stat-green">${emp.presentHours}h</span> (${emp.presentPct}%)</span>
                        <span>Absent: <span class="stat-red">${emp.absentHours}h</span> (${emp.absentPct}%)</span>
                      </div>
                    ` : `
                      <div style="font-size: 12px; color: #64748b; font-style: italic;">
                        No active tracking logs recorded today.
                      </div>
                    `}
                  </div>
                `).join('')}
              </div>
              <div class="footer">
                Secured Executive CCTV Reporting Service • Confidentially Dispatched
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // 5. Send email via Resend API
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'GT Group Security <security@resend.dev>', // default Resend sender
              to: manager.email,
              subject: `Daily Workstation Presence Report - ${officeName}`,
              html: emailHtml
            })
          });

          if (res.ok) {
            reportResults.push({ manager: manager.full_name, email: manager.email, status: 'sent' });
          } else {
            const errData = await res.json();
            reportResults.push({ manager: manager.full_name, email: manager.email, status: 'failed', error: errData });
          }
        } catch (mailErr) {
          reportResults.push({ manager: manager.full_name, email: manager.email, status: 'failed', error: mailErr.message });
        }
      } else {
        reportResults.push({ manager: manager.full_name, email: manager.email, status: 'failed', error: 'No Resend API Key configured' });
      }
    }

    return NextResponse.json({ status: 'success', reports: reportResults });
  } catch (error) {
    console.error('Daily cron job report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
