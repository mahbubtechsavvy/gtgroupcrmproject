import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      );
    }

    // Decode state to get userId and requestId
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId, requestId } = decodedState;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-email-callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to exchange code for tokens' },
        { status: 400 }
      );
    }

    const tokens = await tokenResponse.json();

    // Get user's Gmail profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get user profile' },
        { status: 400 }
      );
    }

    const profile = await profileResponse.json();

    // Save to database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Check if email already exists for this user
    const { data: existing } = await supabase
      .from('user_email_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('email', profile.email)
      .eq('email_type', 'gmail')
      .single();

    if (existing) {
      // Update existing record
      await supabase
        .from('user_email_accounts')
        .update({
          oauth_token: tokens.access_token,
          oauth_refresh_token: tokens.refresh_token,
          oauth_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          is_verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Create new record
      await supabase
        .from('user_email_accounts')
        .insert({
          user_id: userId,
          email: profile.email,
          email_type: 'gmail',
          oauth_token: tokens.access_token,
          oauth_refresh_token: tokens.refresh_token,
          oauth_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          is_verified: true,
          verified_at: new Date().toISOString(),
          is_primary: false,
        });
    }

    // Redirect back to user management page with success
    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/settings/users`);
    redirectUrl.searchParams.set('email_added', profile.email);
    redirectUrl.searchParams.set('user_id', userId);
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
