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

    // 2. Fetch user profile & verify super admin role
    const { data: profile } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile?.role);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Access Denied: Super Admin Role Required' }, { status: 403 });
    }

    // 3. Fetch all subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('tenant_subscriptions')
      .select('*, offices(*), subscription_plans(*)');

    if (subError) throw subError;

    return NextResponse.json({ subscriptions }, { status: 200 });

  } catch (error) {
    console.error('[API Admin Tenants GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
