import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * POST /api/chat/mentions
 * Process @mentions in a message and create notifications for mentioned users.
 * 
 * Body: {
 *   messageId: string,
 *   type: 'group' | 'dm',
 *   channelId: string,
 *   mentionedUserIds: string[],
 *   messagePreview: string
 * }
 */
export async function POST(request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { messageId, type, channelId, mentionedUserIds, messagePreview } = await request.json();

    if (!messageId || !mentionedUserIds?.length) {
      return NextResponse.json({ error: 'messageId and mentionedUserIds are required' }, { status: 400 });
    }

    // Get sender info
    const { data: senderProfile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const senderName = senderProfile?.full_name || user.email || 'Someone';

    // Update the message's mentions JSONB field
    const table = type === 'group' ? 'chat_messages' : 'chat_direct_messages';
    await supabase
      .from(table)
      .update({ mentions: mentionedUserIds })
      .eq('id', messageId);

    // Create notifications for each mentioned user (skip self-mentions)
    const notifications = mentionedUserIds
      .filter((uid) => uid !== user.id)
      .map((uid) => ({
        recipient_id: uid,
        sender_id: user.id,
        type: 'mention',
        message_preview: `@${senderName} mentioned you: "${(messagePreview || '').slice(0, 80)}"`,
        sender_name: senderName,
        is_system: false,
        group_id: type === 'group' ? channelId : null,
        conversation_id: type === 'dm' ? channelId : null,
        meta: {
          source: 'mention',
          message_id: messageId,
          channel_type: type,
          channel_id: channelId,
        },
      }));

    if (notifications.length > 0) {
      const { error: notifyError } = await supabase
        .from('chat_notifications')
        .insert(notifications);

      if (notifyError) {
        console.error('Mention notification insert error:', notifyError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      mentionedCount: notifications.length 
    });
  } catch (error) {
    console.error('POST /api/chat/mentions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
