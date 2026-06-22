import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
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

    // 3. Fetch event
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('*, users(full_name)')
      .eq('id', id)
      .single();

    if (fetchError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // 4. Access check
    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);
    if (!isSuperAdmin && event.office_id !== profile.office_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(event, { status: 200 });

  } catch (error) {
    console.error('[Single Event GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
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

    // 3. Check existing event
    const { data: event, error: checkError } = await supabase
      .from('events')
      .select('office_id')
      .eq('id', id)
      .single();

    if (checkError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);
    if (!isSuperAdmin && event.office_id !== profile.office_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 4. Update
    const body = await request.json();
    const { title, description, type, start_date, end_date, location, is_online, meeting_link, max_capacity, registration_deadline, is_exclusive } = body;

    const updates = {
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
      is_exclusive: is_exclusive || false
    };

    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedEvent, { status: 200 });

  } catch (error) {
    console.error('[Single Event PUT Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
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

    // 3. Check existing event
    const { data: event, error: checkError } = await supabase
      .from('events')
      .select('office_id')
      .eq('id', id)
      .single();

    if (checkError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);
    if (!isSuperAdmin && event.office_id !== profile.office_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 4. Delete
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[Single Event DELETE Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
