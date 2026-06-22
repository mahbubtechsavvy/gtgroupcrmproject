import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { channelId, type, isMuted } = await request.json();

    if (type === 'group') {
      const { error } = await supabase
        .from('chat_group_members')
        .update({ is_muted: isMuted })
        .eq('group_id', channelId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    } else if (type === 'dm') {
      const { data: conversation, error: fetchError } = await supabase
        .from('chat_conversations')
        .select('participant_a, participant_b')
        .eq('id', channelId)
        .single();
      
      if (fetchError) throw fetchError;

      const updateData = {};
      if (conversation.participant_a === user.id) {
        updateData.is_muted_a = isMuted;
      } else {
        updateData.is_muted_b = isMuted;
      }

      const { error } = await supabase
        .from('chat_conversations')
        .update(updateData)
        .eq('id', channelId);
      
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mute error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
