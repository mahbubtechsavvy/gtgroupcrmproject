import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/chat/conversations/[id]/messages?limit=50&offset=0
 * Fetch messages in a DM conversation (cursor-based pagination)
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify user is part of conversation
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (
      conversation.participant_a !== user.id &&
      conversation.participant_b !== user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: messages, error } = await supabase
      .from('chat_direct_messages')
      .select(
        `id, content, sender_id, created_at, edited_at, 
         sender:sender_id(id, full_name, avatar_url),
         attachments:chat_attachments(id, public_url, file_name, file_type, file_size),
         reactions:chat_reactions(id, emoji, user_id),
         read_by:chat_message_reads(user_id),
         parent_message:chat_direct_messages!reply_to_id(id, content, sender_id, user:users(full_name))
        `
      )
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Messages fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const normalizedMessages = (messages || []).map((message) => ({
      ...message,
      attachments: (message.attachments || []).map((attachment) => ({
        ...attachment,
        file_url: attachment.public_url,
      })),
    }));

    return NextResponse.json(normalizedMessages);
  } catch (error) {
    console.error('GET /api/chat/conversations/[id]/messages error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/chat/conversations/[id]/messages
 * Send a DM
 */
export async function POST(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content, attachment_ids = [], reply_to_id = null } = body;
    const trimmedContent = content?.trim() || '';

    if (!trimmedContent && attachment_ids.length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Verify user is part of conversation
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (
      conversation.participant_a !== user.id &&
      conversation.participant_b !== user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: message, error } = await supabase
      .from('chat_direct_messages')
      .insert({
        conversation_id: id,
        sender_id: user.id,
        content: trimmedContent || '[File attachment]',
        message_type: attachment_ids.length > 0 ? 'file' : 'text',
        reply_to_id: reply_to_id
      })
      .select('*, sender:sender_id(id, full_name, avatar_url)')
      .single();

    if (error) {
      console.error('Message create error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Link attachments if provided
    if (attachment_ids.length > 0) {
      await supabase
        .from('chat_attachments')
        .update({ dm_message_id: message.id })
        .in('id', attachment_ids);
    }

    // Create read receipt for sender
    await supabase.from('chat_message_reads').insert({
      dm_message_id: message.id,
      user_id: user.id,
    });

    // Create notification for recipient
    const recipientId = conversation.participant_a === user.id
      ? conversation.participant_b
      : conversation.participant_a;

    await supabase.from('chat_notifications').insert({
      recipient_id: recipientId,
      sender_id: user.id,
      type: 'new_direct_message',
      message_preview: trimmedContent || '[File attachment]',
      sender_name: user.user_metadata?.full_name || user.email || 'Someone',
      is_system: false,
      meta: { source: 'dm' },
    });

    // Update conversation timestamp
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    // Log activity
    await supabase.from('interactions').insert({
      user_id: user.id,
      action: 'send_dm',
      entity_type: 'chat_conversation',
      entity_id: id,
      metadata: { message_length: content.length },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('POST /api/chat/conversations/[id]/messages error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
