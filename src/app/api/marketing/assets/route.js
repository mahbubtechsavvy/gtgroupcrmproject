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

    // 2. Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, office_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // 3. Query marketing assets
    let query = supabase
      .from('marketing_assets')
      .select('*, users:created_by (full_name)')
      .order('created_at', { ascending: false });
    
    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);
    if (!isSuperAdmin) {
      query = query.eq('office_id', profile.office_id);
    }

    const { data: assets, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    return NextResponse.json(assets, { status: 200 });

  } catch (error) {
    console.error('[Marketing Assets GET Error]', error);
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
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, office_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // 3. Parse input
    const body = await request.json();
    const { title, type, content, file_url, tags = [], ai_generated = false } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'title and type are required' }, { status: 400 });
    }

    const newAsset = {
      office_id: profile.office_id,
      title,
      type,
      content: content || '',
      file_url: file_url || null,
      tags: tags || [],
      ai_generated,
      created_by: user.id
    };

    const { data: dbData, error: dbError } = await supabase
      .from('marketing_assets')
      .insert(newAsset)
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json(dbData, { status: 201 });

  } catch (error) {
    console.error('[Marketing Assets POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
