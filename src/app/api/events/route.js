import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('event_type');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    let query = supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (fromDate) {
      query = query.gte('start_date', fromDate);
    }

    if (toDate) {
      query = query.lte('end_date', toDate);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Events fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(events || []);
  } catch (error) {
    console.error('GET /api/events error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      event_type,
      start_date,
      end_date,
      is_all_day,
      location,
      attendees,
      tags,
      meet_link
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!start_date) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        title,
        description: description || null,
        event_type: event_type || 'meeting',
        start_date,
        end_date: end_date || start_date,
        is_all_day: is_all_day || false,
        location: location || null,
        attendees: attendees || [],
        tags: tags || [],
        meet_link: meet_link || null,
        created_by: session.user.id
      })
      .select('*')
      .single();

    if (error) {
      console.error('Event create error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('POST /api/events error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
