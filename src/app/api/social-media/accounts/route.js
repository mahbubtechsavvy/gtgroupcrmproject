import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/permissions';

async function logAuditAction(supabase, userId, action, accountId = null, officeId = null, req) {
  const userAgent = req.headers.get('user-agent');
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  await supabase.from('social_audit_log').insert([{
    user_id: userId,
    action,
    account_id: accountId,
    office_id: officeId,
    ip_address: ip,
    user_agent: userAgent
  }]);
}

export async function GET(req) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role, office_id').eq('id', user.id).single();
  const isAdmin = isSuperAdmin(profile?.role);

  let query = supabase.from('office_social_accounts')
    .select('*, offices(name)')
    .order('office_id', { ascending: true })
    .order('display_order', { ascending: true });

  if (!isAdmin) {
    query = query.eq('office_id', profile.office_id).eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log for viewing accounts
  await logAuditAction(supabase, user.id, 'view_accounts', null, profile.office_id, req);

  return NextResponse.json(data);
}

export async function POST(req) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!isSuperAdmin(profile?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await req.json();
  const { office_id, platform, account_name, page_url, mgmt_url, notes, is_active } = body;

  if (!office_id || !platform || !account_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Get next display order
  const { data: existing } = await supabase
    .from('office_social_accounts')
    .select('display_order')
    .eq('office_id', office_id)
    .order('display_order', { ascending: false })
    .limit(1);
  
  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('office_social_accounts')
    .insert([{
      office_id,
      platform,
      account_name,
      page_url,
      mgmt_url,
      notes,
      is_active: is_active ?? true,
      display_order: nextOrder,
      added_by: user.id
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction(supabase, user.id, 'add_account', data.id, office_id, req);

  return NextResponse.json(data);
}
