'use client';

import { useState, useEffect } from 'react';
import { ExecutiveHero, ExecutiveSection, MetricGrid } from '@/components/crm/ExecutivePage';
import { useUser } from '@/components/layout/AppLayout';
import { Search, Plus } from 'lucide-react';
import styles from './contacts.module.css';

export default function ContactNetworkPage() {
  const user = useUser();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    company_name: '',
    role: '',
    email: '',
    phone: '',
    country: '',
    office_name: '',
    linkedin_url: '',
    whatsapp: '',
    notes: '',
  });

  useEffect(() => {
    fetchContacts();
  }, [category]);

  const fetchContacts = async () => {
    setLoading(true);
    const officeId = user && !['ceo', 'coo', 'it_manager'].includes(user.role) ? user.office_id : '';
    const response = await fetch(`/api/contacts${officeId ? `?officeId=${officeId}` : ''}`);
    const data = await response.json();
    const source = Array.isArray(data) ? data : [];
    setContacts(category === 'all' ? source : source.filter((contact) => (contact.role || '').toLowerCase().includes(category)));
    setLoading(false);
  };

  const saveContact = async (event) => {
    event.preventDefault();
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        office_id: user?.office_id || null,
        created_by: user?.id || null,
      }),
    });
    if (!response.ok) {
      alert('Unable to save contact entry.');
      return;
    }
    setShowForm(false);
    setForm({
      full_name: '',
      company_name: '',
      role: '',
      email: '',
      phone: '',
      country: '',
      office_name: '',
      linkedin_url: '',
      whatsapp: '',
      notes: '',
    });
    fetchContacts();
  };

  const filteredContacts = contacts.filter(c => 
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const metrics = [
    { label: 'Total Contacts', value: contacts.length },
    { label: 'Partners', value: contacts.filter((contact) => (contact.role || '').toLowerCase().includes('partner')).length },
    { label: 'Vendors', value: contacts.filter((contact) => (contact.role || '').toLowerCase().includes('vendor')).length },
    { label: 'With WhatsApp', value: contacts.filter((contact) => contact.whatsapp).length },
  ];

  return (
    <div className={styles.container}>
      <ExecutiveHero
        eyebrow="Relationship Intelligence"
        title="Contact Network"
        subtitle="Company, office, and partner relationship tracking with working add-entry flow and faster supervision."
        actions={<button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add Entry</button>}
      />

      <ExecutiveSection title="Network Summary">
        <MetricGrid items={metrics} />
      </ExecutiveSection>

      {/* Filter Bar */}
      <ExecutiveSection title="Directory">
        <div className="search-filter-bar mb-10">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input className="form-input" placeholder="Search the network..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: '220px' }} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All Contacts</option>
            <option value="partner">Partners</option>
            <option value="vendor">Vendors</option>
            <option value="legal">Legal</option>
            <option value="government">Government</option>
          </select>
        </div>

      {loading ? (
        <div className="flex justify-center p-20"><div className="loading-spinner" /></div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Role</th>
                <th>Office / Country</th>
                <th>Contact</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
          {filteredContacts.map((contact) => (
            <tr key={contact.id}>
              <td><strong>{contact.full_name}</strong></td>
              <td>{contact.company_name || '—'}</td>
              <td>{contact.role || '—'}</td>
              <td>{contact.office_name || 'Global'} {contact.country ? `• ${contact.country}` : ''}</td>
              <td>
                <div>{contact.email || '—'}</div>
                <div className="text-xs text-muted">{contact.phone || contact.whatsapp || 'No number'}</div>
              </td>
              <td className="text-sm text-muted">{contact.notes || '—'}</td>
            </tr>
          ))}
            </tbody>
          </table>
        </div>
      )}
      </ExecutiveSection>

      {!loading && filteredContacts.length === 0 && (
        <div className="text-center p-20 glass rounded-[40px] border border-dashed border-white/5">
           <h3 className="text-2xl font-black text-white">Node Not Found</h3>
           <p className="text-text-dim max-w-xs mx-auto mt-2">We couldn&apos;t find any contact matching your parameters in the global network.</p>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add Contact Entry</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>x</button>
            </div>
            <form onSubmit={saveContact}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Company</label><input className="form-input" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Role</label><input className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">WhatsApp</label><input className="form-input" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Country</label><input className="form-input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Office Name</label><input className="form-input" value={form.office_name} onChange={(e) => setForm({ ...form, office_name: e.target.value })} /></div>
                </div>
                <div className="form-group mt-4"><label className="form-label">LinkedIn URL</label><input className="form-input" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} /></div>
                <div className="form-group mt-4"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
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
