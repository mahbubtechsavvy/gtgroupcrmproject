'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  Linkedin, 
  Facebook, 
  Instagram, 
  Twitter as XIcon, 
  MessageSquare,
  Briefcase,
  FileDown
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/auth';
import * as XLSX from 'xlsx';
import styles from './contacts.module.css';

export default function ContactNetworkPage() {
  const [contacts, setContacts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [offices, setOffices] = useState([]);
  
  const [form, setForm] = useState({
    full_name: '',
    employee_id: '',
    role: '',
    office_id: '',
    phone: '',
    email: '',
    whatsapp: '',
    linkedin_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_x_url: '',
    nid_or_passport: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = getSupabaseClient();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: user } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setCurrentUser(user);

      // Fetch Contacts
      let query = supabase.from('contact_network').select('*, offices(name)');
      if (user.role !== 'ceo' && user.role !== 'coo') {
        query = query.eq('office_id', user.office_id);
      }
      const { data } = await query.order('full_name', { ascending: true });
      setContacts(data || []);

      // Fetch Offices for the form
      const { data: offData } = await supabase.from('offices').select('id, name');
      setOffices(offData || []);

    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...form,
          created_by: currentUser.id,
          // If not super admin, force their own office ID
          office_id: (currentUser.role === 'ceo' || currentUser.role === 'coo') ? form.office_id : currentUser.office_id
        })
      });
      if (res.ok) {
        setShowForm(false);
        setForm({
          full_name: '', employee_id: '', role: '', office_id: '', phone: '', email: '', whatsapp: '',
          linkedin_url: '', facebook_url: '', instagram_url: '', twitter_x_url: '', nid_or_passport: '', notes: ''
        });
        fetchData();
      }
    } catch (err) { alert('Failed to save contact'); }
  };

  const exportToExcel = (dataToExport, fileName = 'GT_Group_Contacts') => {
    const ws = XLSX.utils.json_to_sheet(dataToExport.map(c => ({
      'Full Name': c.full_name,
      'Employee ID': c.employee_id,
      'Role': c.role,
      'Office': c.offices?.name || 'Global',
      'Email': c.email,
      'Phone': c.phone,
      'WhatsApp': c.whatsapp,
      'NID/Passport': c.nid_or_passport,
      'LinkedIn': c.linkedin_url,
      'Notes': c.notes
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const filteredContacts = contacts.filter(c => 
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="empty-state">Loading Contact Network...</div>;

  return (
    <div className={styles.container}>
      <div className="flex-between mb-24">
        <div>
          <h1 className="page-title">GT Group Network</h1>
          <p className="page-subtitle">Global Directory of Staff & Partners</p>
        </div>
        <div className="flex gap-12">
          <div className="search-box" style={{ background: 'var(--color-surface)', display: 'flex', alignItems: 'center', padding: '0 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
             <Search size={16} className="text-muted" />
             <input 
               style={{ background: 'transparent', border: 'none', padding: '10px', color: 'white', outline: 'none' }}
               placeholder="Search name, ID, or role..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          <button className="btn btn-secondary" onClick={() => exportToExcel(filteredContacts)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileDown size={18} /> Export Results
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Add Contact
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {filteredContacts.map(contact => (
          <div key={contact.id} className={styles.card}>
            <div className={styles.cover}>
              <div className={styles.avatar}>
                {contact.photo_url ? (
                  <img src={contact.photo_url} alt={contact.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  contact.full_name.charAt(0)
                )}
              </div>
              <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                 <span className="badge badge-gold" style={{ fontFamily: 'monospace' }}>{contact.employee_id || 'EXT-PARTNER'}</span>
              </div>
            </div>
            <div className={styles.body}>
              <div className={styles.name}>{contact.full_name}</div>
              <div className={styles.role}>{contact.role || 'Staff Member'}</div>
              
              <div className={styles.info}>
                <div className={styles.infoItem} title="Office/Location">
                  <Briefcase size={14} color="var(--color-gold)" /> {contact.company_name || contact.offices?.name || 'GT Group Global'}
                </div>
                {contact.email && (
                  <div className={styles.infoItem}>
                    <Mail size={14} color="var(--color-gold)" /> <a href={`mailto:${contact.email}`} className="text-muted">{contact.email}</a>
                  </div>
                )}
                {contact.phone && (
                  <div className={styles.infoItem}>
                    <Phone size={14} color="var(--color-gold)" /> {contact.phone}
                  </div>
                )}
              </div>

              <div className={styles.socials}>
                {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" title="WhatsApp" className={styles.socialLink}><MessageSquare size={16} /></a>}
                {contact.linkedin_url && <a href={contact.linkedin_url} target="_blank" rel="noreferrer" title="LinkedIn" className={styles.socialLink}><Linkedin size={16} /></a>}
                {contact.facebook_url && <a href={contact.facebook_url} target="_blank" rel="noreferrer" title="Facebook" className={styles.socialLink}><Facebook size={16} /></a>}
                {contact.instagram_url && <a href={contact.instagram_url} target="_blank" rel="noreferrer" title="Instagram" className={styles.socialLink}><Instagram size={16} /></a>}
                {contact.twitter_x_url && <a href={contact.twitter_x_url} target="_blank" rel="noreferrer" title="X (Twitter)" className={styles.socialLink}><XIcon size={16} /></a>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
           <div className="modal" style={{ maxWidth: '800px' }}>
              <div className="modal-header"><h2>Add Corporate Contact</h2></div>
              <form onSubmit={handleSave}>
                <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                         <label className="form-label">Full Name *</label>
                         <input className="form-input" required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="e.g. Mahbubur Rahman" />
                      </div>
                      
                      <div className="form-group">
                         <label className="form-label">Role / Designation *</label>
                         <input className="form-input" required value={form.role} onChange={e => setForm({...form, role: e.target.value})} placeholder="e.g. Senior Counselor" />
                      </div>

                      <div className="form-group">
                         <label className="form-label">Employee ID / Partner ID</label>
                         <input className="form-input" value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} placeholder="e.g. GT-829104" />
                      </div>

                      {(isSuperAdmin(currentUser?.role)) && (
                        <div className="form-group">
                           <label className="form-label">Office Assignment</label>
                           <select className="form-select" value={form.office_id} onChange={e => setForm({...form, office_id: e.target.value})}>
                              <option value="">Global / Head Office</option>
                              {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                           </select>
                        </div>
                      )}

                      <div className="form-group">
                         <label className="form-label">NID / Passport Number (Private)</label>
                         <input className="form-input" value={form.nid_or_passport} onChange={e => setForm({...form, nid_or_passport: e.target.value})} placeholder="e.g. A01928374" />
                      </div>

                      <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1rem 0', paddingTop: '1rem' }}>
                        <h3 className="text-gold font-bold mb-16">Contact & Social Media</h3>
                      </div>

                      <div className="form-group">
                         <label className="form-label">Email Address</label>
                         <input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="e.g. name@gtgroup.com" />
                      </div>

                      <div className="form-group">
                         <label className="form-label">Phone Number</label>
                         <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="e.g. +880 1XXX-XXXXXX" />
                      </div>

                      <div className="form-group">
                         <label className="form-label">WhatsApp Number</label>
                         <input className="form-input" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} placeholder="e.g. +880 1XXX-XXXXXX" />
                      </div>

                      <div className="form-group">
                         <label className="form-label">LinkedIn Profile URL</label>
                         <input type="url" className="form-input" value={form.linkedin_url} onChange={e => setForm({...form, linkedin_url: e.target.value})} placeholder="e.g. https://linkedin.com/in/username" />
                      </div>

                      <div className="form-group">
                         <label className="form-label">Facebook Profile URL</label>
                         <input type="url" className="form-input" value={form.facebook_url} onChange={e => setForm({...form, facebook_url: e.target.value})} placeholder="e.g. https://facebook.com/username" />
                      </div>

                      <div className="form-group">
                         <label className="form-label">Instagram URL</label>
                         <input type="url" className="form-input" value={form.instagram_url} onChange={e => setForm({...form, instagram_url: e.target.value})} placeholder="e.g. https://instagram.com/username" />
                      </div>

                      <div className="form-group">
                         <label className="form-label">X (Twitter) URL</label>
                         <input type="url" className="form-input" value={form.twitter_x_url} onChange={e => setForm({...form, twitter_x_url: e.target.value})} placeholder="e.g. https://x.com/username" />
                      </div>
                   </div>
                </div>
                <div className="modal-footer">
                   <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                   <button type="submit" className="btn btn-primary">Save Contact</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
