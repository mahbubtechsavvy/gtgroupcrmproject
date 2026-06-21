'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { useUser } from '@/components/layout/AppLayout';
import { ExecutiveHero, ExecutiveSection, MetricGrid } from '@/components/crm/ExecutivePage';
import { isSuperAdmin, can } from '@/lib/permissions';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import StudentForm from '@/components/students/StudentForm';
import FlagIcon from '@/components/ui/FlagIcon';
import styles from './students.module.css';

const PIPELINE_STATUS_LABELS = {
  new_lead: { label: 'New Lead', color: 'badge-muted' },
  initial_consultation: { label: 'Consultation', color: 'badge-info' },
  documents_collecting: { label: 'Docs Collecting', color: 'badge-warning' },
  application_submitted: { label: 'Applied', color: 'badge-purple' },
  offer_received: { label: 'Offer Received', color: 'badge-info' },
  visa_applied: { label: 'Visa Applied', color: 'badge-warning' },
  visa_approved: { label: 'Visa Approved', color: 'badge-success' },
  enrolled: { label: 'Enrolled', color: 'badge-gold' },
  rejected: { label: 'Rejected', color: 'badge-danger' },
  deferred: { label: 'Deferred', color: 'badge-muted' },
};

const PRIORITY_COLORS = {
  high: 'badge-danger',
  medium: 'badge-warning',
  low: 'badge-muted',
};

