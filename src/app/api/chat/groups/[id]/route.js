import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/chat/groups/[id]
 * Fetch a specific group with members
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: group, error } = await supabase
      .from('chat_groups')
      .select('*, members:chat_group_members(user_id, role, joined_at, user:users(id, full_name, avatar_url))')
      .eq('id', id)
      .single();

    if (error || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('GET /api/chat/groups/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/chat/groups/[id]
 * Update group details (admin-gated)
 */
export async function PUT(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const allowedRoles = ['ceo', 'coo', 'it_manager'];
    if (!allowedRoles.includes(userData?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, group_type } = body;

    const { data: group, error } = await supabase
      .from('chat_groups')
      .update({ name, description, group_type, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log activity
    await supabase.from('interactions').insert({
      user_id: user.id,
      action: 'update_chat_group',
      entity_type: 'chat_group',
      entity_id: id,
      metadata: { changes: { name, description, group_type } },
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error('PUT /api/chat/groups/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/chat/groups/[id]
 * Delete a group (admin-gated)
 */
export async function DELETE(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const allowedRoles = ['ceo', 'coo', 'it_manager'];
    if (!allowedRoles.includes(userData?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('chat_groups')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log activity
    await supabase.from('interactions').insert({
      user_id: user.id,
      action: 'delete_chat_group',
      entity_type: 'chat_group',
      entity_id: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/chat/groups/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
