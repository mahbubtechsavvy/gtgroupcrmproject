import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/chat/groups/[id]/members
 * Fetch members of a group
 */
export async function GET(request, { params }) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const { data: members, error } = await supabase
      .from('chat_group_members')
      .select('user_id, role, joined_at, user:users(id, full_name, email, avatar_url, role)')
      .eq('group_id', id)
      .order('joined_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(members || []);
  } catch (error) {
    console.error('GET /api/chat/groups/[id]/members error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/chat/groups/[id]/members
 * Add a member to a group
 */
export async function POST(request, { params }) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { user_id, role = 'member' } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Verify group exists and get privacy settings
    const { data: group, error: groupError } = await supabase
      .from('chat_groups')
      .select('id, is_private')
      .eq('id', id)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // For private groups, only members can add new members
    if (group.is_private) {
      const { data: userMember } = await supabase
        .from('chat_group_members')
        .select('id')
        .eq('group_id', id)
        .eq('user_id', user.id)
        .single();

      if (!userMember) {
        return NextResponse.json(
          { error: 'Forbidden: You must be a member of this private group to add members' },
          { status: 403 }
        );
      }
    }

    // Check if user already member
    const { data: existing } = await supabase
      .from('chat_group_members')
      .select('id')
      .eq('group_id', id)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'User already member' }, { status: 409 });
    }

    // Verify target user exists
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: member, error } = await supabase
      .from('chat_group_members')
      .insert({
        group_id: id,
        user_id,
        role,
      })
      .select('*, user:users(id, full_name, email, avatar_url, role)')
      .single();

    if (error) {
      console.error('Member add error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('POST /api/chat/groups/[id]/members error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/chat/groups/[id]/members?user_id=UUID
 * Remove a member from a group
 */
export async function DELETE(request, { params }) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Cannot remove yourself, but we allow leaving
    if (userId === user.id) {
      return NextResponse.json({ error: 'Use the leave endpoint to leave a group' }, { status: 400 });
    }

    // Verify current user is a member of the group
    const { data: userMember } = await supabase
      .from('chat_group_members')
      .select('id')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .single();

    if (!userMember) {
      return NextResponse.json(
        { error: 'Forbidden: You must be a member of this group to remove members' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('chat_group_members')
      .delete()
      .eq('group_id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/chat/groups/[id]/members error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
