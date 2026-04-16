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
      .from('inventory_items')
      .select('*, person_in_charge_user:users!inventory_items_person_in_charge_fkey(full_name, employee_id)');

    if (officeId) query = query.eq('office_id', officeId);

    const { data: inventory, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify(inventory), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('inventory_items')
      .upsert(body) // Handles both create and update
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
