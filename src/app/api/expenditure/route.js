import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const officeId = searchParams.get('officeId');
    const planId = searchParams.get('planId');

    if (planId) {
      const { data: plan, error: rErr } = await supabase.from('expenditure_plans').select('*, offices(name)').eq('id', planId).single();
      const { data: items, error: iErr } = await supabase.from('expenditure_plan_items').select('*').eq('plan_id', planId);
      if (rErr || iErr) throw rErr || iErr;
      return new Response(JSON.stringify({ ...plan, items }), { status: 200 });
    }

    let query = supabase.from('expenditure_plans').select('*, offices(name)');
    if (officeId) query = query.eq('office_id', officeId);
    
    const { data: plans, error } = await query.order('plan_month', { ascending: false });
    if (error) throw error;
    return new Response(JSON.stringify(plans), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { mode, plan_data, items_data } = body;

    if (mode === 'create_plan') {
      const { data, error } = await supabase.from('expenditure_plans').insert(plan_data).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 200 });
    }

    if (mode === 'add_item') {
      const { data, error } = await supabase.from('expenditure_plan_items').insert(items_data).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 200 });
    }

    if (mode === 'update_status') {
      const { data, error } = await supabase.from('expenditure_plans').update({ status: body.status }).eq('id', body.plan_id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Invalid mode' }), { status: 400 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
