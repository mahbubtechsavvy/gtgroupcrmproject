import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, office_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // 3. Query events with office level security
    let query = supabase.from('events').select('*, users(full_name)').order('start_date', { ascending: true });
    
    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);
    if (!isSuperAdmin) {
      query = query.eq('office_id', profile.office_id);
    }

    const { data: events, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    return NextResponse.json(events, { status: 200 });

  } catch (error) {
    console.error('[Events GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, office_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // 3. Parse request body
    const body = await request.json();
    const { title, description, type, start_date, end_date, location, is_online, meeting_link, max_capacity, registration_deadline, is_exclusive } = body;

    if (!title || !type || !start_date) {
      return NextResponse.json({ error: 'title, type, and start_date are required' }, { status: 400 });
    }

    // 4. Construct event entry
    const newEvent = {
      office_id: profile.office_id,
      title,
      description,
      type,
      start_date,
      end_date: end_date || null,
      location: location || '',
      is_online: is_online || false,
      meeting_link: meeting_link || '',
      max_capacity: max_capacity ? parseInt(max_capacity) : null,
      registration_deadline: registration_deadline || null,
      is_exclusive: is_exclusive || false,
      created_by: user.id
    };

    const { data: dbData, error: dbError } = await supabase
      .from('events')
      .insert(newEvent)
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json(dbData, { status: 201 });

  } catch (error) {
    console.error('[Events POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
