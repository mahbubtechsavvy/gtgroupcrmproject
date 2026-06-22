import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = createServerSupabaseClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, office_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // 3. Build query with joins
    let query = supabase
      .from('university_applications')
      .select(`
        *,
        students(full_name, email),
        universities(name, country),
        programs(name)
      `)
      .order('created_at', { ascending: false });

    // 4. Respect office boundaries (only CEO, COO, IT Manager bypass)
    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);
    if (!isSuperAdmin) {
      query = query.eq('office_id', profile.office_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });

  } catch (error) {
    console.error('[API Applications GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch profile
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
    const { student_id, university_id, program_id, intake_year, intake_month, notes } = body;

    if (!student_id || !university_id || !program_id) {
      return NextResponse.json({ error: 'student_id, university_id, and program_id are required' }, { status: 400 });
    }

    // 4. Construct record
    const newRecord = {
      student_id,
      university_id,
      program_id,
      office_id: profile.office_id,
      submitted_by: user.id,
      status: 'draft',
      intake_year: intake_year ? parseInt(intake_year) : null,
      intake_month: intake_month || '',
      notes: notes || '',
    };

    const { data, error } = await supabase
      .from('university_applications')
      .insert(newRecord)
      .select()
      .single();

    if (error) throw error;

    // Log status history (Initial transition: NULL -> draft)
    const historyRecord = {
      application_id: data.id,
      from_status: null,
      to_status: 'draft',
      changed_by: user.id,
      note: 'Initial application record created.'
    };
    await supabase.from('application_status_history').insert(historyRecord);

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    console.error('[API Applications POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
