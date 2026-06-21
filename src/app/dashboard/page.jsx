'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useNetworkOffices, useUser } from '@/components/layout/AppLayout';
import { ExecutiveHero, ExecutiveSection, MetricGrid } from '@/components/crm/ExecutivePage';
import FlagIcon from '@/components/ui/FlagIcon';
import { isSuperAdmin } from '@/lib/permissions';
import { applyCurrencyRatesToOffices, summarizeOfficeRevenue, formatOfficeLocalTime } from '@/lib/officeMetadata';
import { getSupabaseClient } from '@/lib/supabase';

const STATUS_BUCKETS = [
  ['new_lead', 'New Leads'],
  ['initial_consultation', 'Consultations'],
  ['documents_collecting', 'Docs Pending'],
  ['application_submitted', 'Applied'],
  ['visa_applied', 'Visa Queue'],
  ['visa_approved', 'Approved'],
  ['enrolled', 'Enrolled'],
];

export default function DashboardPage() {
  const user = useUser();
  const offices = useNetworkOffices();
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState({
    studentTotals: {},
    officeRows: [],
    revenueRows: [],
    appointments: [],
    tasks: [],
    activity: [],
  });

  const superAdmin = isSuperAdmin(user?.role);

  const loadSnapshot = useCallback(async () => {
    if (!user) return;
    const supabase = getSupabaseClient();
    setLoading(true);

    let studentQuery = supabase
      .from('students')
      .select('id, office_id, pipeline_status, created_at, assigned_to, offices(id, name, country)');
    let paymentQuery = supabase.from('payments').select('id, office_id, amount, currency, payment_date');
    let appointmentQuery = supabase
      .from('appointments')
      .select('id, office_id, status, scheduled_at, students(first_name, last_name), users!counselor_id(full_name)')
      .order('scheduled_at', { ascending: true })
      .limit(8);
    let taskQuery = supabase
      .from('staff_tasks')
      .select('id, task_content, is_completed, due_date, task_period, users!staff_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(8);

    if (!superAdmin) {
      studentQuery = studentQuery.eq('office_id', user.office_id);
      paymentQuery = paymentQuery.eq('office_id', user.office_id);
      appointmentQuery = appointmentQuery.eq('office_id', user.office_id);
      taskQuery = taskQuery.eq('staff_id', user.id);
    }

    const [studentsRes, paymentsRes, appointmentsRes, tasksRes, interactionsRes] = await Promise.all([
      studentQuery,
      paymentQuery,
      appointmentQuery,
      taskQuery,
      supabase
        .from('interactions')
        .select('id, type, content, created_at, students(first_name, last_name), users!staff_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    const students = studentsRes.data || [];
    const payments = paymentsRes.data || [];
    const { data: rates } = await supabase
      .from('currency_rates')
      .select('source_currency, usd_rate, krw_rate, rate_date')
      .order('rate_date', { ascending: false });
    const officeSource = applyCurrencyRatesToOffices(
      superAdmin ? offices : offices.filter((office) => office.id === user.office_id),
      rates || []
    );

    const totals = STATUS_BUCKETS.reduce((acc, [key, label]) => {
      acc[label] = students.filter((student) => student.pipeline_status === key).length;
      return acc;
    }, {});

    const officeRows = officeSource.map((office) => {
      const officeStudents = students.filter((student) => student.office_id === office.id);
      return {
        id: office.id,
        name: office.name,
        country: office.country,
        localTime: formatOfficeLocalTime(office),
        leads: officeStudents.length,
        active: officeStudents.filter((student) => !['enrolled', 'rejected', 'deferred'].includes(student.pipeline_status)).length,
        enrolled: officeStudents.filter((student) => student.pipeline_status === 'enrolled').length,
        approvals: officeStudents.filter((student) => ['visa_approved', 'enrolled'].includes(student.pipeline_status)).length,
      };
    });

    setSnapshot({
      studentTotals: {
        total: students.length,
        active: students.filter((student) => !['enrolled', 'rejected', 'deferred'].includes(student.pipeline_status)).length,
        approved: students.filter((student) => ['visa_approved', 'enrolled'].includes(student.pipeline_status)).length,
        enrolled: students.filter((student) => student.pipeline_status === 'enrolled').length,
        ...totals,
      },
      officeRows,
      revenueRows: summarizeOfficeRevenue(officeSource, payments).sort((a, b) => b.usdTotal - a.usdTotal),
      appointments: appointmentsRes.data || [],
      tasks: tasksRes.data || [],
      activity: interactionsRes.data || [],
    });

    setLoading(false);
  }, [user, superAdmin, offices]);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  if (!user || loading) {
    return <div className="empty-state"><div className="loading-spinner" /><p>Loading GT Overview...</p></div>;
  }

  const metrics = [
    { label: 'Total Students', value: snapshot.studentTotals.total || 0 },
    { label: 'Active Pipeline', value: snapshot.studentTotals.active || 0 },
    { label: 'Visa Approved', value: snapshot.studentTotals.approved || 0 },
    { label: 'Enrolled', value: snapshot.studentTotals.enrolled || 0 },
    { label: 'Consultations', value: snapshot.studentTotals.Consultations || 0 },
    { label: 'Docs Pending', value: snapshot.studentTotals['Docs Pending'] || 0 },
  ];

  return (
    <div>
      <ExecutiveHero
        eyebrow="GT Executive Command"
        title="GT Overview"
        subtitle="Cross-office revenue, student progress, consultation load, and operational alerts in one executive surface."
        actions={
          <>
            <Link href="/students" className="btn btn-secondary">Prospective Students</Link>
            <Link href="/pipeline" className="btn btn-secondary">Pipeline</Link>
            <Link href="/appointments" className="btn btn-primary">Consultations</Link>
          </>
        }
      >
        <div className="office-chip-list mt-4">
          {snapshot.officeRows.slice(0, 4).map((office) => (
            <span key={office.id} className="office-chip">
              <FlagIcon countryName={office.country} size="sm" />
              <strong>{office.name}</strong>
              {office.localTime}
            </span>
          ))}
        </div>
      </ExecutiveHero>

      <ExecutiveSection title="Network Pulse" subtitle="Student and consultation health across your offices.">
        <MetricGrid items={metrics} />
      </ExecutiveSection>

      <div className="data-grid-2">
        <ExecutiveSection title="Office Revenue Intelligence" subtitle="Local totals with USD and KRW normalization for headquarters.">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Office</th>
                  <th>Local Revenue</th>
                  <th>USD</th>
                  <th>KRW</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.revenueRows.map((row) => (
                  <tr key={row.officeId}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FlagIcon countryName={row.country} size="sm" />
                        <span>{row.officeName}</span>
                      </div>
                    </td>
                    <td>{row.currency} {row.localTotal.toLocaleString()}</td>
                    <td>${row.usdTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td>KRW {row.krwTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ExecutiveSection>

        <ExecutiveSection title="Office Performance Summary" subtitle="Quick comparison of pipeline strength and final outcomes.">
          <div className="summary-stack">
            {snapshot.officeRows.map((office) => (
              <div key={office.id} className="summary-row">
                <div className="flex items-center gap-2">
                  <FlagIcon countryName={office.country} size="sm" />
                  <div>
                    <strong>{office.name}</strong>
                    <div className="text-xs text-muted">{office.localTime}</div>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <span>Leads <strong>{office.leads}</strong></span>
                  <span>Active <strong>{office.active}</strong></span>
                  <span>Approved <strong>{office.approvals}</strong></span>
                  <span>Enrolled <strong>{office.enrolled}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </ExecutiveSection>
      </div>

      <div className="data-grid-2">
        <ExecutiveSection title="Consultation Radar" subtitle="Upcoming meetings with student context and counselor ownership.">
          <div className="summary-stack">
            {snapshot.appointments.length === 0 ? (
              <div className="empty-state"><p>No scheduled consultations found.</p></div>
            ) : snapshot.appointments.map((appointment) => (
              <div key={appointment.id} className="summary-row">
                <div>
                  <strong>{appointment.students?.first_name} {appointment.students?.last_name}</strong>
                  <div className="text-xs text-muted">{appointment.users?.full_name || 'Unassigned counselor'}</div>
                </div>
                <div className="text-sm">
                  {new Date(appointment.scheduled_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </ExecutiveSection>

        <ExecutiveSection title="Recent Activity" subtitle="Latest notes, status changes, and operational interactions.">
          <div className="summary-stack">
            {snapshot.activity.map((item) => (
              <div key={item.id} className="summary-row">
                <div>
                  <strong>{item.users?.full_name || 'System'}</strong>
                  <div className="text-xs text-muted">{item.students?.first_name} {item.students?.last_name}</div>
                </div>
                <div className="text-sm text-muted">{item.content}</div>
              </div>
            ))}
          </div>
        </ExecutiveSection>
      </div>

      <ExecutiveSection title="Action Queue" subtitle="The most recent tasks needing execution.">
        <div className="summary-stack">
          {snapshot.tasks.map((task) => (
            <div key={task.id} className="summary-row">
              <div>
                <strong>{task.task_content}</strong>
                <div className="text-xs text-muted">{task.users?.full_name || 'Unassigned'} • {task.task_period || 'task'}</div>
              </div>
              <span className={`badge ${task.is_completed ? 'badge-success' : 'badge-warning'}`}>
                {task.is_completed ? 'Done' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </ExecutiveSection>
    </div>
  );
}
