import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const officeId = searchParams.get('officeId');
    const staffId = searchParams.get('staffId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    let query = supabase
      .from('staff_attendance')
      .select('*, users!staff_attendance_staff_id_fkey(full_name, employee_id, role)')
      .eq('date', date);

    if (officeId) query = query.eq('office_id', officeId);
    if (staffId) query = query.eq('staff_id', staffId);

    const { data: attendance, error } = await query.order('check_in', { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify(attendance), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { staff_id, office_id, status, check_in, date, notes } = body;

    // Check if entry for today already exists
    const { data: existing } = await supabase
      .from('staff_attendance')
      .select('id')
      .eq('staff_id', staff_id)
      .eq('date', date)
      .single();

    let result;
    if (existing) {
      // Update check-out or notes
      const { data, error } = await supabase
        .from('staff_attendance')
        .update(body)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Create new check-in
      const { data, error } = await supabase
        .from('staff_attendance')
        .insert({
          staff_id,
          office_id,
          date,
          status: status || 'present',
          check_in,
          notes
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
