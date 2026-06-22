import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id: eventId } = await params;
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

    // 3. Verify event exists and belongs to office (or super admin)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('office_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);
    if (!isSuperAdmin && event.office_id !== profile.office_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 4. Fetch registrations joined with student details
    const { data: registrations, error: regError } = await supabase
      .from('event_registrations')
      .select(`
        *,
        students (
          id,
          full_name,
          email,
          phone,
          passport_number,
          counselor_id
        ),
        users:registered_by (
          full_name
        )
      `)
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (regError) throw regError;

    return NextResponse.json(registrations, { status: 200 });

  } catch (error) {
    console.error('[Event Registrations GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id: eventId } = await params;
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

    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    // 3. Verify event and check capacity
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, office_id, max_capacity, title')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);
    if (!isSuperAdmin && event.office_id !== profile.office_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify student exists and has same office_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('office_id, full_name')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!isSuperAdmin && student.office_id !== profile.office_id) {
      return NextResponse.json({ error: 'Access denied to student record' }, { status: 403 });
    }

    // Check if already registered
    const { data: existingReg } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingReg) {
      return NextResponse.json({ error: 'Student is already registered for this event' }, { status: 400 });
    }

    // Check max capacity
    if (event.max_capacity) {
      const { count, error: countError } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      if (countError) throw countError;

      if (count >= event.max_capacity) {
        return NextResponse.json({ error: 'Event registration is full (capacity limit reached)' }, { status: 400 });
      }
    }

    // 4. Register student
    const shortEventId = eventId.substring(0, 4).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `GT-EVT-${shortEventId}-${randomSuffix}`;

    const newReg = {
      office_id: event.office_id,
      event_id: eventId,
      student_id: studentId,
      registered_by: user.id,
      ticket_number: ticketNumber,
      status: 'registered'
    };

    const { data: dbData, error: dbError } = await supabase
      .from('event_registrations')
      .insert(newReg)
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json(dbData, { status: 201 });

  } catch (error) {
    console.error('[Event Registration POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id: eventId } = await params;
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

    // 3. Parse updates
    const body = await request.json();
    const { registrationId, status } = body;

    if (!registrationId || !status) {
      return NextResponse.json({ error: 'registrationId and status are required' }, { status: 400 });
    }

    // Check existing registration
    const { data: reg, error: regError } = await supabase
      .from('event_registrations')
      .select('office_id')
      .eq('id', registrationId)
      .eq('event_id', eventId)
      .single();

    if (regError || !reg) {
      return NextResponse.json({ error: 'Registration not found for this event' }, { status: 404 });
    }

    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);
    if (!isSuperAdmin && reg.office_id !== profile.office_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update status
    const { data: updatedReg, error: updateError } = await supabase
      .from('event_registrations')
      .update({ status })
      .eq('id', registrationId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedReg, { status: 200 });

  } catch (error) {
    console.error('[Event Registration PUT Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
