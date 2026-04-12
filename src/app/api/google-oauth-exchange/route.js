// API Route: Exchange Google OAuth code for tokens
// POST /api/google-oauth-exchange
import { supabase } from '@/lib/supabase-server';
import { connectGoogleAccount } from '@/lib/emailAccountManager';

export async function POST(request) {
  try {
    const { code, emailAccountId } = await request.json();

    if (!code || !emailAccountId) {
      return Response.json(
        { error: 'Missing code or emailAccountId' },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google-oauth-callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData);
      return Response.json(
        { error: tokenData.error || 'Failed to exchange code for tokens' },
        { status: 400 }
      );
    }

    // Get user ID from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get email account
    const { data: emailData, error: fetchError } = await supabase
      .from('user_email_accounts')
      .select('*')
      .eq('id', emailAccountId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !emailData) {
      return Response.json(
        { error: 'Email account not found' },
        { status: 404 }
      );
    }

    // Get user info from Google
    let userEmail = emailData.email;
    try {
      const profileResponse = await fetch(
        'https://www.googleapis.com/oauth2/v1/userinfo',
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      );

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        userEmail = profile.email;
      }
    } catch (err) {
      console.error('Error fetching Google profile:', err);
    }

    // Update email account with OAuth tokens
    const { data: updatedAccount, error: updateError } = await supabase
      .from('user_email_accounts')
      .update({
        email: userEmail,
        oauth_connected: true,
        oauth_provider: 'google',
        oauth_token: tokenData.access_token,
        oauth_refresh_token: tokenData.refresh_token || null,
        oauth_expires_at: new Date(
          Date.now() + tokenData.expires_in * 1000
        ).toISOString(),
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', emailAccountId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return Response.json(
        { error: 'Failed to save OAuth tokens' },
        { status: 500 }
      );
    }

    console.log('✅ Google OAuth exchange successful:', userEmail);

    return Response.json({
      success: true,
      email: userEmail,
      emailAccount: updatedAccount,
    });
  } catch (error) {
    console.error('OAuth exchange error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
