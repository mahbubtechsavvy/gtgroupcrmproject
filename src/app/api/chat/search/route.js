import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const channelId = searchParams.get('channelId');
  const type = searchParams.get('type'); // 'group' | 'dm' | 'all'
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 });
  }

  try {
    const results = { groupMessages: [], dmMessages: [] };

    // Search group messages
    if (type !== 'dm') {
      let groupQuery = supabase
        .from('chat_messages')
        .select(`
          id, content, created_at, group_id, sender_id, is_deleted,
          sender:users(id, full_name, avatar_url),
          group:chat_groups(id, name)
        `)
        .ilike('content', `%${query}%`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (channelId && type === 'group') {
        groupQuery = groupQuery.eq('group_id', channelId);
      }

      const { data: groupMsgs, error: grpErr } = await groupQuery;
      if (!grpErr) results.groupMessages = groupMsgs || [];
    }

    // Search DM messages
    if (type !== 'group') {
      let dmQuery = supabase
        .from('chat_direct_messages')
        .select(`
          id, content, created_at, conversation_id, sender_id, is_deleted,
          sender:users(id, full_name, avatar_url)
        `)
        .ilike('content', `%${query}%`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (channelId && type === 'dm') {
        dmQuery = dmQuery.eq('conversation_id', channelId);
      }

      const { data: dmMsgs, error: dmErr } = await dmQuery;
      if (!dmErr) results.dmMessages = dmMsgs || [];
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
