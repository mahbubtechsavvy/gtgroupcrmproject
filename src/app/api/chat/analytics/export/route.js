import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/chat/analytics/export
 * Export chat logs as CSV for moderation and compliance.
 * Only accessible by admins (ceo, coo, it_manager).
 */
export async function GET(request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Admin Check
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['ceo', 'coo', 'it_manager'].includes(profile?.role);
  if (!isAdmin) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'group'; // 'group' or 'dm'
    const channelId = searchParams.get('channelId');
    const limit = parseInt(searchParams.get('limit') || '1000');

    let query;
    if (type === 'group') {
      query = supabase
        .from('chat_messages')
        .select('created_at, content, sender_id, sender:users(full_name), group:chat_groups(name)')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (channelId) query = query.eq('group_id', channelId);
    } else {
      query = supabase
        .from('chat_direct_messages')
        .select('created_at, content, sender_id, sender:users(full_name), conversation_id')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (channelId) query = query.eq('conversation_id', channelId);
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    // Convert to CSV
    const headers = ['Timestamp', 'Sender Name', 'Sender ID', 'Channel', 'Message Content'];
    const rows = (messages || []).map(m => [
      new Date(m.created_at).toLocaleString(),
      m.sender?.full_name || 'Unknown',
      m.sender_id,
      type === 'group' ? m.group?.name : m.conversation_id,
      // Escape quotes in content
      `"${(m.content || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    // Return as downloadable file
    const filename = `chat_export_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response('Export failed: ' + error.message, { status: 500 });
  }
}
