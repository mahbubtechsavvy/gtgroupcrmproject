// API Route: Validate Google OAuth Token
// POST /api/google-validate-token
import { supabase } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const { emailAccountId } = await request.json();

    if (!emailAccountId) {
      return Response.json(
        { error: 'Missing emailAccountId' },
        { status: 400 }
      );
    }

    // Get email account
    const { data: emailData, error: fetchError } = await supabase
      .from('user_email_accounts')
      .select('*')
      .eq('id', emailAccountId)
      .single();

    if (fetchError || !emailData) {
      return Response.json(
        { error: 'Email account not found' },
        { status: 404 }
      );
    }

    if (!emailData.oauth_connected || !emailData.oauth_token) {
      return Response.json({ valid: false });
    }

    // Check if token is expired
    const expiresAt = new Date(emailData.oauth_expires_at);
    const now = new Date();

    if (now >= expiresAt) {
      // Token expired, try to refresh
      console.log('Token expired, attempting refresh...');

      if (!emailData.oauth_refresh_token) {
        return Response.json({ valid: false });
      }

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: emailData.oauth_refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        console.error('Token refresh failed:', refreshData);
        return Response.json({ valid: false });
      }

      // Update tokens
      await supabase
        .from('user_email_accounts')
        .update({
          oauth_token: refreshData.access_token,
          oauth_expires_at: new Date(
            Date.now() + refreshData.expires_in * 1000
          ).toISOString(),
        })
        .eq('id', emailAccountId);

      return Response.json({ valid: true });
    }

    return Response.json({ valid: true });
  } catch (error) {
    console.error('Token validation error:', error);
    return Response.json({ valid: false, error: error.message }, { status: 500 });
  }
}
