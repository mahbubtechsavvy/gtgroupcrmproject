/**
 * Google OAuth Callback Handler
 * Processes OAuth authorization code and stores credentials
 * Route: /api/auth/google-callback
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || error;
      console.error('Google OAuth error:', errorDescription);
      return NextResponse.redirect(
        new URL(
          `/settings/users?error=${encodeURIComponent(errorDescription)}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          '/settings/users?error=Missing authorization code',
          request.url
        )
      );
    }

    if (!state) {
      return NextResponse.redirect(
        new URL(
          '/settings/users?error=Missing state parameter',
          request.url
        )
      );
    }

    // Verify and decode state
    let decodedState;
    try {
      decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        new URL(
          '/settings/users?error=Invalid state parameter',
          request.url
        )
      );
    }

    // Verify timestamp (valid for 10 minutes)
    const age = Date.now() - decodedState.timestamp;
    if (age > 10 * 60 * 1000) {
      return NextResponse.redirect(
        new URL(
          '/settings/users?error=State parameter expired. Please try again.',
          request.url
        )
      );
    }

    const userId = decodedState.userId;
    if (!userId) {
      return NextResponse.redirect(
        new URL(
          '/settings/users?error=No user ID in state',
          request.url
        )
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google-callback`,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Token exchange error:', error);
      return NextResponse.redirect(
        new URL(
          `/settings/users?error=${encodeURIComponent(error.error_description || 'Token exchange failed')}`,
          request.url
        )
      );
    }

    const tokens = await tokenResponse.json();

    // Get Gmail address from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        new URL(
          '/settings/users?error=Failed to get Gmail address',
          request.url
        )
      );
    }

    const userInfo = await userInfoResponse.json();
    const gmailAddress = userInfo.email;

    // Store in user_email_accounts table
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const { data: emailAccount, error: createError } = await supabase
      .from('user_email_accounts')
      .insert([
        {
          user_id: userId,
          email: gmailAddress,
          account_type: 'gmail',
          oauth_token: tokens.access_token,
          oauth_refresh_token: tokens.refresh_token || null,
          oauth_expires_at: expiresAt.toISOString(),
          oauth_provider: 'google',
          oauth_connected: true,
          is_verified: true,
          verified_at: new Date().toISOString(),
          is_primary: false,
        },
      ])
      .select();

    if (createError) {
      console.error('Error storing OAuth tokens:', createError);
      return NextResponse.redirect(
        new URL(
          `/settings/users?error=${encodeURIComponent(createError.message)}`,
          request.url
        )
      );
    }

    console.log('✅ Gmail account authenticated:', gmailAddress);

    // Redirect back to user management with success
    return NextResponse.redirect(
      new URL(
        `/settings/users?success=Gmail account added successfully: ${gmailAddress}`,
        request.url
      )
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/settings/users?error=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }
}