export default function StudentsPage() {
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOffice, setFilterOffice] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDestination, setFilterDestination] = useState('');
  const [filterCounselor, setFilterCounselor] = useState('');
  const [offices, setOffices] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [allOfficeStudents, setAllOfficeStudents] = useState([]);
  const PER_PAGE = 20;

  const superAdmin = isSuperAdmin(user?.role);
  const canCreate = can(user, 'students', 'create');
  const canEdit = can(user, 'students', 'edit');
  const canDelete = can(user, 'students', 'delete');

  // Office summary for super admin
  const officeSummaries = useMemo(() => {
    if (!superAdmin || !allOfficeStudents.length || !offices.length) return [];
    return offices.map(office => {
      const officeStudents = allOfficeStudents.filter(s => s.office_id === office.id);
      return {
        id: office.id,
        name: office.name,
        country: office.country,
        count: officeStudents.length,
        active: officeStudents.filter(s => !['enrolled', 'rejected', 'deferred'].includes(s.pipeline_status)).length,
        enrolled: officeStudents.filter(s => s.pipeline_status === 'enrolled').length,
        visaApproved: officeStudents.filter(s => s.pipeline_status === 'visa_approved').length,
      };
    });
  }, [superAdmin, allOfficeStudents, offices]);

  const loadOffices = async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('offices').select('id, name, country').order('name');
    setOffices(data || []);
  };

  const loadFilterOptions = async () => {
    const supabase = getSupabaseClient();
    const [{ data: dest }, { data: staff }] = await Promise.all([
      supabase.from('destinations').select('id, country_name, flag_emoji').eq('is_active', true).order('country_name'),
      supabase.from('users').select('id, full_name, role, office_id').eq('is_active', true).order('full_name'),
    ]);
    setDestinations(dest || []);
    setCounselors((staff || []).filter((member) => ['counselor', 'senior_counselor', 'office_manager', 'ceo', 'coo', 'it_manager'].includes(member.role)));
  };

  const loadStudents = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    let query = supabase
      .from('students')
      .select(`
        *,
        offices(id, name),
        users!assigned_to(id, full_name),
        destinations(id, country_name, flag_emoji),
        documents(id, file_url, document_type)
      `, { count: 'exact' });

    if (!superAdmin) {
      query = query.eq('office_id', user.office_id);
    }

    if (filterStatus) query = query.eq('pipeline_status', filterStatus);
    if (filterOffice) query = query.eq('office_id', filterOffice);
    if (filterSource) query = query.eq('lead_source', filterSource);
    if (filterPriority) query = query.eq('priority', filterPriority);
    if (filterDestination) query = query.eq('target_destination_id', filterDestination);
    if (filterCounselor) query = query.eq('assigned_to', filterCounselor);

    if (search && search.length > 1) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

    const { data, count, error } = await query;

    setStudents(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [user, page, filterStatus, filterOffice, filterSource, filterPriority, filterDestination, filterCounselor, search, superAdmin]);

  const loadOverview = useCallback(async () => {
    if (!user) return;
    const supabase = getSupabaseClient();
    let query = supabase.from('students').select('id, office_id, pipeline_status, offices(id, name, country)');
    if (!superAdmin) query = query.eq('office_id', user.office_id);
    const { data } = await query;
    setAllOfficeStudents(data || []);
  }, [user, superAdmin]);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && superAdmin) loadOffices();
  }, [user, superAdmin]);

  useEffect(() => {
    if (user) loadFilterOptions();
  }, [user]);

  useEffect(() => {
    if (user) loadStudents();
  }, [user, loadStudents]);

  useEffect(() => {
    if (user) loadOverview();
  }, [user, loadOverview]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (user) { setPage(1); loadStudents(); }
    }, 400);
    return () => clearTimeout(t);
  }, [search, loadStudents, user]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this student? This cannot be undone.')) return;
    const supabase = getSupabaseClient();
    await supabase.from('students').delete().eq('id', id);
    loadStudents();
  };

  const timeAgo = (d) => {
    const diff = Date.now() - new Date(d);
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const handleExportCSV = async () => {
    if (students.length === 0) return alert("No students to export.");

    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Students Database');

      sheet.mergeCells('A1', 'O1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'GT Group Bangladesh Student Data';
      titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2E59' } };
      titleCell.alignment = { horizontal: 'center' };

      const headerRow = sheet.getRow(2);
      headerRow.values = [
        'Given Name', 'Surname', 'Email', 'Phone', 'WhatsApp', 'Father Mobile', 'Mother Mobile',
        'Status', 'Priority', 'Source', 'Nationality', 'Passport Number', 'Office', 'Counselor', 'Target Destination'
      ];
      headerRow.font = { bold: true };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6B325' } };

      students.forEach(s => {
        sheet.addRow([
          s.first_name || '',
          s.last_name || '',
          s.email || '',
          s.phone ? ` ${s.phone}` : '',
          s.whatsapp ? ` ${s.whatsapp}` : '',
          s.father_mobile ? ` ${s.father_mobile}` : '',
          s.mother_mobile ? ` ${s.mother_mobile}` : '',
          PIPELINE_STATUS_LABELS[s.pipeline_status]?.label || s.pipeline_status || '',
          s.priority || '',
          s.lead_source || '',
          s.nationality || '',
          s.passport_number || '',
          s.offices?.name || '—',
          s.users?.full_name || '—',
          s.destinations?.country_name || '—'
        ]);
      });

      sheet.columns.forEach(col => col.width = 18);

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Students_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (e) {
      alert("Error generating Excel file: " + e.message);
    }
  };

  const totalPages = Math.ceil(total / PER_PAGE);
  const overviewMetrics = useMemo(() => {
    const source = allOfficeStudents;
    return [
      { label: 'Total Leads', value: source.length },
      { label: 'Consultation', value: source.filter((student) => student.pipeline_status === 'initial_consultation').length },
      { label: 'Docs Collecting', value: source.filter((student) => student.pipeline_status === 'documents_collecting').length },
      { label: 'Applied', value: source.filter((student) => student.pipeline_status === 'application_submitted').length },
      { label: 'Visa Queue', value: source.filter((student) => student.pipeline_status === 'visa_applied').length },
      { label: 'Enrolled', value: source.filter((student) => student.pipeline_status === 'enrolled').length },
    ];
  }, [allOfficeStudents]);

  const officeSummary = useMemo(() => {
    const buckets = new Map();
    allOfficeStudents.forEach((student) => {
      const officeId = student.office_id || 'unknown';
      const existing = buckets.get(officeId) || {
        id: officeId,
        name: student.offices?.name || 'Unknown Office',
        leads: 0,
        active: 0,
        enrolled: 0,
      };
      existing.leads += 1;
      if (!['enrolled', 'rejected', 'deferred'].includes(student.pipeline_status)) existing.active += 1;
      if (student.pipeline_status === 'enrolled') existing.enrolled += 1;
      buckets.set(officeId, existing);
    });
    return Array.from(buckets.values()).sort((a, b) => b.leads - a.leads);
  }, [allOfficeStudents]);

  return (
    <div>
      <ExecutiveHero
        eyebrow="Student Operations"
        title="Prospective Students"
        subtitle="Premium lead tracking with office summaries, fast scanning, and direct access to every student profile."
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>Export</button>
            {canCreate && (
              <button className="btn btn-primary" id="add-student-btn" onClick={() => { setEditStudent(null); setShowForm(true); }}>
                Add Student
              </button>
            )}
          </>
        }
      />

      <ExecutiveSection title="Network Summary" subtitle="All office status totals for super admin and filtered operational totals for office users.">
        <MetricGrid items={overviewMetrics} />
      </ExecutiveSection>

      {superAdmin && officeSummaries.length > 0 && (
        <ExecutiveSection title="Office Summary" subtitle="Quick totals by office for enrolled and visa-approved students.">
          <div className="office-summary-grid">
            {officeSummaries.map((office) => (
              <div key={office.id} className="office-summary-card">
                <div className="office-summary-card__title">
                  <FlagIcon countryName={office.country || office.name} size="sm" />
                  <span>{office.name}</span>
                </div>
                <div className="office-summary-card__metrics">
                  <div className="mini-stat"><strong>{office.count}</strong><span>Students</span></div>
                  <div className="mini-stat"><strong>{office.active}</strong><span>Active</span></div>
                  <div className="mini-stat"><strong>{office.visaApproved}</strong><span>Visa OK</span></div>
                </div>
              </div>
            ))}
          </div>
        </ExecutiveSection>
      )}

      {officeSummary.length > 0 && (
        <ExecutiveSection title="Office Breakdown" subtitle="Easy premium tracking of office pipeline strength and conversion output.">
          <div className="summary-stack">
            {officeSummary.map((office) => (
              <div key={office.id} className="summary-row">
                <strong>{office.name}</strong>
                <div className="flex gap-4 text-sm">
                  <span>Leads <strong>{office.leads}</strong></span>
                  <span>Active <strong>{office.active}</strong></span>
                  <span>Enrolled <strong>{office.enrolled}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </ExecutiveSection>
      )}

      {/* Search & Filters */}
      <div className="filter-grid">
        <div className="search-input-wrapper">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="form-input"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="students-search-input"
          />
        </div>

        <select
          className="form-select"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          id="filter-status"
        >
          <option value="">All Statuses</option>
          {Object.entries(PIPELINE_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {superAdmin && offices.length > 0 && (
          <select
            className="form-select"
            value={filterOffice}
            onChange={(e) => { setFilterOffice(e.target.value); setPage(1); }}
            id="filter-office"
          >
            <option value="">All Offices</option>
            {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}

        <select
          className="form-select"
          value={filterSource}
          onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
          id="filter-source"
        >
          <option value="">All Sources</option>
          {['Facebook','Instagram','Referral','Walk-in','Website','WhatsApp','LinkedIn','Other'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="form-select"
          value={filterPriority}
          onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          className="form-select"
          value={filterDestination}
          onChange={(e) => { setFilterDestination(e.target.value); setPage(1); }}
        >
          <option value="">All Destinations</option>
          {destinations.map((destination) => (
            <option key={destination.id} value={destination.id}>{destination.country_name}</option>
          ))}
        </select>

        <select
          className="form-select"
          value={filterCounselor}
          onChange={(e) => { setFilterCounselor(e.target.value); setPage(1); }}
        >
          <option value="">All Counselors</option>
          {counselors.map((counselor) => (
            <option key={counselor.id} value={counselor.id}>{counselor.full_name}</option>
          ))}
        </select>

        {(filterStatus || filterOffice || filterSource || filterPriority || filterDestination || filterCounselor || search) && (
          <button className="btn btn-ghost btn-sm" onClick={() => {
            setFilterStatus('');
            setFilterOffice('');
            setFilterSource('');
            setFilterPriority('');
            setFilterDestination('');
            setFilterCounselor('');
            setSearch('');
            setPage(1);
          }}>
            Clear filters
          </button>
        )}
      </div>

      <ExecutiveSection title="Student Directory" subtitle="Compact scan view with direct actions, status filters, and office routing.">
      <div className={styles.gridWrapper}>
        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" />
            <p>Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <h3>No students found</h3>
            <p>Add your first student to get started</p>
            {canCreate && (
              <button className="btn btn-primary mt-16" onClick={() => setShowForm(true)}>
                Add Student
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Destination</th>
                  <th>Counselor</th>
                  <th>Office</th>
                  <th>Age</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const status = PIPELINE_STATUS_LABELS[student.pipeline_status];
                  const pColor = PRIORITY_COLORS[student.priority] || 'badge-muted';
                  return (
                    <tr key={student.id} onClick={() => router.push(`/students/${student.id}`)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            {student.documents?.find((d) => d.document_type === 'Student Photo') ? (
                              <img src={student.documents.find((d) => d.document_type === 'Student Photo').file_url} alt="Profile" />
                            ) : (
                              `${student.first_name?.charAt(0) || ''}${student.last_name?.charAt(0) || ''}`
                            )}
                          </div>
                          <div>
                            <strong>{student.last_name} {student.first_name}</strong>
                            <div className="text-xs text-muted">{student.email || student.phone || 'No contact'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <span className={`badge ${status?.color || 'badge-muted'}`}>{status?.label || student.pipeline_status}</span>
                          <span className={`badge ${pColor}`}>{student.priority || 'normal'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {student.destinations ? <FlagIcon destination={student.destinations} size="sm" /> : '—'}
                          <span>{student.destinations?.country_name || '—'}</span>
                        </div>
                      </td>
                      <td>{student.users?.full_name || 'Unassigned'}</td>
                      <td>{student.offices?.name || '—'}</td>
                      <td>{timeAgo(student.created_at)}</td>
                      <td>
                        <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
                          {canEdit && <button className="btn btn-secondary btn-sm" onClick={() => { setEditStudent(student); setShowForm(true); }}>Edit</button>}
                          {canDelete && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(student.id)}>Delete</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </ExecutiveSection>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            ← Previous
          </button>
          <span className="text-sm text-muted">
            Page {page} of {totalPages} ({total} records)
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <StudentForm
          student={editStudent}
          user={user}
          onClose={() => { setShowForm(false); setEditStudent(null); }}
          onSaved={() => { setShowForm(false); setEditStudent(null); loadStudents(); }}
        />
      )}
    </div>
  );
}
