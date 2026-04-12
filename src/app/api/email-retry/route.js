// API Route: Retry Failed Email
// POST /api/email-retry
import { supabase } from '@/lib/supabase-server';
import { retryFailedEmail } from '@/lib/emailRouter';

export async function POST(request) {
  try {
    const { logId } = await request.json();

    if (!logId) {
      return Response.json(
        { error: 'Missing logId' },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify user owns this email log
    const { data: log, error: fetchError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', logId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !log) {
      return Response.json(
        { error: 'Email log not found' },
        { status: 404 }
      );
    }

    // Retry the email
    const result = await retryFailedEmail(logId);

    if (result.success) {
      console.log('✅ Email retry scheduled:', logId);
      return Response.json({
        success: true,
        message: 'Email retry scheduled',
      });
    } else {
      return Response.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Email retry error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
