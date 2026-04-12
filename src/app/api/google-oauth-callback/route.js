// API Route: Google OAuth Callback Redirect
// GET /api/google-oauth-callback
import { redirect } from 'next/navigation';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for errors
    if (error) {
      console.error('OAuth error:', error);
      return redirect(
        `/settings/emails?oauth_error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return redirect('/settings/emails?oauth_error=missing_code');
    }

    // Redirect to client callback handler
    // The client will handle exchanging code for tokens
    return redirect(
      `/settings/emails?oauth_code=${encodeURIComponent(code)}&oauth_state=${encodeURIComponent(
        state || ''
      )}`
    );
  } catch (error) {
    console.error('Callback error:', error);
    return redirect('/settings/emails?oauth_error=callback_error');
  }
}
