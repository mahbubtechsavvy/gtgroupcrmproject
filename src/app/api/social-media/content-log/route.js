import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/permissions';

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

  let query = supabase.from('social_content_log')
    .select('*, offices(name), users(full_name)')
    .order('posted_at', { ascending: false });

  if (!isAdmin) {
    query = query.eq('office_id', profile.office_id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
  const { office_id, platform, media_type, post_description, post_url, posted_at } = body;

  if (!office_id || !platform || !post_description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('social_content_log')
    .insert([{
      office_id,
      platform,
      media_type,
      post_description,
      post_url,
      posted_at: posted_at || new Date().toISOString(),
      logged_by: user.id
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
