import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const officeId = searchParams.get('officeId');

    let query = supabase
      .from('visitor_log')
      .select('*, host_staff:users!visitor_log_host_staff_id_fkey(full_name, employee_id)');

    if (officeId) query = query.eq('office_id', officeId);

    const { data: visitors, error } = await query.order('check_in', { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify(visitors), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('visitor_log')
      .upsert(body)
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
