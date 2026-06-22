import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient();

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

    // 3. Query Active Subscription
    const { data: subscription, error: subError } = await supabase
      .from('tenant_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('office_id', profile.office_id)
      .eq('status', 'active')
      .maybeSingle();

    if (subError) throw subError;

    // 4. Query All Available Plans (for tier selection)
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true);

    if (plansError) throw plansError;

    return NextResponse.json({ subscription, plans }, { status: 200 });

  } catch (error) {
    console.error('[API Billing GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, office_id, role')
      .eq('id', user.id)
      .single();

    // 3. Parse request body
    const body = await request.json();
    const { plan_id, payment_reference } = body;

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
    }

    // 4. Update or Insert active subscription
    // Expire old active subscriptions
    await supabase
      .from('tenant_subscriptions')
      .update({ status: 'expired' })
      .eq('office_id', profile.office_id)
      .eq('status', 'active');

    // Insert new subscription
    const nextExpiry = new Date();
    nextExpiry.setMonth(nextExpiry.getMonth() + 4); // 4 months standard billing period

    const newSub = {
      office_id: profile.office_id,
      plan_id,
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: nextExpiry.toISOString(),
      payment_reference: payment_reference || `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`,
      student_count: 0
    };

    const { data, error } = await supabase
      .from('tenant_subscriptions')
      .insert(newSub)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    console.error('[API Billing POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
