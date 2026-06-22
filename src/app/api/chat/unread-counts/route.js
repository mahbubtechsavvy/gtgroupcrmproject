import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get unread counts for Groups
    // We count messages in chat_messages where message_id is NOT in chat_message_reads for this user
    // And group_id is in groups the user is a member of
    const { data: groupUnreads, error: groupError } = await supabase
      .rpc('get_unread_group_counts', { p_user_id: user.id });

    if (groupError) throw groupError;

    // 2. Get unread counts for DMs
    const { data: dmUnreads, error: dmError } = await supabase
      .rpc('get_unread_dm_counts', { p_user_id: user.id });

    if (dmError) throw dmError;

    return NextResponse.json({
      groups: groupUnreads || {},
      dms: dmUnreads || {}
    });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
