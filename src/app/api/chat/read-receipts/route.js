import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { channelId, type } = await request.json();

    if (type === 'group') {
      // Mark all unread messages in group as read for this user
      // We insert into chat_message_reads for all messages in the group that the user hasn't read yet
      const { error } = await supabase.rpc('mark_group_messages_as_read', {
        p_group_id: channelId,
        p_user_id: user.id
      });
      if (error) throw error;
    } else {
      // Mark all unread DMs in conversation as read for this user
      const { error } = await supabase.rpc('mark_dm_messages_as_read', {
        p_conversation_id: channelId,
        p_user_id: user.id
      });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
