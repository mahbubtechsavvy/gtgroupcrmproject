import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/chat/groups/[id]/messages?limit=50&offset=0
 * Fetch messages in a group (cursor-based pagination)
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

    // Get group info
    const { data: group, error: groupError } = await supabase
      .from('chat_groups')
      .select('id, is_general, is_private')
      .eq('id', id)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check user is member or auto-join if general group
    let { data: member, error: memberError } = await supabase
      .from('chat_group_members')
      .select('id')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      // Auto-join to general groups
      if (group.is_general) {
        const { data: newMember, error: joinError } = await supabase
          .from('chat_group_members')
          .insert({
            group_id: id,
            user_id: user.id,
            role: 'member',
          })
          .select('id')
          .single();

        if (joinError) {
          return NextResponse.json({ error: 'Failed to join group' }, { status: 400 });
        }
        member = newMember;
      } else {
        return NextResponse.json({ error: 'Forbidden: Not a group member' }, { status: 403 });
      }
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(
        `*, 
         user:users(id, full_name, avatar_url, role),
         attachments:chat_attachments(id, public_url, file_name, file_type, file_size),
         reactions:chat_reactions(id, emoji, user_id),
         read_by:chat_message_reads(user_id),
         parent_message:chat_messages!reply_to_id(id, content, sender_id, user:users(full_name))
        `
      )
      .eq('group_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Group messages fetch error:', error);
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
    console.error('GET /api/chat/groups/[id]/messages error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/chat/groups/[id]/messages
 * Send a message to a group
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
    const { content, parent_message_id = null, reply_to_id = null, attachment_ids = [] } = body;
    const trimmedContent = content?.trim() || '';

    if (!trimmedContent && attachment_ids.length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Get group info
    const { data: group, error: groupError } = await supabase
      .from('chat_groups')
      .select('id, is_general, is_private')
      .eq('id', id)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check user is member or auto-join if general group
    let { data: member, error: memberError } = await supabase
      .from('chat_group_members')
      .select('id')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      // Auto-join to general groups
      if (group.is_general) {
        const { data: newMember, error: joinError } = await supabase
          .from('chat_group_members')
          .insert({
            group_id: id,
            user_id: user.id,
            role: 'member',
          })
          .select('id')
          .single();

        if (joinError) {
          return NextResponse.json({ error: 'Failed to join group' }, { status: 400 });
        }
        member = newMember;
      } else {
        return NextResponse.json({ error: 'Forbidden: Not a group member' }, { status: 403 });
      }
    }

    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        group_id: id,
        sender_id: user.id,
        content: trimmedContent || '[File attachment]',
        message_type: attachment_ids.length > 0 ? 'file' : 'text',
        reply_to_id: reply_to_id || parent_message_id,
      })
      .select('*, user:users(id, full_name, avatar_url, role)')
      .single();

    if (error) {
      console.error('Group message create error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Link attachments if provided
    if (attachment_ids.length > 0) {
      await supabase
        .from('chat_attachments')
        .update({ message_id: message.id })
        .in('id', attachment_ids);
    }

    // Create read receipt for sender
    await supabase.from('chat_message_reads').insert({
      message_id: message.id,
      user_id: user.id,
    });

    // We don't manually create notifications here, we'll let a Postgres trigger handle it 
    // or handle it in realtime subscriptions to avoid creating N records for large groups.

    // Notify group members about the new message
    const { data: members, error: membersError } = await supabase
      .from('chat_group_members')
      .select('user_id')
      .eq('group_id', id)
      .neq('user_id', user.id);

    if (!membersError && members?.length > 0) {
      const notificationPayload = members.map((member) => ({
        recipient_id: member.user_id,
        sender_id: user.id,
        group_id: id,
        type: 'new_message',
        message_preview: trimmedContent || '[File attachment]',
        sender_name: user.user_metadata?.full_name || user.email || 'Someone',
        is_system: false,
        meta: { source: 'group_message', message_id: message.id },
      }));

      await supabase.from('chat_notifications').insert(notificationPayload);
    }

    // Update group timestamp
    await supabase
      .from('chat_groups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    // Log activity
    await supabase.from('interactions').insert({
      user_id: user.id,
      action: 'send_group_message',
      entity_type: 'chat_group',
      entity_id: id,
      metadata: { message_length: content.length, reply_to_id: reply_to_id || parent_message_id },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('POST /api/chat/groups/[id]/messages error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
