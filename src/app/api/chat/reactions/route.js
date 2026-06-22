import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { messageId, emoji, type, channelId } = await request.json();

    const insertData = {
      user_id: user.id,
      emoji: emoji
    };

    if (type === 'group') {
      insertData.message_id = messageId;
      insertData.group_id = channelId;
    } else {
      insertData.dm_message_id = messageId;
      insertData.conversation_id = channelId;
    }

    const { error } = await supabase
      .from('chat_reactions')
      .upsert(insertData, { onConflict: type === 'group' ? 'message_id,user_id,emoji' : 'dm_message_id,user_id,emoji' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reaction error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const emoji = searchParams.get('emoji');
    const type = searchParams.get('type');

    let query = supabase
      .from('chat_reactions')
      .delete()
      .eq('user_id', user.id)
      .eq('emoji', emoji);

    if (type === 'group') {
      query = query.eq('message_id', messageId);
    } else {
      query = query.eq('dm_message_id', messageId);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reaction delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
