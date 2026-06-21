'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
const supabase = getSupabaseClient();
import { 
  Calendar, Clock, MapPin, 
  CheckCircle, XCircle, Search, 
  Filter, MoreVertical, Mail, 
  Phone, Video, User
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AppointmentsInbox() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [websiteType, setWebsiteType] = useState('study-abroad');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type) setWebsiteType(type);
    fetchAppointments(type || 'study-abroad');
  }, []);

  const fetchAppointments = async (type = websiteType) => {
    try {
      const { data, error } = await supabase
        .from('web_appointments')
        .select('*')
        .eq('website_type', type)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('web_appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Appointment ${status}`);
      fetchAppointments();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const filtered = appointments.filter(apt => filter === 'all' || apt.status === filter);

  return (
    <div className="page-content space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Calendar className="text-gold" />
            Global Booking Center
          </h1>
          <p className="page-subtitle">Coordinate institutional counseling and visa consultations across the global office network</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="search-input-wrapper min-w-[250px]">
            <Filter size={18} className="text-gold" />
            <select 
              className="form-select bg-transparent border-none focus:ring-0 text-white font-bold"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Unified Queue</option>
              <option value="pending">Awaiting Review</option>
              <option value="confirmed">Scheduled</option>
              <option value="completed">Archive</option>
              <option value="cancelled">Voided</option>
            </select>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><Clock size={24} /></div>
          <div className="kpi-value">{appointments.filter(a => a.status === 'pending').length}</div>
          <div className="kpi-label">Pending Inquiries</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><Calendar size={24} /></div>
          <div className="kpi-value">{appointments.filter(a => a.status === 'confirmed').length}</div>
          <div className="kpi-label">Confirmed Sessions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><CheckCircle size={24} /></div>
          <div className="kpi-value">{appointments.filter(a => a.status === 'completed').length}</div>
          <div className="kpi-label">Success Rate (%)</div>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-80 card glass animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full empty-state">
            <Calendar size={64} className="text-text-dim opacity-20" />
            <h3>Unified Queue Clear</h3>
            <p>No consultations matching the selected criteria were found in the intelligence center.</p>
          </div>
        ) : (
          filtered.map(apt => (
            <div key={apt.id} className="card glass p-6 group hover:border-gold/50 transition-all duration-500 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className={`badge ${
                  apt.status === 'confirmed' ? 'badge-success' :
                  apt.status === 'pending' ? 'badge-gold' :
                  'badge-muted'
                }`}>
                  {apt.status}
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-surface-2 rounded-xl text-text-dim hover:text-gold transition-colors"><Mail size={16} /></button>
                  <button className="p-2 bg-surface-2 rounded-xl text-text-dim hover:text-gold transition-colors"><Phone size={16} /></button>
                </div>
              </div>

              <div className="flex gap-5 items-center mb-6">
                <div className="w-14 h-14 bg-navy/50 rounded-2xl border border-border flex items-center justify-center text-gold shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <User size={28} />
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-lg font-bold text-white truncate group-hover:text-gold transition-colors">{apt.full_name}</h3>
                  <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest truncate">{apt.email}</p>
                </div>
              </div>

              <div className="space-y-4 p-5 rounded-2xl bg-surface-2/50 border border-border group-hover:bg-navy/30 transition-colors">
                <div className="flex items-center gap-4 text-text">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold"><Calendar size={14} /></div>
                  <span className="text-xs font-bold">{new Date(apt.appointment_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-4 text-text">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Clock size={14} /></div>
                  <span className="text-xs font-bold">{apt.appointment_time} (Local Time)</span>
                </div>
                <div className="flex items-center gap-4 text-text">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><MapPin size={14} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{apt.office_id} Strategic Hub</span>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                {apt.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateStatus(apt.id, 'confirmed')}
                      className="flex-1 btn btn-primary btn-sm shadow-gold"
                    >
                      <CheckCircle size={14} className="mr-2" /> Confirm
                    </button>
                    <button 
                      onClick={() => updateStatus(apt.id, 'cancelled')}
                      className="btn btn-danger btn-sm"
                    >
                      <XCircle size={14} className="mr-2" /> Void
                    </button>
                  </>
                )}
                {apt.status === 'confirmed' && (
                  <button 
                    onClick={() => updateStatus(apt.id, 'completed')}
                    className="flex-1 btn btn-success btn-sm"
                  >
                    <CheckCircle size={14} className="mr-2" /> Mark Completed
                  </button>
                )}
                {apt.status === 'completed' && (
                  <button className="flex-1 btn btn-secondary btn-sm opacity-50 cursor-default">
                    Session Logged
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
