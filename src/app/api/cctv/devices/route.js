import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/cctv/encryption';
import { isSuperAdmin } from '@/lib/permissions';

export async function GET() {
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

  // Get user profile to check role
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!isSuperAdmin(profile?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('cctv_devices')
    .select('*, offices(name, city)')
    .order('office_id', { ascending: true })
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Strip password for security (even if encrypted, the client doesn't need it)
  const safeData = data.map(d => ({ ...d, password: '***' }));
  
  return NextResponse.json(safeData);
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
  const { office_id, name, ip_address, port, username, password, channel, subtype } = body;

  if (!office_id || !name || !ip_address || !username || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Get the next display_order for this office
  const { data: existing } = await supabase
    .from('cctv_devices')
    .select('display_order')
    .eq('office_id', office_id)
    .order('display_order', { ascending: false })
    .limit(1);
  
  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

  // Encrypt the password before storing
  const encryptedPassword = encrypt(password);

  const { data, error } = await supabase
    .from('cctv_devices')
    .insert([{
      office_id,
      name,
      ip_address,
      port: parseInt(port) || 554,
      username,
      password: encryptedPassword,
      channel: parseInt(channel) || 1,
      subtype: parseInt(subtype) || 1,
      display_order: nextOrder,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: 'Device added successfully', data });
}
