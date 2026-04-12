'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { useUser } from '@/components/layout/AppLayout';
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
  const [offices, setOffices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const superAdmin = isSuperAdmin(user?.role);
  const canCreate = can(user, 'students', 'create');
  const canEdit = can(user, 'students', 'edit');
  const canDelete = can(user, 'students', 'delete');

  const loadOffices = async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('offices').select('id, name').order('name');
    setOffices(data || []);
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
  }, [user, page, filterStatus, filterOffice, filterSource, search, superAdmin]);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && superAdmin) loadOffices();
  }, [user, superAdmin]);

  useEffect(() => {
    if (user) loadStudents();
  }, [user, loadStudents]);

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

  return (
    <div>
      {/* Page Header */}
      <div className="flex-between mb-24">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{total} total students</p>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          {canCreate && (
            <button className="btn btn-primary" id="add-student-btn" onClick={() => { setEditStudent(null); setShowForm(true); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Student
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="search-filter-bar">
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
          style={{ width: 'auto' }}
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
            style={{ width: 'auto' }}
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
          style={{ width: 'auto' }}
          value={filterSource}
          onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
          id="filter-source"
        >
          <option value="">All Sources</option>
          {['Facebook','Instagram','Referral','Walk-in','Website','WhatsApp','LinkedIn','Other'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {(filterStatus || filterOffice || filterSource || search) && (
          <button className="btn btn-ghost btn-sm" onClick={() => {
            setFilterStatus(''); setFilterOffice(''); setFilterSource(''); setSearch(''); setPage(1);
          }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
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
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Contact</th>
                {superAdmin && <th>Office</th>}
                <th>Destination</th>
                <th>Counselor</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Source</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const status = PIPELINE_STATUS_LABELS[student.pipeline_status];
                return (
                  <tr key={student.id} className={styles.studentRow} onClick={() => router.push(`/students/${student.id}`)}>
                    <td>
                      <div className="flex gap-12" style={{ alignItems: 'center' }}>
                        <div className="avatar avatar-sm" style={{ flexShrink: 0, overflow: 'hidden', background: 'var(--color-gold-muted)', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {student.documents?.find(d => d.document_type === 'Student Photo') ? (
                            <img 
                              src={student.documents.find(d => d.document_type === 'Student Photo').file_url} 
                              alt="Profile" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <span>{student.first_name?.charAt(0)}{student.last_name?.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--color-white)' }}>
                            {student.last_name} {student.first_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm">{student.email || '—'}</p>
                        <p className="text-xs text-muted">{student.phone || ''}</p>
                      </div>
                    </td>
                    {superAdmin && <td className="text-sm text-muted">{student.offices?.name || '—'}</td>}
                    <td className="text-sm">
                      {student.destinations ? (
                        <FlagIcon destination={student.destinations} size="md" showName={true} />
                      ) : '—'}
                    </td>
                    <td className="text-sm text-muted">{student.users?.full_name || '—'}</td>
                    <td>
                      {status && (
                        <span className={`badge ${status.color}`}>{status.label}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${PRIORITY_COLORS[student.priority] || 'badge-muted'}`}>
                        {student.priority || '—'}
                      </span>
                    </td>
                    <td className="text-sm text-muted">{student.lead_source || '—'}</td>
                    <td className="text-sm text-muted">{timeAgo(student.created_at)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-4">
                        {canEdit && (
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Edit"
                            onClick={() => { setEditStudent(student); setShowForm(true); }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Delete"
                            onClick={() => handleDelete(student.id)}
                            style={{ color: 'var(--color-danger)' }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

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
