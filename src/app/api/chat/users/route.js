import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/chat/users
 * Fetch all users for chat initiation (excluding current user)
 */
export async function GET(request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    let queryBuilder = supabase
      .from('users')
      .select('id, full_name, email, avatar_url, role, status, phone, office_id, offices!users_office_id_fkey(name)')
      .neq('id', user.id)
      .order('full_name', { ascending: true });

    if (query) {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(query);
      const queryParts = [
        `full_name.ilike.%${query}%`,
        `email.ilike.%${query}%`,
        `phone.ilike.%${query}%`,
        `offices!users_office_id_fkey.name.ilike.%${query}%`,
      ];

      if (isUuid) {
        queryParts.push(`id.eq.${query}`);
      }

      queryBuilder = queryBuilder.or(queryParts.join(','));
    }

    const { data: users, error } = await queryBuilder.limit(50);

    if (error) {
      console.error('Users fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(users || []);
  } catch (error) {
    console.error('GET /api/chat/users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
