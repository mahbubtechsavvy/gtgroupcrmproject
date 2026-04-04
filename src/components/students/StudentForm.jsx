'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const LEAD_SOURCES = ['Facebook', 'Instagram', 'Referral', 'Walk-in', 'Website', 'WhatsApp', 'LinkedIn', 'Other'];
const EDUCATION_LEVELS = ['High School', 'Diploma', 'Bachelor\'s', 'Master\'s', 'PhD', 'Other'];
const INTAKE_OPTIONS = ['March', 'September', 'October', 'January'];
const PRIORITIES = ['high', 'medium', 'low'];

const PIPELINE_STAGES = [
  { key: 'new_lead', label: 'New Lead' },
  { key: 'initial_consultation', label: 'Initial Consultation' },
  { key: 'documents_collecting', label: 'Documents Collecting' },
  { key: 'application_submitted', label: 'Application Submitted' },
  { key: 'offer_received', label: 'Offer Received' },
  { key: 'visa_applied', label: 'Visa Applied' },
  { key: 'visa_approved', label: 'Visa Approved' },
  { key: 'enrolled', label: 'Enrolled' },
];

const NATIONALITIES = {
  "Afghan": "AF", "Albanian": "AL", "Algerian": "DZ", "American": "US", "Andorran": "AD", "Angolan": "AO", "Antiguans": "AG", "Argentinean": "AR", "Armenian": "AM", "Australian": "AU", "Austrian": "AT", "Azerbaijani": "AZ", "Bahamian": "BS", "Bahraini": "BH", "Bangladeshi": "BD", "Barbadian": "BB", "Barbudans": "AG", "Batswana": "BW", "Belarusian": "BY", "Belgian": "BE", "Belizean": "BZ", "Beninese": "BJ", "Bhutanese": "BT", "Bolivian": "BO", "Bosnian": "BA", "Brazilian": "BR", "British": "GB", "Bruneian": "BN", "Bulgarian": "BG", "Burkinabe": "BF", "Burmese": "MM", "Burundian": "BI", "Cambodian": "KH", "Cameroonian": "CM", "Canadian": "CA", "Cape Verdean": "CV", "Central African": "CF", "Chadian": "TD", "Chilean": "CL", "Chinese": "CN", "Colombian": "CO", "Comoran": "KM", "Congolese": "CG", "Costa Rican": "CR", "Croatian": "HR", "Cuban": "CU", "Cypriot": "CY", "Czech": "CZ", "Danish": "DK", "Djibouti": "DJ", "Dominican": "DO", "Dutch": "NL", "East Timorese": "TL", "Ecuadorean": "EC", "Egyptian": "EG", "Emirian": "AE", "Equatorial Guinean": "GQ", "Eritrean": "ER", "Estonian": "EE", "Ethiopian": "ET", "Fijian": "FJ", "Filipino": "PH", "Finnish": "FI", "French": "FR", "Gabonese": "GA", "Gambian": "GM", "Georgian": "GE", "German": "DE", "Ghanaian": "GH", "Greek": "GR", "Grenadian": "GD", "Guatemalan": "GT", "Guinea-Bissauan": "GW", "Guinean": "GN", "Guyanese": "GY", "Haitian": "HT", "Herzegovinian": "BA", "Honduran": "HN", "Hungarian": "HU", "I-Kiribati": "KI", "Icelander": "IS", "Indian": "IN", "Indonesian": "ID", "Iranian": "IR", "Iraqi": "IQ", "Irish": "IE", "Israeli": "IL", "Italian": "IT", "Ivorian": "CI", "Jamaican": "JM", "Japanese": "JP", "Jordanian": "JO", "Kazakhstani": "KZ", "Kenyan": "KE", "Kittian and Nevisian": "KN", "Kuwaiti": "KW", "Kyrgyz": "KG", "Laotian": "LA", "Latvian": "LV", "Lebanese": "LB", "Liberian": "LR", "Libyan": "LY", "Liechtensteiner": "LI", "Lithuanian": "LT", "Luxembourger": "LU", "Macedonian": "MK", "Malagasy": "MG", "Malawian": "MW", "Malaysian": "MY", "Maldivan": "MV", "Malian": "ML", "Maltese": "MT", "Marshallese": "MH", "Mauritanian": "MR", "Mauritian": "MU", "Mexican": "MX", "Micronesian": "FM", "Moldovan": "MD", "Monacan": "MC", "Mongolian": "MN", "Moroccan": "MA", "Mosotho": "LS", "Motswana": "BW", "Mozambican": "MZ", "Namibian": "NA", "Nauruan": "NR", "Nepalese": "NP", "Nepali": "NP", "New Zealander": "NZ", "Ni-Vanuatu": "VU", "Nicaraguan": "NI", "Nigerien": "NE", "North Korean": "KP", "Northern Irish": "GB", "Norwegian": "NO", "Omani": "OM", "Pakistani": "PK", "Palauan": "PW", "Panamanian": "PA", "Papua New Guinean": "PG", "Paraguayan": "PY", "Peruvian": "PE", "Polish": "PL", "Portuguese": "PT", "Qatari": "QA", "Romanian": "RO", "Russian": "RU", "Rwandan": "RW", "Saint Lucian": "LC", "Salvadoran": "SV", "Samoan": "WS", "San Marinese": "SM", "Sao Tomean": "ST", "Saudi": "SA", "Scottish": "GB", "Senegalese": "SN", "Serbian": "RS", "Seychellois": "SC", "Sierra Leonean": "SL", "Singaporean": "SG", "Slovakian": "SK", "Slovenian": "SI", "Solomon Islander": "SB", "Somali": "SO", "South African": "ZA", "South Korean": "KR", "Spanish": "ES", "Sri Lankan": "LK", "Sudanese": "SD", "Surinamer": "SR", "Swazi": "SZ", "Swedish": "SE", "Swiss": "CH", "Syrian": "SY", "Taiwanese": "TW", "Tajik": "TJ", "Tanzanian": "TZ", "Thai": "TH", "Togolese": "TG", "Tongan": "TO", "Trinidadian or Tobagonian": "TT", "Tunisian": "TN", "Turkish": "TR", "Tuvaluan": "TV", "Ugandan": "UG", "Ukrainian": "UA", "Uruguayan": "UY", "Uzbekistani": "UZ", "Venezuelan": "VE", "Vietnamese": "VN", "Welsh": "GB", "Yemenite": "YE", "Zambian": "ZM", "Zimbabwean": "ZW"
};

