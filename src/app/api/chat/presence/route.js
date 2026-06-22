import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/chat/presence?group_id=UUID or ?conversation_id=UUID
 * Get online status of users in a group or conversation
 */
export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('group_id');
    const conversationId = searchParams.get('conversation_id');

    if (!groupId && !conversationId) {
      return NextResponse.json(
        { error: 'Either group_id or conversation_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('chat_presence')
      .select('user_id, status, last_seen, user:users(id, full_name, avatar_url)');

    if (groupId) {
      query = query.eq('group_id', groupId);
    } else {
      query = query.eq('conversation_id', conversationId);
    }

    const { data: presence, error } = await query;

    if (error) {
      console.error('Presence fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(presence || []);
  } catch (error) {
    console.error('GET /api/chat/presence error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/chat/presence
 * Update user presence (online/away/offline)
 */
export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, group_id, conversation_id } = body; // status: 'online', 'away', 'offline'

    if (!status || !['online', 'away', 'offline'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
    }

    if (!group_id && !conversation_id) {
      return NextResponse.json(
        { error: 'Either group_id or conversation_id is required' },
        { status: 400 }
      );
    }

    const payload = {
      user_id: user.id,
      status,
      last_seen: new Date().toISOString(),
      group_id: group_id || null,
      conversation_id: conversation_id || null,
    };

    // Try to update existing presence record, insert if not found
    const { data: existing } = await supabase
      .from('chat_presence')
      .select('id')
      .eq('user_id', user.id)
      .eq(group_id ? 'group_id' : 'conversation_id', group_id || conversation_id)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('chat_presence')
        .update(payload)
        .eq('user_id', user.id)
        .eq(group_id ? 'group_id' : 'conversation_id', group_id || conversation_id)
        .select('*')
        .single();

      result = { data, error };
    } else {
      const { data, error } = await supabase
        .from('chat_presence')
        .insert(payload)
        .select('*')
        .single();

      result = { data, error };
    }

    if (result.error) {
      console.error('Presence update error:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('POST /api/chat/presence error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/chat/presence?group_id=UUID or ?conversation_id=UUID
 * Mark user as offline
 */
export async function DELETE(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('group_id');
    const conversationId = searchParams.get('conversation_id');

    if (!groupId && !conversationId) {
      return NextResponse.json(
        { error: 'Either group_id or conversation_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('chat_presence')
      .delete()
      .eq('user_id', user.id);

    if (groupId) {
      query = query.eq('group_id', groupId);
    } else {
      query = query.eq('conversation_id', conversationId);
    }

    const { error } = await query;

    if (error) {
      console.error('Presence delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/chat/presence error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
