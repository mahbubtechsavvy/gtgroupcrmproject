import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const officeId = searchParams.get('officeId');

    let query = supabase
      .from('contact_network')
      .select('*, offices(name)');

    if (officeId) query = query.eq('office_id', officeId);

    const { data: contacts, error } = await query.order('full_name', { ascending: true });

    if (error) throw error;
    return new Response(JSON.stringify(contacts), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const payload = {
      ...body,
      office_id: body.office_id || null,
      created_by: body.created_by || null,
    };
    const query = payload.id
      ? supabase.from('contact_network').upsert(payload)
      : supabase.from('contact_network').insert(payload);

    const { data, error } = await query
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
