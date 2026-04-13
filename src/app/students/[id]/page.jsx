'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateReceipt } from '@/lib/pdf/generateReceipt';

const TABS = ['Overview', 'Documents', 'Payments', 'Notes & History'];

const PIPELINE_STAGES = [
  { key: 'new_lead', label: 'New Lead' },
  { key: 'initial_consultation', label: 'Consultation' },
  { key: 'documents_collecting', label: 'Documents Collecting' },
  { key: 'application_submitted', label: 'Application Submitted' },
  { key: 'offer_received', label: 'Offer Received' },
  { key: 'visa_applied', label: 'Visa Applied' },
  { key: 'visa_approved', label: 'Visa Approved' },
  { key: 'enrolled', label: 'Enrolled' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'deferred', label: 'Deferred' },
];

export default function StudentProfile({ params }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);

  const loadData = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: u } = await supabase.from('users').select('*, offices!users_office_id_fkey(*)').eq('id', session.user.id).single();
      setUser(u);
    }

    const { data } = await supabase
      .from('students')
      .select(`
        *,
        offices(id, name, country),
        users!assigned_to(id, full_name, email, role),
        destinations(id, country_name, flag_emoji),
        universities(id, name),
        programs(id, name, degree_level),
        documents(*)
      `)
      .eq('id', params.id)
      .single();

    setStudent(data);
    setPhotoUrl(data?.documents?.find(d => d.document_type === 'Student Photo')?.file_url || null);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <div className="loading-spinner" style={{ width: '32px', height: '32px' }} />
        <p className="text-muted">Loading student profile...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="empty-state">
        <h3>Student not found</h3>
        <p>This student may have been deleted or you don&apos;t have access.</p>
      </div>
    );
  }

  const fullName = `${student.last_name} ${student.first_name}`;
  const initials = `${student.first_name?.charAt(0)}${student.last_name?.charAt(0)}`.toUpperCase();

  const handleExportZip = async () => {
    try {
      const zip = new JSZip();
      
      // 1. Data Excel
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Student Data');
      
      sheet.mergeCells('A1', 'J1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'GT Group Bangladesh Student Data';
      titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2E59' } };
      titleCell.alignment = { horizontal: 'center' };
      
      const headerRow = sheet.getRow(2);
      headerRow.values = ['Given Name', 'Surname', 'Passport Number', 'Email', 'Phone', 'WhatsApp', 'Father Mobile', 'Mother Mobile', 'Status', 'Nationality'];
      headerRow.font = { bold: true };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6B325' } }; // Gold
      
      sheet.addRow([
        student.first_name || '',
        student.last_name || '',
        student.passport_number || '',
        student.email || '',
        student.phone ? ` ${student.phone}` : '',
        student.whatsapp ? ` ${student.whatsapp}` : '',
        student.father_mobile ? ` ${student.father_mobile}` : '',
        student.mother_mobile ? ` ${student.mother_mobile}` : '',
        student.pipeline_status || '',
        student.nationality || ''
      ]);

      sheet.columns.forEach(col => col.width = 20);

      const buffer = await workbook.xlsx.writeBuffer();
      zip.file(`${student.last_name}_${student.first_name}_Data.xlsx`, buffer);
      
      // 2. Documents
      if (student.documents?.length > 0) {
        const folder = zip.folder("Documents");
        for (const doc of student.documents) {
          try {
            const res = await fetch(doc.file_url);
            const blob = await res.blob();
            folder.file(doc.file_name, blob);
          } catch(e) { console.error("Could not fetch file for zip", e); }
        }
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${student.last_name}_${student.first_name}_Profile.zip`);
    } catch (e) {
      alert("Error generating zip: " + e.message);
    }
  };

  return (
    <div>
      {/* Profile Header */}
      <div className="card mb-24" style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
        <div className="avatar avatar-lg" style={{ width: '80px', height: '80px', fontSize: '1.8rem', borderRadius: '12px', flexShrink: 0, overflow: 'hidden', background: 'var(--color-gold-muted)', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid var(--color-white-10)' }}>
          {photoUrl ? <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </div>
        <div style={{ flex: 1 }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-white)', marginBottom: '4px' }}>{fullName}</h1>
              <p className="text-muted text-sm">{student.email} {student.phone ? `• ${student.phone}` : ''}</p>
            </div>
            <div className="flex gap-12">
              <StatusChanger student={student} onChanged={() => window.location.reload()} />
              <button className="btn btn-secondary btn-sm" onClick={handleExportZip}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export Zip
              </button>
            </div>
          </div>
          <div className="flex gap-12 mt-16" style={{ flexWrap: 'wrap' }}>
            {student.destinations && (
              <span className="badge badge-info">
                {student.destinations.flag_emoji} {student.destinations.country_name}
              </span>
            )}
            {student.priority && (
              <span className={`badge ${student.priority === 'high' ? 'badge-danger' : student.priority === 'medium' ? 'badge-warning' : 'badge-muted'}`}>
                {student.priority} priority
              </span>
            )}
            {student.lead_source && (
              <span className="badge badge-muted">📥 {student.lead_source}</span>
            )}
            {student.offices && (
              <span className="badge badge-muted">🏢 {student.offices.name}</span>
            )}
            {student.users && (
              <span className="badge badge-muted">👤 {student.users.full_name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 0 && <OverviewTab student={student} />}
      {activeTab === 1 && <DocumentsTab student={student} user={user} onPhotoUpdated={setPhotoUrl} />}
      {activeTab === 2 && <PaymentsTab student={student} user={user} />}
      {activeTab === 3 && <NotesTab studentId={student.id} user={user} />}
    </div>
  );
}

function StatusChanger({ student, onChanged }) {
  const [status, setStatus] = useState(student.pipeline_status);
  const [saving, setSaving] = useState(false);

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    setSaving(true);
    const supabase = getSupabaseClient();

    await supabase.from('students').update({ pipeline_status: newStatus }).eq('id', student.id);

    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('pipeline_history').insert({
      student_id: student.id,
      from_status: status,
      to_status: newStatus,
      changed_by: session?.user?.id,
    });

    await supabase.from('interactions').insert({
      student_id: student.id,
      staff_id: session?.user?.id,
      type: 'status_change',
      content: `Status changed from ${status} to ${newStatus}`,
    });

    setStatus(newStatus);
    setSaving(false);
    onChanged();
  };

  return (
    <select
      className="form-select"
      style={{ width: 'auto', fontSize: '0.85rem' }}
      value={status}
      onChange={handleChange}
      disabled={saving}
    >
      {PIPELINE_STAGES.map(s => (
        <option key={s.key} value={s.key}>{s.label}</option>
      ))}
    </select>
  );
}

function OverviewTab({ student }) {
  const sections = [
    {
      title: 'Personal Information',
      fields: [
        { label: 'Date of Birth', value: student.date_of_birth },
        { label: 'Gender', value: student.gender },
        { label: 'Nationality', value: student.nationality },
        { label: 'Passport Number', value: student.passport_number },
        { label: 'Passport Expiry', value: student.passport_expiry },
      ]
    },
    {
      title: 'Contact Information',
      fields: [
        { label: 'Email', value: student.email },
        { label: 'Phone', value: student.phone },
        { label: 'WhatsApp', value: student.whatsapp },
        { label: 'Father Mobile', value: student.father_mobile },
        { label: 'Mother Mobile', value: student.mother_mobile },
        { label: 'Address', value: student.address },
      ]
    },
    {
      title: 'Academic Background',
      fields: [
        { label: 'Education Level', value: student.education_level },
        { label: 'Institution', value: student.institution_name },
        { label: 'GPA', value: student.gpa },
        { label: 'Graduation Year', value: student.graduation_year },
        { label: 'IELTS Overall', value: student.ielts_overall },
        { label: 'IELTS (L/R/W/S)', value: student.ielts_overall ? `${student.ielts_listening}/${student.ielts_reading}/${student.ielts_writing}/${student.ielts_speaking}` : null },
        { label: 'TOEFL Score', value: student.toefl_score },
        { label: 'TOPIK Score', value: student.topik_score },
        { label: 'Other Test', value: student.other_test ? `${student.other_test}: ${student.other_test_score}` : null },
      ]
    },
    {
      title: 'Study Preferences',
      fields: [
        { label: 'Target Destination', value: student.destinations ? `${student.destinations.flag_emoji} ${student.destinations.country_name}` : null },
        { label: 'Target University', value: student.universities?.name },
        { label: 'Target Program', value: student.programs?.name || student.target_course_name },
        { label: 'Preferred Intake', value: student.preferred_intake },
      ]
    },
  ];

  return (
    <div className="grid-2" style={{ gap: '16px' }}>
      {sections.map(section => (
        <div key={section.title} className="card">
          <h3 className="section-title mb-16">{section.title}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {section.fields.map(field => field.value && (
              <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <span className="text-sm text-muted">{field.label}</span>
                <span className="text-sm" style={{ color: 'var(--color-white)', textAlign: 'right', fontWeight: '500' }}>{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentsTab({ student, user, onPhotoUpdated }) {
  const studentId = student.id;
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('Student Passport');

  const DOC_TYPES = [
    'Student Photo', 'Father Photo', 'Mother Photo', 
    'Student Passport', 'Student Birth Certificate', 'Student NID', 
    'Father NID', 'Father Passport', 'Mother NID', 'Mother Passport', 
    'SSC Certificate', 'SSC Transcript', 'HSC Certificate', 'HSC Transcript', 
    'Language Certificate IELTS', 'Language Certificate TOEFL', 'Language Certificate TOPIK', 
    'Student Signature', 'Mother Signature', 'Father Signature', 
    'Testimonial', 'Police Clearance certificate', 'TB Test', 
    'No Objection Certificate (NOC) from Parents', 'Citizenship certificate', 
    'Family Relationship Certificate', 'Trade License', 'TIN Certificate', 
    'Income Tax Certificate', 'Acknowledgement Receipt (After income Tax Payment)', 
    'Challan Copy (Income Tax Payment Receipt)', 'Medical Form', 'Cover Letter', 
    'Visa Issuance Number', 'Visa Form', 'Admission Form', 'Invoice', 
    'Offer letter', 'Dormitory Form', 'Bank Solvency Certificate', 'Bank Statement', 
    'Tuition Fee Payment Receipt (Swift copy)', 'Air Ticket', 'Annual Income Certificate', 
    'University License', 'Other'
  ];

  const loadDocs = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('documents').select('*, users!uploaded_by(full_name)')
      .eq('student_id', studentId).order('uploaded_at', { ascending: false });
    setDocs(data || []);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File must be under 10MB'); return; }

    setUploading(true);
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    const sanitizedDocType = docType.replace(/ /g, '_');
    const surname = student.last_name || 'Unknown';
    const givenName = student.first_name || 'Unknown';
    const passport = student.passport_number || 'NoPassport';
    const ext = file.name.split('.').pop();
    const cleanFileName = `${sanitizedDocType}-${surname}_${givenName}_${passport}.${ext}`;
    
    const fileName = `${studentId}/${Date.now()}_${cleanFileName}`;
    const { data: uploadData, error } = await supabase.storage
      .from('student-documents')
      .upload(fileName, file);

    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from('student-documents').getPublicUrl(fileName);

    await supabase.from('documents').insert({
      student_id: studentId,
      document_type: docType,
      file_url: publicUrl,
      file_name: cleanFileName,
      file_size: file.size,
      uploaded_by: session?.user?.id,
    });

    await supabase.from('interactions').insert({
      student_id: studentId,
      staff_id: session?.user?.id,
      type: 'document',
      content: `Uploaded document: ${docType} (${cleanFileName})`,
    });
    
    if (docType === 'Student Photo' && onPhotoUpdated) {
      onPhotoUpdated(publicUrl);
    }

    setUploading(false);
    loadDocs();
  };

  const handleDownload = async (url, filename) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      saveAs(blob, filename);
    } catch (e) {
      alert("Download failed.");
    }
  };

  const handleDeleteDoc = async (doc) => {
    if (!confirm(`Are you sure you want to delete ${doc.document_type}?`)) return;
    
    try {
      const supabase = getSupabaseClient();
      
      // 1. Delete from Storage
      const path = doc.file_url.split('/student-documents/').pop();
      if (path) {
        await supabase.storage.from('student-documents').remove([decodeURIComponent(path)]);
      }

      // 2. Delete from Database
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);
      
      if (error) throw error;

      // 3. Clear photo if it was the student photo
      if (doc.document_type === 'Student Photo' && onPhotoUpdated) {
        onPhotoUpdated(null);
      }

      // 4. Log interaction
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from('interactions').insert({
        student_id: studentId,
        staff_id: session?.user?.id,
        type: 'document',
        content: `Deleted document: ${doc.document_type} (${doc.file_name})`,
      });

      loadDocs();
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  return (
    <div>
      {/* Upload */}
      <div className="card mb-24">
        <h3 className="section-title mb-16">Upload Document</h3>
        <div className="flex gap-12" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label className="form-label">Document Type</label>
            <select className="form-select" value={docType} onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <label className={`btn btn-primary ${uploading ? 'disabled' : ''}`} style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
            {uploading ? 'Uploading...' : '+ Upload File'}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Document List */}
      {loading ? <div className="empty-state"><div className="loading-spinner" /></div> : docs.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <h3>No documents uploaded</h3>
          <p>Upload documents to keep track of this student&apos;s files</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {docs.map(doc => (
            <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <div style={{ flex: 1 }}>
                <p className="font-medium text-sm">{doc.document_type}</p>
                <p className="text-xs text-muted">{doc.file_name} · Uploaded by {doc.users?.full_name}</p>
              </div>
              <span className={`badge ${doc.status === 'verified' ? 'badge-success' : doc.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                {doc.status}
              </span>
              <div className="flex gap-8">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" onClick={e => e.stopPropagation()}>
                  View
                </a>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDownload(doc.file_url, doc.file_name)}>
                  Download
                </button>
                <button 
                  className="btn btn-ghost btn-sm text-danger" 
                  onClick={() => handleDeleteDoc(doc)} 
                  title="Delete Document"
                  style={{ color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.1)', background: 'rgba(239, 68, 68, 0.05)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentsTab({ student, user }) {
  const studentId = student.id;
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [promoCodes, setPromoCodes] = useState([]);
  const [appSettings, setAppSettings] = useState({});
  const [offices, setOffices] = useState([]);
  const [form, setForm] = useState({
    semester: 'Spring 2026',
    fee_type: 'Consultation Fee',
    amount: '',
    currency: 'USD',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    status: 'paid',
    transaction_id: '',
    promo_code_id: '',
    discount_value: 0,
    receipt_number: '',
    office_id: user?.office_id || '',
    notes: '',
  });

  const generateReceiptNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(10000000 + Math.random() * 90000000); // 8-digit random
    return `GT-${year}-${random}`;
  };

  const CATEGORIES = ['Consultation Fee', 'Application Processing Fee', 'Visa Application Fee', 'Courier / Documentation Fee', 'University Application Fee', 'Other / Miscellaneous'];
  const CURRENCIES = ['BDT', 'LKR', 'KRW', 'VND', 'USD', 'GBP', 'AUD', 'EUR'];
  const METHODS = ['Cash', 'Bank Transfer', 'Mobile Banking', 'Card', 'Other'];

  const loadPromoCodes = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('promo_codes')
      .select('*')
      .eq('is_active', true)
      .or(`is_global.eq.true,office_id.eq.${user?.office_id}`);
    setPromoCodes(data || []);
  }, [user?.office_id]);

  const loadInitialData = useCallback(async () => {
    const supabase = getSupabaseClient();
    
    // Load Settings
    const { data: s } = await supabase.from('app_settings').select('*');
    const sMap = {};
    s?.forEach(item => { sMap[item.key] = item.value; });
    setAppSettings(sMap);

    // Load All Offices
    const { data: o } = await supabase.from('offices').select('*').order('name');
    setOffices(o || []);
  }, []);

  const loadPayments = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('payments').select('*, users!recorded_by(full_name), offices(*), promo_codes(code)')
      .eq('student_id', studentId).order('created_at', { ascending: false });
    setPayments(data || []);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { 
    loadPayments();
    loadInitialData();
    loadPromoCodes();
  }, [loadPayments, loadInitialData, loadPromoCodes]);

  const handleApplyPromo = (promoId) => {
    const promo = promoCodes.find(p => p.id === promoId);
    if (!promo || !form.amount) {
      setForm({ ...form, promo_code_id: promoId, discount_value: 0 });
      return;
    }

    let discount = 0;
    const baseAmount = parseFloat(form.amount);
    if (promo.discount_type === 'percentage') {
      discount = (baseAmount * promo.discount_amount) / 100;
    } else {
      discount = promo.discount_amount;
    }
    setForm({ ...form, promo_code_id: promoId, discount_value: discount });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const { data: u } = await supabase.from('users').select('office_id').eq('id', session.user.id).single();

    const finalAmount = parseFloat(form.amount) - (form.discount_value || 0);

    const { error } = await supabase.from('payments').insert({
      student_id: studentId,
      ...form,
      amount: finalAmount,
      recorded_by: session.user.id,
    });

    if (error) {
      alert("Error saving payment: " + error.message);
      return;
    }

    await supabase.from('interactions').insert({
      student_id: studentId,
      staff_id: session.user.id,
      type: 'payment',
      content: `Payment recorded: ${form.fee_type} — ${finalAmount} ${form.currency} (Receipt: ${form.receipt_number})`,
    });

    setShowForm(false);
    loadPayments();
  };

  const toggleForm = () => {
    if (!showForm) {
      setForm({ ...form, receipt_number: generateReceiptNumber() });
    }
    setShowForm(!showForm);
  };

  const handleActionPDF = async (payment, mode = 'download') => {
    try {
      await generateReceipt({ student, payment, appSettings, mode });
    } catch (e) {
      alert("Error processing receipt: " + e.message);
    }
  };

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const isPrivileged = isSuperAdmin(user?.role) || user?.role === 'office_manager';

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          {isPrivileged ? (
            <>
              <p className="text-sm text-muted">Total Paid</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-gold-light)' }}>
                {payments.length > 0 ? `${payments[0].currency} ${totalPaid.toLocaleString()}` : '—'}
              </p>
            </>
          ) : (
             <div className="badge badge-muted">Financial Data Restricted</div>
          )}
        </div>
        <button className="btn btn-primary" onClick={toggleForm}>
          {showForm ? 'Cancel' : '+ Record Payment'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-24">
          <h3 className="section-title mb-16">Record Payment</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Fee Type</label>
                <select className="form-select" value={form.fee_type} onChange={e => setForm({...form, fee_type: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Base Amount</label>
                <div className="flex gap-8">
                  <select className="form-select" style={{ width: '100px' }} value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input className="form-input" type="number" step="0.01" required placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} onBlur={() => handleApplyPromo(form.promo_code_id)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <input className="form-input" placeholder="e.g. Spring 2026" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Promo Code</label>
                <select className="form-select" value={form.promo_code_id} onChange={e => handleApplyPromo(e.target.value)}>
                  <option value="">No Discount</option>
                  {promoCodes.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.code} ({p.discount_type === 'percentage' ? `${p.discount_amount}%` : `${p.discount_amount} Flat`})
                    </option>
                  ))}
                </select>
                {form.discount_value > 0 && (
                  <p className="text-[10px]" style={{ color: 'var(--color-success)' }}>
                    Discount applied: -{form.currency} {form.discount_value}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input className="form-input" type="date" value={form.payment_date} onChange={e => setForm({...form, payment_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}>
                  {METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Transaction ID</label>
                <input className="form-input" placeholder="Bank/Mobile Ref #" value={form.transaction_id} onChange={e => setForm({...form, transaction_id: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Receipt Number (Auto)</label>
                <input className="form-input opacity-60" readOnly value={form.receipt_number} />
              </div>
              <div className="form-group">
                <label className="form-label">Allocation Office</label>
                <select className="form-select" required value={form.office_id} onChange={e => setForm({...form, office_id: e.target.value})}>
                  <option value="">Select Office...</option>
                  {offices.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" placeholder="Optional notes..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ minHeight: '60px' }} />
            </div>
            <div className="flex-between p-12 mb-16 rounded-lg border-gold-20" style={{ background: 'rgba(201, 162, 39, 0.05)' }}>
               <span className="text-sm font-bold">Final Amount to Pay:</span>
               <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-gold-light)' }}>
                 {form.currency} {(parseFloat(form.amount || 0) - (form.discount_value || 0)).toLocaleString()}
               </span>
            </div>
            <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save & Confirm Payment</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="empty-state"><div className="loading-spinner" /></div> : payments.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <h3>No payments recorded</h3>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt #</th><th>Fee Type</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td className="text-sm font-bold" style={{ color: 'var(--color-gold)' }}>{p.receipt_number}</td>
                  <td className="text-xs">
                    <div>{p.fee_type || p.category}</div>
                    <div className="text-[10px] opacity-40">{p.semester}</div>
                  </td>
                  <td className="font-semibold text-sm">
                    {p.currency} {p.amount?.toLocaleString()}
                    {p.discount_value > 0 && <div className="text-[9px]" style={{ color: 'var(--color-success)' }}>Promo: -{p.discount_value}</div>}
                  </td>
                  <td className="text-sm text-muted">{p.payment_date}</td>
                  <td><span className={`badge ${p.status === 'paid' ? 'badge-success' : p.status === 'refunded' ? 'badge-danger' : 'badge-warning'}`}>{p.status}</span></td>
                  <td>
                    <div className="flex gap-4">
                      <button className="btn btn-ghost btn-sm px-8" onClick={() => handleActionPDF(p, 'view')} title="View Receipt">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="btn btn-ghost btn-sm px-8" onClick={() => handleActionPDF(p, 'download')} title="Download PDF">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NotesTab({ studentId, user }) {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [noteType, setNoteType] = useState('note');
  const [saving, setSaving] = useState(false);

  const loadInteractions = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('interactions')
      .select('*, users!staff_id(full_name)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    setInteractions(data || []);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { loadInteractions(); }, [loadInteractions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('interactions').insert({
      student_id: studentId,
      staff_id: session?.user?.id,
      type: noteType,
      content: note.trim(),
    });
    setNote('');
    setSaving(false);
    loadInteractions();
  };

  const typeIcons = { note: '📝', call: '📞', email: '✉️', meeting: '🤝', whatsapp: '💬', document: '📄', payment: '💰', status_change: '🔄' };
  const typeColors = { note: 'badge-muted', call: 'badge-info', email: 'badge-info', meeting: 'badge-success', whatsapp: 'badge-success', document: 'badge-gold', payment: 'badge-gold', status_change: 'badge-warning' };

  return (
    <div>
      <div className="card mb-24">
        <h3 className="section-title mb-16">Add Note / Interaction</h3>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-12 mb-12">
            {['note','call','email','meeting','whatsapp'].map(t => (
              <button
                key={t}
                type="button"
                className={`btn btn-sm ${noteType === t ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setNoteType(t)}
              >
                {typeIcons[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <textarea
            className="form-textarea"
            placeholder="Add a note, call summary, email recap..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />
          <div className="flex gap-12 mt-12" style={{ justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving || !note.trim()}>
              {saving ? 'Saving...' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>

      {loading ? <div className="empty-state"><div className="loading-spinner" /></div> : interactions.length === 0 ? (
        <div className="empty-state">
          <h3>No interactions yet</h3>
          <p>Add notes, call records, or emails to track this student&apos;s history</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {interactions.map(item => (
            <div key={item.id} className="card" style={{ padding: '14px 20px' }}>
              <div className="flex-between mb-8">
                <div className="flex gap-8" style={{ alignItems: 'center' }}>
                  <span>{typeIcons[item.type]}</span>
                  <span className={`badge ${typeColors[item.type]}`}>{item.type}</span>
                  <span className="text-sm font-medium">{item.users?.full_name}</span>
                </div>
                <span className="text-xs text-muted">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm" style={{ lineHeight: '1.6' }}>{item.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
