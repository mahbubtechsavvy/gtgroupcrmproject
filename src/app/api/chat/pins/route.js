import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('channelId');
  const type = searchParams.get('type');

  if (!channelId || !type) {
    return NextResponse.json({ error: 'Missing channelId or type' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('chat_pinned_messages')
      .select(`
        *,
        message:chat_messages(*, sender:users(id, full_name, avatar_url)),
        dm_message:chat_direct_messages(*, sender:users(id, full_name, avatar_url))
      `);

    if (type === 'group') {
      query = query.eq('group_id', channelId);
    } else {
      query = query.eq('conversation_id', channelId);
    }

    const { data, error } = await query.order('pinned_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching pins:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { messageId, type, channelId, isPinned } = await request.json();

    if (isPinned) {
      // 1. Update the message table
      const messageTable = type === 'group' ? 'chat_messages' : 'chat_direct_messages';
      const { error: msgError } = await supabase
        .from(messageTable)
        .update({ is_pinned: true })
        .eq('id', messageId);

      if (msgError) throw msgError;

      // 2. Insert into pinned messages list
      const insertData = {
        message_id: type === 'group' ? messageId : null,
        dm_message_id: type === 'group' ? null : messageId,
        pinned_by: user.id
      };

      if (type === 'group') {
        insertData.group_id = channelId;
      } else {
        insertData.conversation_id = channelId;
      }

      const { error: pinError } = await supabase
        .from('chat_pinned_messages')
        .insert(insertData);

      if (pinError) throw pinError;
    } else {
      // 1. Update the message table
      const messageTable = type === 'group' ? 'chat_messages' : 'chat_direct_messages';
      const { error: msgError } = await supabase
        .from(messageTable)
        .update({ is_pinned: false })
        .eq('id', messageId);

      if (msgError) throw msgError;

      // 2. Remove from pinned messages list
      const deleteQuery = supabase
        .from('chat_pinned_messages')
        .delete();

      if (type === 'group') {
        deleteQuery.eq('message_id', messageId);
      } else {
        deleteQuery.eq('dm_message_id', messageId);
      }

      const { error: pinError } = await deleteQuery;
      if (pinError) throw pinError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pin error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
