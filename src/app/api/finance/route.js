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

    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);

    // 3. Query Transactions
    let transQuery = supabase
      .from('financial_transactions')
      .select(`
        *,
        students(full_name),
        users!financial_transactions_recorded_by_fkey(full_name)
      `)
      .order('payment_date', { ascending: false });

    // 4. Query Commissions
    let commQuery = supabase
      .from('commissions')
      .select(`
        *,
        students(full_name),
        universities(name)
      `)
      .order('created_at', { ascending: false });

    // Apply office filters
    if (!isSuperAdmin) {
      transQuery = transQuery.eq('office_id', profile.office_id);
      commQuery = commQuery.eq('office_id', profile.office_id);
    }

    const { data: transactions, error: transErr } = await transQuery;
    if (transErr) throw transErr;

    const { data: commissions, error: commErr } = await commQuery;
    if (commErr) throw commErr;

    return NextResponse.json({ transactions, commissions }, { status: 200 });

  } catch (error) {
    console.error('[API Finance GET Error]', error);
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
    const { student_id, type, category, amount, currency, payment_date, payment_method, reference_number, description, receipt_url } = body;

    if (!type || !category || !amount || !payment_date) {
      return NextResponse.json({ error: 'type, category, amount, and payment_date are required' }, { status: 400 });
    }

    // Convert currencies if needed (mocked/simple or 1-to-1)
    const floatAmount = parseFloat(amount);
    const amountInUsd = currency === 'USD' ? floatAmount : floatAmount * 0.009; // BDT to USD mock

    // 4. Construct record
    const newTransaction = {
      office_id: profile.office_id,
      student_id: student_id || null,
      type,
      category,
      amount: floatAmount,
      currency: currency || 'USD',
      exchange_rate: currency === 'USD' ? 1 : 110,
      amount_in_usd: amountInUsd,
      payment_date,
      payment_method: payment_method || 'other',
      reference_number: reference_number || '',
      description: description || '',
      receipt_url: receipt_url || '',
      recorded_by: user.id
    };

    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(newTransaction)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    console.error('[API Finance POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
