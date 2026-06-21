import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only allow admins to broadcast
  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  const isAdmin = ['ceo', 'coo', 'it_manager'].includes(profile?.role);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { title, message, priority = 'normal' } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    // 1. Get all active users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('is_active', true);

    if (userError) throw userError;

    // 2. Create notifications for all users
    const notifications = users.map(u => ({
      recipient_id: u.id,
      sender_id: user.id,
      type: 'announcement',
      message_preview: `[${priority.toUpperCase()}] ${title}`,
      sender_name: profile.full_name,
      is_system: true,
      meta: { 
        title, 
        message, 
        priority,
        broadcast: true 
      }
    }));

    // Chunking to avoid large payload limits
    const CHUNK_SIZE = 100;
    for (let i = 0; i < notifications.length; i += CHUNK_SIZE) {
      const chunk = notifications.slice(i, i + CHUNK_SIZE);
      const { error: notifyError } = await supabase
        .from('chat_notifications')
        .insert(chunk);
      if (notifyError) throw notifyError;
    }

    return NextResponse.json({ success: true, count: users.length });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