const SECTION_TABS = ['Personal', 'Contact', 'Academic', 'Study Preferences', 'CRM Details'];

const F = ({ label, required, children }) => (
  <div className="form-group">
    <label className="form-label">{label}{required && ' *'}</label>
    {children}
  </div>
);

export default function StudentForm({ student, user, onClose, onSaved }) {
  const [activeSection, setActiveSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [offices, setOffices] = useState([]);
  const [defaultCountry, setDefaultCountry] = useState('BD'); // Default flag
  const superAdmin = isSuperAdmin(user?.role);

  const [form, setForm] = useState({
    // Personal
    first_name: student?.first_name || '',
    last_name: student?.last_name || '',
    date_of_birth: student?.date_of_birth || '',
    gender: student?.gender || '',
    nationality: student?.nationality || '',
    passport_number: student?.passport_number || '',
    passport_expiry: student?.passport_expiry || '',
    // Contact
    email: student?.email || '',
    phone: student?.phone || '',
    whatsapp: student?.whatsapp || '',
    father_mobile: student?.father_mobile || '',
    mother_mobile: student?.mother_mobile || '',
    address: student?.address || '',
    // Academic
    education_level: student?.education_level || '',
    institution_name: student?.institution_name || '',
    gpa: student?.gpa || '',
    graduation_year: student?.graduation_year || '',
    ielts_overall: student?.ielts_overall || '',
    ielts_listening: student?.ielts_listening || '',
    ielts_reading: student?.ielts_reading || '',
    ielts_writing: student?.ielts_writing || '',
    ielts_speaking: student?.ielts_speaking || '',
    toefl_score: student?.toefl_score || '',
    topik_score: student?.topik_score || '',
    other_test: student?.other_test || '',
    other_test_score: student?.other_test_score || '',
    // Study Preferences
    target_destination_id: student?.target_destination_id || '',
    target_university_id: student?.target_university_id || '',
    target_course_name: student?.target_course_name || '',
    preferred_intake: student?.preferred_intake || '',
    // CRM
    lead_source: student?.lead_source || 'Walk-in',
    pipeline_status: student?.pipeline_status || 'new_lead',
    priority: student?.priority || 'medium',
    assigned_to: student?.assigned_to || '',
    office_id: student?.office_id || user?.office_id || '',
  });

  useEffect(() => {
    const supabase = getSupabaseClient();
    const loadOptions = async () => {
      const [destRes, offRes, counselorRes] = await Promise.all([
        supabase.from('destinations').select('id, country_name, flag_emoji').eq('is_active', true).order('country_name'),
        supabase.from('offices').select('id, name').order('name'),
        supabase.from('users').select('id, full_name').in('role', ['counselor', 'senior_counselor', 'office_manager']).eq('is_active', true).order('full_name'),
      ]);
      setDestinations(destRes.data || []);
      setOffices(offRes.data || []);
      setCounselors(counselorRes.data || []);
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (form.target_destination_id) {
      const supabase = getSupabaseClient();
      supabase.from('universities').select('id, name').eq('destination_id', form.target_destination_id).order('name')
        .then(({ data }) => setUniversities(data || []));
    } else {
      setUniversities([]);
    }
  }, [form.target_destination_id]);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));

    // Logic to auto-sync country code when typing Nationality
    if (field === 'nationality' && value) {
      // Find matching country code (e.g. "Bangladeshi" -> "BD")
      const code = NATIONALITIES[value] || Object.keys(NATIONALITIES).find(n => n.toLowerCase() === value.toLowerCase());
      if (code && typeof code === 'string') {
        setDefaultCountry(code);
      } else if (NATIONALITIES[code]) {
        setDefaultCountry(NATIONALITIES[code]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    // Clean empty strings to null for ALL fields so Postgres numeric/uuid columns don't crash
    const payload = { ...form };
    Object.keys(payload).forEach(key => {
      if (payload[key] === '') payload[key] = null;
    });

    if (payload.ielts_overall) payload.ielts_overall = parseFloat(payload.ielts_overall);
    if (payload.ielts_listening) payload.ielts_listening = parseFloat(payload.ielts_listening);
    if (payload.ielts_reading) payload.ielts_reading = parseFloat(payload.ielts_reading);
    if (payload.ielts_writing) payload.ielts_writing = parseFloat(payload.ielts_writing);
    if (payload.ielts_speaking) payload.ielts_speaking = parseFloat(payload.ielts_speaking);
    if (payload.toefl_score) payload.toefl_score = parseInt(payload.toefl_score);
    if (payload.graduation_year) payload.graduation_year = parseInt(payload.graduation_year);

    let result;
    if (student?.id) {
      result = await supabase.from('students').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', student.id);
      await supabase.from('interactions').insert({
        student_id: student.id,
        staff_id: session?.user?.id,
        type: 'note',
        content: 'Student profile updated',
      });
    } else {
      const { data: newStudent, error } = await supabase.from('students')
        .insert({ ...payload, created_by: session?.user?.id })
        .select('id').single();
      if (newStudent) {
        await supabase.from('interactions').insert({
          student_id: newStudent.id,
          staff_id: session?.user?.id,
          type: 'note',
          content: 'Student profile created',
        });
      }
      result = { error };
    }

    setSaving(false);
    if (result?.error) {
      alert('Failed to save student: ' + result.error.message);
    } else {
      onSaved();
    }
  };

  const inp = (field, type = 'text', placeholder = '') => (
    <input
      className="form-input"
      type={type}
      placeholder={placeholder}
      value={form[field]}
      onChange={e => update(field, e.target.value)}
    />
  );

  const sel = (field, options, emptyLabel = 'Select...') => (
    <select className="form-select" value={form[field]} onChange={e => update(field, e.target.value)}>
      <option value="">{emptyLabel}</option>
      {options.map(o => (
        <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
      ))}
    </select>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-xl" style={{ maxHeight: '92vh' }}>
        <div className="modal-header">
          <h2 className="modal-title">{student ? 'Edit Student' : 'Add New Student'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 24px', overflowX: 'auto' }}>
          {SECTION_TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              className={`tab-btn ${activeSection === i ? 'active' : ''}`}
              onClick={() => setActiveSection(i)}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* PERSONAL */}
            {activeSection === 0 && (
              <div className="grid-2">
                <F label="Given Name" required><input className="form-input" required value={form.first_name} onChange={e => update('first_name', e.target.value)} /></F>
                <F label="Surname" required><input className="form-input" required value={form.last_name} onChange={e => update('last_name', e.target.value)} /></F>
                <F label="Date of Birth (YYYY/MM/DD)">{inp('date_of_birth', 'text', 'YYYY/MM/DD')}</F>
                <F label="Gender">
                  {sel('gender', [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }], 'Select gender')}
                </F>
                <F label="Nationality">
                  <input
                    className="form-input"
                    list="nationalities-list"
                    placeholder="e.g. Bangladeshi"
                    value={form.nationality}
                    onChange={e => update('nationality', e.target.value)}
                  />
                  <datalist id="nationalities-list">
                    {Object.keys(NATIONALITIES).map(nat => (
                      <option key={nat} value={nat} />
                    ))}
                  </datalist>
                </F>
                <F label="Passport Number">{inp('passport_number', 'text', 'e.g. AB1234567')}</F>
                <F label="Passport Expiry (YYYY/MM/DD)">{inp('passport_expiry', 'text', 'YYYY/MM/DD')}</F>
              </div>
            )}

            {/* CONTACT */}
            {activeSection === 1 && (
              <div className="grid-2">
                <F label="Email">{inp('email', 'email', 'student@email.com')}</F>
                <F label="Phone">
                  <PhoneInput
                    international
                    defaultCountry={defaultCountry}
                    className="form-input"
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={v => update('phone', v)}
                  />
                </F>
                <F label="WhatsApp">
                  <PhoneInput
                    international
                    defaultCountry={defaultCountry}
                    className="form-input"
                    placeholder="Enter WhatsApp"
                    value={form.whatsapp}
                    onChange={v => update('whatsapp', v)}
                  />
                </F>
                <F label="Father's Mobile">
                  <PhoneInput
                    international
                    defaultCountry={defaultCountry}
                    className="form-input"
                    placeholder="Enter mobile"
                    value={form.father_mobile}
                    onChange={v => update('father_mobile', v)}
                  />
                </F>
                <F label="Mother's Mobile">
                  <PhoneInput
                    international
                    defaultCountry={defaultCountry}
                    className="form-input"
                    placeholder="Enter mobile"
                    value={form.mother_mobile}
                    onChange={v => update('mother_mobile', v)}
                  />
                </F>
                <div style={{ gridColumn: '1 / -1' }}>
                  <F label="Current Address">
                    <textarea className="form-textarea" style={{ minHeight: '80px' }} value={form.address} onChange={e => update('address', e.target.value)} />
                  </F>
                </div>
              </div>
            )}

            {/* ACADEMIC */}
            {activeSection === 2 && (
              <div className="grid-2">
                <F label="Education Level">
                  {sel('education_level', EDUCATION_LEVELS.map(l => ({ value: l, label: l })), 'Select level')}
                </F>
                <F label="Institution Name">{inp('institution_name', 'text', 'University / College name')}</F>
                <F label="GPA / Percentage">{inp('gpa', 'text', 'e.g. 3.8 / 80%')}</F>
                <F label="Graduation Year">{inp('graduation_year', 'number', '2023')}</F>

                <div style={{ gridColumn: '1 / -1' }}>
                  <p className="form-label" style={{ marginBottom: '12px', color: 'var(--color-gold)' }}>English Test Scores</p>
                </div>
                <F label="IELTS Overall">{inp('ielts_overall', 'number', '7.0')}</F>
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
                  <F label="Listening">{inp('ielts_listening', 'number', '7.0')}</F>
                  <F label="Reading">{inp('ielts_reading', 'number', '7.0')}</F>
                  <F label="Writing">{inp('ielts_writing', 'number', '6.5')}</F>
                  <F label="Speaking">{inp('ielts_speaking', 'number', '7.0')}</F>
                </div>
                <F label="TOEFL Score">{inp('toefl_score', 'number', '100')}</F>
                <F label="TOPIK Score">{inp('topik_score', 'text', 'e.g. Level 3')}</F>
                <F label="Other Test (PTE/Duolingo)">{inp('other_test', 'text', 'e.g. PTE')}</F>
                <F label="Other Test Score">{inp('other_test_score', 'text', 'e.g. 65')}</F>
              </div>
            )}

            {/* STUDY PREFERENCES */}
            {activeSection === 3 && (
              <div className="grid-2">
                <F label="Target Destination">
                  <select className="form-select" value={form.target_destination_id} onChange={e => update('target_destination_id', e.target.value)}>
                    <option value="">Select destination...</option>
                    {destinations.map(d => <option key={d.id} value={d.id}>{d.flag_emoji} {d.country_name}</option>)}
                  </select>
                </F>
                <F label="Target University">
                  <select className="form-select" value={form.target_university_id} onChange={e => update('target_university_id', e.target.value)} disabled={!form.target_destination_id}>
                    <option value="">Select university...</option>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </F>
                <F label="Target Course / Program">{inp('target_course_name', 'text', 'e.g. Computer Science')}</F>
                <F label="Preferred Intake">
                  {sel('preferred_intake', INTAKE_OPTIONS.map(i => ({ value: i, label: i })), 'Select intake')}
                </F>
              </div>
            )}

            {/* CRM DETAILS */}
            {activeSection === 4 && (
              <div className="grid-2">
                <F label="Lead Source">
                  {sel('lead_source', LEAD_SOURCES.map(s => ({ value: s, label: s })), 'Select source')}
                </F>
                <F label="Pipeline Status">
                  {sel('pipeline_status', PIPELINE_STAGES.map(s => ({ value: s.key, label: s.label })), 'Select status')}
                </F>
                <F label="Priority">
                  {sel('priority', PRIORITIES.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) })), 'Select priority')}
                </F>
                <F label="Assigned Counselor">
                  <select className="form-select" value={form.assigned_to} onChange={e => update('assigned_to', e.target.value)}>
                    <option value="">Unassigned</option>
                    {counselors.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </F>
                {superAdmin && (
                  <F label="Office">
                    <select className="form-select" value={form.office_id} onChange={e => update('office_id', e.target.value)}>
                      <option value="">Select office...</option>
                      {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </F>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <div className="flex gap-8">
              {activeSection > 0 && (
                <button type="button" className="btn btn-secondary" onClick={() => setActiveSection(s => s - 1)}>
                  ← Previous
                </button>
              )}
              {activeSection < SECTION_TABS.length - 1 && (
                <button type="button" className="btn btn-secondary" onClick={() => setActiveSection(s => s + 1)}>
                  Next →
                </button>
              )}
            </div>
            <div className="flex gap-12">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
