'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  Key, Shield, UserCheck, Mail, Lock, 
  ExternalLink, Search, Plus, Filter,
  Monitor, Layout, UserCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PortalManagementPage() {
  const [portalUsers, setPortalUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [nexusClients, setNexusClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_type: 'student',
    reference_id: '',
    email: '',
    full_name: '',
    password: '' // Temporary field for onboarding
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = getSupabaseClient();
    try {
      const [pRes, sRes, nRes] = await Promise.all([
        supabase.from('client_portal_users').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('id, first_name, last_name, email'),
        supabase.from('nexus_clients').select('id, company_name, email')
      ]);

      setPortalUsers(pRes.data || []);
      setStudents(sRes.data || []);
      setNexusClients(nRes.data || []);
    } catch (err) {
      toast.error('Portal connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortalUser = async (e) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    
    try {
      // 1. Create the auth user via Supabase Auth
      // Note: In a production app, this should be done via a secure Edge Function 
      // or handled by the user themselves via a sign-up invite.
      // For this implementation, we assume the admin sets an initial password.
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            client_type: form.client_type
          }
        }
      });

      if (authError) throw authError;

      // 2. Insert into client_portal_users table
      const { error: dbError } = await supabase
        .from('client_portal_users')
        .insert([{
          id: authData.user.id,
          client_type: form.client_type,
          reference_id: form.reference_id,
          email: form.email,
          full_name: form.full_name
        }]);

      if (dbError) throw dbError;

      toast.success('Client Portal account activated');
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error('Provisioning failed: ' + err.message);
    }
  };

  return (
    <div className="page-content space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Shield className="text-gold" />
            Client Access Control
          </h1>
          <p className="page-subtitle">Provision and manage digital identities for students and B2B partners</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary btn-lg shadow-gold"
        >
          <Plus size={20} /> Provision New Access
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Portal Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card glass p-6">
            <div className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-4">Portal Metrics</div>
            <div className="space-y-6">
              <div>
                <div className="text-2xl font-bold text-white">{portalUsers.length}</div>
                <div className="text-xs text-text-muted">Total Authorized Accounts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{portalUsers.filter(u => u.client_type === 'student').length}</div>
                <div className="text-xs text-text-muted">Active Student Portals</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-500">{portalUsers.filter(u => u.client_type === 'nexus_b2b').length}</div>
                <div className="text-xs text-text-muted">Active B2B Keyholders</div>
              </div>
            </div>
          </div>

          <div className="card border-gold/20 p-6">
            <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
              <Key size={16} className="text-gold" /> Security Protocol
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Provisioned accounts grant access to the <strong>Nexus 2.0 Global Portal</strong>. Users can track visa progress, project timelines, and view secured documents.
            </p>
          </div>
        </div>

        {/* User List */}
        <div className="lg:col-span-3">
          <div className="table-wrapper glass">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Identity & Access</th>
                  <th>Classification</th>
                  <th>Reference</th>
                  <th>Last Sync</th>
                  <th className="text-right">Intelligence</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><div className="loading-spinner mx-auto"></div></td></tr>
                ) : portalUsers.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-text-muted">No portal users provisioned yet.</td></tr>
                ) : (
                  portalUsers.map(user => (
                    <tr key={user.id} className="group">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-gold border border-border">
                            <UserCircle size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-gold transition-colors">{user.full_name}</div>
                            <div className="text-xs text-text-muted">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${user.client_type === 'student' ? 'badge-blue' : 'badge-gold'}`}>
                          {user.client_type === 'student' ? '🎓 Student' : '🏢 Nexus B2B'}
                        </span>
                      </td>
                      <td>
                        <div className="text-xs text-text-dim uppercase tracking-wider font-mono">
                          REF: {user.reference_id.slice(0, 8)}...
                        </div>
                      </td>
                      <td>
                        <div className="text-xs text-text-muted">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                        </div>
                      </td>
                      <td className="text-right">
                        <button className="btn btn-ghost btn-sm" title="Audit Log"><Monitor size={14} /></button>
                        <button className="btn btn-ghost btn-sm" title="Revoke Access"><Lock size={14} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Provisioning Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Provision Digital Access</h2>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest">Portal Credentials Engine</p>
              </div>
              <button onClick={() => setShowForm(false)} className="modal-close"><Plus className="rotate-45" size={28} /></button>
            </div>
            <form onSubmit={handleCreatePortalUser} className="modal-body space-y-6">
              <div className="form-group">
                <label className="form-label">Classification</label>
                <select 
                  className="form-select" 
                  value={form.client_type}
                  onChange={(e) => setForm({...form, client_type: e.target.value, reference_id: '', email: '', full_name: ''})}
                >
                  <option value="student">Student Account (B2C)</option>
                  <option value="nexus_b2b">Nexus Enterprise Client (B2B)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Link to Entity</label>
                <select 
                  required
                  className="form-select"
                  value={form.reference_id}
                  onChange={(e) => {
                    const id = e.target.value;
                    const entity = form.client_type === 'student' 
                      ? students.find(s => s.id === id)
                      : nexusClients.find(n => n.id === id);
                    
                    if (entity) {
                      setForm({
                        ...form,
                        reference_id: id,
                        email: entity.email || '',
                        full_name: form.client_type === 'student' 
                          ? `${entity.first_name} ${entity.last_name}`
                          : entity.company_name
                      });
                    }
                  }}
                >
                  <option value="">Select {form.client_type === 'student' ? 'Student' : 'Client'}...</option>
                  {form.client_type === 'student' 
                    ? students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.email})</option>)
                    : nexusClients.map(n => <option key={n.id} value={n.id}>{n.company_name} ({n.email})</option>)
                  }
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Account Email</label>
                  <input type="email" required value={form.email} readOnly className="form-input opacity-70" />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name / Label</label>
                  <input required value={form.full_name} readOnly className="form-input opacity-70" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password</label>
                <input 
                  required 
                  type="password" 
                  value={form.password} 
                  onChange={(e) => setForm({...form, password: e.target.value})} 
                  className="form-input" 
                  placeholder="Set a secure temporary password"
                />
                <p className="text-[10px] text-text-dim italic mt-1">Client will be prompted to change this on first login.</p>
              </div>
            </form>
            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleCreatePortalUser} className="btn btn-primary btn-lg shadow-gold">Activate Access</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
