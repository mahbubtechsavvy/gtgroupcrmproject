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

export async function PATCH(req, { params }) {
  const { id } = params;
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

  const { data, error } = await supabase
    .from('office_social_accounts')
    .update({ 
      office_id, 
      platform, 
      account_name, 
      page_url, 
      mgmt_url, 
      notes, 
      is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction(supabase, user.id, 'edit_account', id, data.office_id, req);

  return NextResponse.json(data);
}

export async function DELETE(req, { params }) {
  const { id } = params;
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

  // Get office_id before deleting for audit log
  const { data: account } = await supabase.from('office_social_accounts').select('office_id').eq('id', id).single();

  const { error } = await supabase
    .from('office_social_accounts')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction(supabase, user.id, 'delete_account', id, account?.office_id, req);

  return NextResponse.json({ success: true });
}
