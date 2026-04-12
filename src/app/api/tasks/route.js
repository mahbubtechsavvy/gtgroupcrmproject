import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assigned_to');
    const sortBy = searchParams.get('sort_by') || 'due_date';

    let query = supabase
      .from('tasks')
      .select('*, created_by_user:created_by(*), assigned_to_user:assigned_to(*)')
      .order(sortBy, { ascending: sortBy !== 'priority' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Tasks fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(tasks || []);
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, priority, status, due_date, assigned_to, tags } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description: description || null,
        priority: priority || 'medium',
        status: status || 'open',
        due_date: due_date || null,
        assigned_to: assigned_to || null,
        created_by: session.user.id,
        tags: tags || []
      })
      .select('*, created_by_user:created_by(*), assigned_to_user:assigned_to(*)')
      .single();

    if (error) {
      console.error('Task create error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
