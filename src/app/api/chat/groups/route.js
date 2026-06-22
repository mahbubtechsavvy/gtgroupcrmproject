import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/chat/groups
 * Fetch all groups the current user is a member of (plus general groups)
 */
export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const { data: memberGroups, error: membershipError } = await supabase
      .from('chat_group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (membershipError) {
      console.error('Group membership fetch error:', membershipError);
      return NextResponse.json({ error: membershipError.message }, { status: 400 });
    }

    const groupIds = (memberGroups || []).map((row) => row.group_id);

    const groupSelect = 'id, name, description, is_general, group_type, office_id, country, avatar_url, is_private, max_members, created_at, members:chat_group_members(user_id)';

    const { data: userGroups, error: userGroupsError } = groupIds.length > 0
      ? await supabase
          .from('chat_groups')
          .select(groupSelect)
          .in('id', groupIds)
      : { data: [], error: null };

    if (userGroupsError) {
      console.error('User groups fetch error:', userGroupsError);
      return NextResponse.json({ error: userGroupsError.message }, { status: 400 });
    }

    const { data: generalGroups, error: generalError } = await supabase
      .from('chat_groups')
      .select(groupSelect)
      .eq('is_general', true);

    if (generalError) {
      console.error('General groups fetch error:', generalError);
      return NextResponse.json({ error: generalError.message }, { status: 400 });
    }

    const mergedGroups = [
      ...(userGroups || []),
      ...(generalGroups || []),
    ].reduce((acc, item) => {
      if (!acc.some((existing) => existing.id === item.id)) {
        acc.push({
          ...item,
          member_count: item.members?.length ?? 0,
        });
      }
      return acc;
    }, []);

    return NextResponse.json(mergedGroups);
  } catch (error) {
    console.error('GET /api/chat/groups error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/chat/groups
 * Create a new group
 */
export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, is_general, group_type, office_id, country, is_private, max_members } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const { data: group, error } = await supabase
      .from('chat_groups')
      .insert({
        name: name.trim(),
        description: description || '',
        is_general: is_general || false,
        group_type: group_type || 'custom',
        office_id,
        country,
        is_private: is_private !== undefined ? is_private : false,
        max_members: max_members || 250,
      })
      .select()
      .single();

    if (error) {
      console.error('Group create error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Add creator as member (admin)
    await supabase.from('chat_group_members').insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin'
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('POST /api/chat/groups error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
