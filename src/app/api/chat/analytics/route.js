import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only allow admins to see analytics
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['ceo', 'coo', 'it_manager'].includes(profile?.role);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // 1. Get message volume (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString();

    const [groupMessages, directMessages, totalGroups, totalUsers, attachments] = await Promise.all([
      supabase.from('chat_messages').select('created_at', { count: 'exact' }).gte('created_at', dateStr),
      supabase.from('chat_direct_messages').select('created_at', { count: 'exact' }).gte('created_at', dateStr),
      supabase.from('chat_groups').select('id', { count: 'exact' }),
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('chat_attachments').select('file_size')
    ]);

    // 2. Process message counts per day
    const dailyStats = {};
    
    // Group messages
    groupMessages.data?.forEach(m => {
      const day = new Date(m.created_at).toISOString().split('T')[0];
      dailyStats[day] = (dailyStats[day] || 0) + 1;
    });

    // Direct messages
    directMessages.data?.forEach(m => {
      const day = new Date(m.created_at).toISOString().split('T')[0];
      dailyStats[day] = (dailyStats[day] || 0) + 1;
    });

    // 3. Storage stats
    const totalStorage = attachments.data?.reduce((sum, a) => sum + (a.file_size || 0), 0) || 0;

    return NextResponse.json({
      summary: {
        totalMessages30d: (groupMessages.count || 0) + (directMessages.count || 0),
        totalGroups: totalGroups.count || 0,
        totalUsers: totalUsers.count || 0,
        storageUsedBytes: totalStorage
      },
      dailyActivity: Object.entries(dailyStats).sort().map(([date, count]) => ({ date, count }))
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
