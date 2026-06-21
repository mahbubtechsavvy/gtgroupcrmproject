'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Plus, Edit, Trash2, Calendar, Zap, Video, Search, Clock, MapPin, ExternalLink } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [form, setForm] = useState({
    title: '', description: '', event_date: '', event_time: '', location: '', event_type: 'Webinar', is_virtual: false, registration_link: ''
  });

  const [websiteType, setWebsiteType] = useState('study-abroad');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type) setWebsiteType(type);
    fetchEvents(type || 'study-abroad');
  }, []);

  const fetchEvents = async (type = websiteType) => {
    const supabase = getSupabaseClient();
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('website_type', type)
        .order('event_date', { ascending: false });
      setEvents(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    const payload = { ...form, website_type: websiteType };
    if (editItem) {
      await supabase.from('events').update(payload).eq('id', editItem.id);
    } else {
      await supabase.from('events').insert([payload]);
    }
    setShowForm(false);
    setEditItem(null);
    fetchEvents();
  };

  const deleteEvent = async (id) => {
    if (!confirm('Delete event?')) return;
    const supabase = getSupabaseClient();
    await supabase.from('events').delete().eq('id', id);
    fetchEvents();
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || e.event_type === typeFilter;
    
    const eventDate = new Date(e.event_date);
    const now = new Date();
    const matchesTime = timeFilter === 'all' || 
                       (timeFilter === 'upcoming' ? eventDate >= now : eventDate < now);
                       
    return matchesSearch && matchesType && matchesTime;
  });

  if (loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="page-content space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Calendar className="text-gold" />
            Global Events & Fairs
          </h1>
          <p className="page-subtitle">Coordinate education fairs, digital webinars, and student outreach workshops</p>
        </div>
        <button 
          onClick={() => { setForm({ title: '', description: '', event_date: '', event_time: '', location: '', event_type: 'Webinar', is_virtual: false, registration_link: '' }); setEditItem(null); setShowForm(true); }}
          className="btn btn-primary btn-lg shadow-gold"
        >
          <Plus size={20} /> Schedule New Event
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold/10 text-gold"><Calendar size={24} /></div>
          <div className="kpi-value">{events.length}</div>
          <div className="kpi-label">Total Events</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-emerald-500/10 text-emerald-500"><Zap size={24} /></div>
          <div className="kpi-value">{events.filter(e => new Date(e.event_date) >= new Date()).length}</div>
          <div className="kpi-label">Upcoming Sessions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-500/10 text-blue-500"><Video size={24} /></div>
          <div className="kpi-value">{events.filter(e => e.is_virtual).length}</div>
          <div className="kpi-label">Virtual Webinars</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="search-filter-bar card glass p-4">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text"
            placeholder="Search events by name, city, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select w-44"
          >
            <option value="all">All Event Types</option>
            <option value="Webinar">Webinar</option>
            <option value="Education Fair">Education Fair</option>
            <option value="Workshop">Workshop</option>
          </select>
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value)}
            className="form-select w-40"
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past Events</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="table-wrapper card p-0 overflow-hidden border-border">
        <table className="data-table">
          <thead>
            <tr>
              <th>Event Information</th>
              <th>Schedule</th>
              <th>Mode & Venue</th>
              <th>Engagement</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((ev) => {
              const isUpcoming = new Date(ev.event_date) >= new Date();
              return (
                <tr key={ev.id}>
                  <td>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border ${isUpcoming ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-surface-2 border-border text-text-dim'}`}>
                        <span className="text-[10px] font-bold uppercase">{new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-lg font-black leading-none">{new Date(ev.event_date).getDate()}</span>
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-gold transition-colors">{ev.title}</div>
                        <div className="text-[10px] font-mono text-text-dim mt-1">{ev.event_type}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Clock size={12} className="text-gold" /> {ev.event_time || 'TBA'}
                      </span>
                      <span className="text-[10px] text-text-dim mt-1">Local Standard Time</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        {ev.is_virtual ? <Video size={12} className="text-emerald-500" /> : <MapPin size={12} className="text-blue-500" />}
                        {ev.is_virtual ? 'Virtual / Online' : ev.location}
                      </span>
                      {ev.registration_link && (
                        <a href={ev.registration_link} target="_blank" className="text-[10px] text-gold hover:underline mt-1 flex items-center gap-1">
                          Registration Link <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    {isUpcoming ? (
                      <span className="badge badge-success">Enrolling</span>
                    ) : (
                      <span className="badge badge-muted">Completed</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => { setEditItem(ev); setForm(ev); setShowForm(true); }} 
                        className="btn btn-secondary btn-sm"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => deleteEvent(ev.id)} 
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredEvents.length === 0 && (
          <div className="empty-state">
            <Calendar size={48} className="text-text-dim" />
            <h3>No Scheduled Events</h3>
            <p>Your calendar is clear. Schedule a webinar or fair to engage with students.</p>
          </div>
        )}
      </div>

      {/* Premium Event Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editItem ? 'Reschedule Event' : 'New Event Planning'}</h2>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest">Global Outreach & Seminar Console</p>
              </div>
              <button onClick={() => setShowForm(false)} className="modal-close">
                <Plus className="rotate-45" size={28} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-body space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">Event Headline</label>
                    <input 
                      required 
                      className="form-input" 
                      value={form.title} 
                      onChange={e => setForm({...form, title: e.target.value})} 
                      placeholder="e.g. UK University Direct Admission Fair 2024"
                    />
                  </div>

                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">Event Date</label>
                      <input type="date" required className="form-input" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Start Time</label>
                      <input type="time" className="form-input" value={form.event_time} onChange={e => setForm({...form, event_time: e.target.value})} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Classification</label>
                    <select className="form-select" value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})}>
                      <option value="Webinar">Digital Webinar</option>
                      <option value="Education Fair">Education Fair</option>
                      <option value="Workshop">Skills Workshop</option>
                      <option value="Seminar">Institutional Seminar</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="card glass p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gold uppercase tracking-widest">Venue Configuration</label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <span className="text-xs text-text-muted">Virtual Event</span>
                        <input type="checkbox" className="w-5 h-5 accent-gold" checked={form.is_virtual} onChange={e => setForm({...form, is_virtual: e.target.checked})} />
                      </label>
                    </div>
                    {!form.is_virtual && (
                      <div className="form-group">
                        <input className="form-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Grand Ballroom, Pan Pacific Dhaka" />
                      </div>
                    )}
                    {form.is_virtual && (
                      <div className="p-3 rounded-lg bg-surface-2 border border-border text-[10px] text-emerald-500 uppercase font-bold tracking-widest text-center">
                        Streaming / Online Platform Enabled
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Registration / External Link</label>
                    <input type="url" className="form-input" value={form.registration_link} onChange={e => setForm({...form, registration_link: e.target.value})} placeholder="https://zoom.us/j/..." />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Brief Agenda</label>
                    <textarea className="form-textarea" rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Summary of what students can expect..." />
                  </div>
                </div>
              </div>
            </form>

            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-lg">Discard</button>
              <button onClick={handleSave} className="btn btn-primary btn-lg shadow-gold min-w-[200px]">
                {editItem ? 'Update Schedule' : 'Confirm Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
