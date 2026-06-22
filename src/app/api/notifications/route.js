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
    const { data: profile } = await supabase
      .from('users')
      .select('id, office_id, role')
      .eq('id', user.id)
      .single();

    // 3. Query Notifications (Super admins see all, regular staff see their own or office notifications)
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
    
    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile?.role);
    if (!isSuperAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });

  } catch (error) {
    console.error('[API Notifications GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_id } = body;

    // 2. Mark specific notification or all notifications for user as read
    let updateQuery = supabase.from('notifications').update({
      is_read: true,
      read_at: new Date().toISOString()
    });

    if (notification_id) {
      updateQuery = updateQuery.eq('id', notification_id).eq('user_id', user.id);
    } else {
      updateQuery = updateQuery.eq('user_id', user.id).eq('is_read', false);
    }

    const { data, error } = await updateQuery.select();
    if (error) throw error;

    return NextResponse.json({ success: true, count: data?.length || 0 }, { status: 200 });

  } catch (error) {
    console.error('[API Notifications PUT Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
