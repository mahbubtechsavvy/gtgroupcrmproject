'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/layout/AppLayout';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useUser();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEventData();
      fetchStudents();
    }
  }, [id]);

  async function fetchEventData() {
    try {
      setLoading(true);
      // 1. Fetch Event
      const { data: eventData, error: eventErr } = await supabase
        .from('events')
        .select('*, users(full_name)')
        .eq('id', id)
        .single();

      if (eventErr) throw eventErr;
      setEvent(eventData);

      // 2. Fetch Registrations
      const { data: regData, error: regErr } = await supabase
        .from('event_registrations')
        .select('*, students(full_name, email, phone)')
        .eq('event_id', id)
        .order('registered_at', { ascending: false });

      if (regErr) throw regErr;
      setRegistrations(regData || []);

    } catch (err) {
      console.error(err);
      toast.error('Failed to load event details');
      router.push('/events');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudents() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, email')
        .order('full_name');
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Failed to load students list', err);
    }
  }

  async function handleRegisterStudent(e) {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error('Please select a student');
      return;
    }

    // Check if already registered
    const exists = registrations.some(r => r.student_id === selectedStudentId);
    if (exists) {
      toast.error('Student is already registered for this event');
      return;
    }

    try {
      setRegistering(true);

      const ticketNum = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

      const newRegistration = {
        office_id: user?.office_id,
        event_id: id,
        student_id: selectedStudentId,
        registered_by: user?.id,
        ticket_number: ticketNum,
        status: 'registered',
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketNum}`
      };

      const { error } = await supabase
        .from('event_registrations')
        .insert(newEventRegistration);

      if (error) throw error;

      toast.success('Student registered successfully');
      setSelectedStudentId('');
      fetchEventData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to register student');
    } finally {
      setRegistering(false);
    }
  }

  async function toggleStatus(registrationId, currentStatus) {
    const nextStatus = currentStatus === 'registered' ? 'attended' : 
                     currentStatus === 'attended' ? 'cancelled' : 'registered';
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: nextStatus })
        .eq('id', registrationId);

      if (error) throw error;
      toast.success(`Status updated to ${nextStatus}`);
      fetchEventData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (!event) return null;

  const spotsLeft = event.max_capacity ? event.max_capacity - registrations.length : null;
  const percentFilled = event.max_capacity ? Math.round((registrations.length / event.max_capacity) * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div className="text-sm">
        <Link href="/events" className="text-gold hover:underline">← Back to Events</Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Event Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-6">
            <div>
              <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase ${
                event.type === 'expo' ? 'bg-gold/20 text-gold border border-gold/30' :
                event.type === 'webinar' ? 'bg-info/20 text-info border border-info/30' :
                event.type === 'seminar' ? 'bg-purple/25 text-purple border border-purple/35' :
                'bg-success/20 text-success border border-success/30'
              }`}>
                {event.type}
              </span>
              <h1 className="font-display text-2xl font-bold text-white mt-3">{event.title}</h1>
            </div>

            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
              {event.description || 'No description provided.'}
            </p>

            <div className="space-y-3 pt-4 border-t border-white/5 text-xs text-white/50">
              <div className="flex items-center gap-2">
                <span>📅</span>
                <div>
                  <p className="font-semibold text-white/80">Start Time</p>
                  <p>{new Date(event.start_date).toLocaleString()}</p>
                </div>
              </div>

              {event.end_date && (
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <div>
                    <p className="font-semibold text-white/80">End Time</p>
                    <p>{new Date(event.end_date).toLocaleString()}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span>📍</span>
                <div>
                  <p className="font-semibold text-white/80">Venue / Location</p>
                  <p>{event.is_online ? 'Online Event' : (event.location || 'No location set')}</p>
                </div>
              </div>

              {event.is_online && event.meeting_link && (
                <div className="flex items-center gap-2">
                  <span>🔗</span>
                  <div>
                    <p className="font-semibold text-white/80">Meeting Link</p>
                    <a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline break-all">
                      {event.meeting_link}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {event.max_capacity && (
              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white/60">Registrations Quota</span>
                  <span className="text-gold">{registrations.length} / {event.max_capacity} Seats</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className="bg-gold h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(percentFilled, 100)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-white/40 text-right">
                  {spotsLeft > 0 ? `${spotsLeft} seats remaining` : 'No seats remaining'}
                </p>
              </div>
            )}
          </div>

          {/* Quick Registration Form */}
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-white">Register a Student</h3>
            <form onSubmit={handleRegisterStudent} className="space-y-3">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
              >
                <option value="">-- Select Student --</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>{st.full_name} ({st.email})</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={registering || (spotsLeft !== null && spotsLeft <= 0)}
                className="w-full bg-gold hover:bg-gold-light disabled:bg-white/5 disabled:text-white/20 text-navy font-semibold px-4 py-2 rounded-lg transition-all text-sm"
              >
                {registering ? 'Registering...' : (spotsLeft !== null && spotsLeft <= 0) ? 'Event Full' : 'Register Student'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Attendee List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-6">
            <h2 className="font-display text-xl font-bold text-white flex items-center justify-between">
              <span>Registered Attendees</span>
              <span className="text-xs bg-white/5 border border-white/10 text-white/60 px-3 py-1 rounded-full">
                Total: {registrations.length}
              </span>
            </h2>

            {registrations.length === 0 ? (
              <p className="text-white/40 text-center py-12 text-sm">No registrations yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 text-xs uppercase font-semibold">
                      <th className="py-3 px-4">Ticket</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Email / Phone</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="border-b border-white/5 text-sm hover:bg-white/5 transition-all">
                        <td className="py-3 px-4 font-mono text-gold text-xs">
                          {reg.ticket_number}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {reg.students?.full_name || 'Unknown Student'}
                        </td>
                        <td className="py-3 px-4 text-xs text-white/60">
                          <div>{reg.students?.email || 'N/A'}</div>
                          <div>{reg.students?.phone || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            reg.status === 'attended' ? 'bg-success/20 text-success border-success/30' :
                            reg.status === 'cancelled' ? 'bg-danger/20 text-danger border-danger/30' :
                            'bg-warning/20 text-warning border-warning/30'
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => toggleStatus(reg.id, reg.status)}
                            className="text-xs border border-white/10 text-white/80 hover:border-gold/30 hover:text-gold px-2.5 py-1 rounded transition-all"
                          >
                            Toggle Attendance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
