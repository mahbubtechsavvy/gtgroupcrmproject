import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/chat/conversations
 * Fetch all conversations for the current user
 */
export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Get conversations where the user is a participant
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select('*, participant_a(id, full_name, avatar_url, role), participant_b(id, full_name, avatar_url, role)')
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Conversations fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(conversations || []);
  } catch (error) {
    console.error('GET /api/chat/conversations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/chat/conversations
 * Create a new conversation or return existing
 */
export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const participant_a = user.id;
    let participant_b = body.participant_b;

    if (!participant_b && body.participant_b_email) {
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('id')
        .eq('email', body.participant_b_email)
        .single();

      if (emailError || !userByEmail) {
        return NextResponse.json({ error: 'Participant email not found' }, { status: 404 });
      }

      participant_b = userByEmail.id;
    }

    if (!participant_b) {
      return NextResponse.json({ error: 'participant_b or participant_b_email is required' }, { status: 400 });
    }

    if (participant_a === participant_b) {
      return NextResponse.json({ error: 'Cannot start conversation with yourself' }, { status: 400 });
    }

    const [userA, userB] = [participant_a, participant_b].sort();

    let { data: existing, error: findError } = await supabase
      .from('chat_conversations')
      .select('*, participant_a(id, full_name, avatar_url, role), participant_b(id, full_name, avatar_url, role)')
      .eq('participant_a', userA)
      .eq('participant_b', userB)
      .single();

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({ participant_a: userA, participant_b: userB })
      .select('*, participant_a(id, full_name, avatar_url, role), participant_b(id, full_name, avatar_url, role)')
      .single();

    if (error) {
      console.error('Conversation create error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/chat/conversations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
