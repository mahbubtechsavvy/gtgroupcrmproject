import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// PATCH /api/chat/messages/:id - Edit a message
export async function PATCH(request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { messageId, type, content } = await request.json();
  if (!messageId || !content?.trim()) {
    return NextResponse.json({ error: 'messageId and content are required' }, { status: 400 });
  }

  const table = type === 'dm' ? 'chat_direct_messages' : 'chat_messages';
  const senderKey = 'sender_id';

  // Verify ownership
  const { data: msg } = await supabase
    .from(table)
    .select('sender_id')
    .eq('id', messageId)
    .single();

  if (!msg || msg.sender_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from(table)
    .update({ content: content.trim(), is_edited: true, edited_at: new Date().toISOString() })
    .eq('id', messageId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE /api/chat/messages/:id - Soft delete a message
export async function DELETE(request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('messageId');
  const type = searchParams.get('type');

  if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 });

  const table = type === 'dm' ? 'chat_direct_messages' : 'chat_messages';

  // Verify ownership or super admin
  const { data: msg } = await supabase.from(table).select('sender_id').eq('id', messageId).single();
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  const isAdmin = ['ceo', 'coo', 'it_manager'].includes(profile?.role);

  if (!msg || (msg.sender_id !== user.id && !isAdmin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from(table)
    .update({ is_deleted: true, content: '[Message deleted]' })
    .eq('id', messageId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
