import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const officeId = searchParams.get('officeId');
    const reportId = searchParams.get('reportId');

    if (reportId) {
      // Get single report with all its items
      const { data: report, error: rErr } = await supabase.from('expense_reports').select('*, offices(name)').eq('id', reportId).single();
      const { data: items, error: iErr } = await supabase.from('expense_items').select('*, fund_user_user:users!expense_items_fund_user_fkey(full_name, employee_id)').eq('report_id', reportId).order('item_date', { ascending: true });
      
      if (rErr || iErr) throw rErr || iErr;
      return new Response(JSON.stringify({ ...report, items }), { status: 200 });
    }

    // List reports
    let query = supabase.from('expense_reports').select('*, offices(name)');
    if (officeId) query = query.eq('office_id', officeId);
    
    const { data: reports, error } = await query.order('report_month', { ascending: false });
    if (error) throw error;
    return new Response(JSON.stringify(reports), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { mode, report_data, items_data } = body;

    if (mode === 'create_report') {
      const { data, error } = await supabase.from('expense_reports').insert(report_data).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 200 });
    }

    if (mode === 'add_item') {
      const { data, error } = await supabase.from('expense_items').insert(items_data).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 200 });
    }

    if (mode === 'submit_report') {
      const { data, error } = await supabase.from('expense_reports').update({ 
        status: 'submitted', 
        submitted_at: new Date().toISOString() 
      }).eq('id', body.report_id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 200 });
    }

    if (mode === 'approve_report') {
        const { data, error } = await supabase.from('expense_reports').update({ 
          status: body.status, // approved or rejected
          approved_by: body.admin_id,
          approved_at: new Date().toISOString()
        }).eq('id', body.report_id).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), { status: 200 });
      }

    return new Response(JSON.stringify({ error: 'Invalid mode' }), { status: 400 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
