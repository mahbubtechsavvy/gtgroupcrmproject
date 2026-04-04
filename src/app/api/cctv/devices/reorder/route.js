import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/permissions';

// POST /api/cctv/devices/reorder
// Body: { updates: [{ id: string, display_order: number }] }
export async function POST(req) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role for bulk update
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!isSuperAdmin(profile?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { updates } = await req.json();
  if (!updates || !Array.isArray(updates)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Bulk update each camera's display_order
  const promises = updates.map(({ id, display_order }) =>
    supabase
      .from('cctv_devices')
      .update({ display_order })
      .eq('id', id)
  );

  const results = await Promise.all(promises);
  const failed = results.filter(r => r.error);

  if (failed.length > 0) {
    console.error('Reorder partial failure:', failed.map(f => f.error));
    return NextResponse.json({ error: 'Some updates failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated: updates.length });
}
