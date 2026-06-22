'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/layout/AppLayout';
import { toast } from 'react-hot-toast';

export default function EventsPage() {
  const user = useUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'event',
    start_date: '',
    end_date: '',
    location: '',
    is_online: false,
    meeting_link: '',
    max_capacity: '',
    registration_deadline: '',
    is_exclusive: false,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title || !formData.start_date) {
      toast.error('Title and Start Date are required');
      return;
    }

    try {
      const newEvent = {
        office_id: user?.office_id,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        location: formData.location || '',
        is_online: formData.is_online,
        meeting_link: formData.is_online ? (formData.meeting_link || `https://meet.google.com/gtg-${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}`) : '',
        max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
        registration_deadline: formData.registration_deadline || null,
        is_exclusive: formData.is_exclusive,
        created_by: user?.id
      };

      const { data, error } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();

      if (error) throw error;

      toast.success('Event created successfully');
      setIsModalOpen(false);
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'event',
        start_date: '',
        end_date: '',
        location: '',
        is_online: false,
        meeting_link: '',
        max_capacity: '',
        registration_deadline: '',
        is_exclusive: false,
      });
      fetchEvents();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create event');
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-gold">📅</span> Events & Expo Module
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Manage agency webinars, expos, student recruitment events, and online consultations.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 self-start md:self-auto shadow-md hover:scale-105"
        >
          <span>＋</span> Create Event
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-surface-2 border border-white/5 rounded-xl p-12 text-center">
          <p className="text-white/50">No events found. Click "Create Event" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-surface-2 border border-white/5 rounded-xl p-6 flex flex-col justify-between hover:border-gold/30 hover:-translate-y-1 transition-all duration-300 shadow-lg"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase ${
                    event.type === 'expo' ? 'bg-gold/20 text-gold border border-gold/30' :
                    event.type === 'webinar' ? 'bg-info/20 text-info border border-info/30' :
                    event.type === 'seminar' ? 'bg-purple/25 text-purple border border-purple/35' :
                    'bg-success/20 text-success border border-success/30'
                  }`}>
                    {event.type}
                  </span>
                  {event.is_exclusive && (
                    <span className="bg-danger/25 text-danger border border-danger/35 px-2.5 py-1 rounded text-xs font-semibold">
                      EXCLUSIVE
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-display text-xl font-bold text-white leading-tight line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-white/60 text-xs line-clamp-3">
                    {event.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-white/50">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{new Date(event.start_date).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{event.is_online ? 'Online Event' : (event.location || 'No location set')}</span>
                  </div>
                  {event.max_capacity && (
                    <div className="flex items-center gap-2">
                      <span>👥</span>
                      <span>Capacity: {event.max_capacity} seats max</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <Link
                  href={`/events/${event.id}`}
                  className="w-full text-center block bg-white/5 hover:bg-gold/10 border border-white/10 hover:border-gold/30 text-white font-medium py-2 rounded-lg transition-all text-sm"
                >
                  View Registrations & Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-surface-2 border border-gold/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 animate-slide-up">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="font-display text-xl font-bold text-white">Create New Event</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/60 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-white/70 text-xs font-semibold">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Global Study Abroad Expo 2026"
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-white/70 text-xs font-semibold">Event Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                  >
                    <option value="event">General Event</option>
                    <option value="expo">Expo / Fair</option>
                    <option value="webinar">Webinar</option>
                    <option value="seminar">Seminar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-white/70 text-xs font-semibold">Max Capacity</label>
                  <input
                    type="number"
                    value={formData.max_capacity}
                    onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                    placeholder="e.g., 200"
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-white/70 text-xs font-semibold">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-white/70 text-xs font-semibold">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-white/70 text-xs font-semibold">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    value={formData.registration_deadline}
                    onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                  />
                </div>

                <div className="flex items-center gap-6 mt-4">
                  <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_online}
                      onChange={(e) => setFormData({ ...formData, is_online: e.target.checked })}
                      className="accent-gold h-4 w-4 rounded"
                    />
                    Is Online Event
                  </label>

                  <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_exclusive}
                      onChange={(e) => setFormData({ ...formData, is_exclusive: e.target.checked })}
                      className="accent-gold h-4 w-4 rounded"
                    />
                    Exclusive for Premium
                  </label>
                </div>

                {!formData.is_online ? (
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-white/70 text-xs font-semibold">Venue Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Grand Ballroom, Westin Hotel, Dhaka"
                      className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-sm"
                    />
                  </div>
                ) : (
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-white/70 text-xs font-semibold">Meeting Link (Leave empty to auto-generate)</label>
                    <input
                      type="url"
                      value={formData.meeting_link}
                      onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                      placeholder="e.g., https://meet.google.com/abc-defg-hij"
                      className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1 md:col-span-2">
                  <label className="text-white/70 text-xs font-semibold">Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Join us to speak directly with admission officers from 15 top Korean Universities..."
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-sm"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="border border-white/10 text-white/70 hover:bg-white/5 px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
