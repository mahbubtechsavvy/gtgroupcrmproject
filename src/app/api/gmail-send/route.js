// API Route: Send email via Gmail
// POST /api/gmail-send
import { supabase } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const { emailAccountId, emailData } = await request.json();

    if (!emailAccountId || !emailData) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { to, subject, html, text } = emailData;

    if (!to || !subject) {
      return Response.json(
        { error: 'Missing email or subject' },
        { status: 400 }
      );
    }

    // Get email account with OAuth tokens
    const { data: accountData, error: fetchError } = await supabase
      .from('user_email_accounts')
      .select('*')
      .eq('id', emailAccountId)
      .single();

    if (fetchError || !accountData) {
      return Response.json(
        { error: 'Email account not found' },
        { status: 404 }
      );
    }

    if (!accountData.oauth_connected || !accountData.oauth_token) {
      return Response.json(
        { error: 'Gmail account not connected' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(accountData.oauth_expires_at);
    const now = new Date();
    let accessToken = accountData.oauth_token;

    if (now >= expiresAt && accountData.oauth_refresh_token) {
      // Refresh token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: accountData.oauth_refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        return Response.json(
          { error: 'Failed to refresh Google token' },
          { status: 400 }
        );
      }

      accessToken = refreshData.access_token;

      // Update tokens
      await supabase
        .from('user_email_accounts')
        .update({
          oauth_token: accessToken,
          oauth_expires_at: new Date(
            Date.now() + refreshData.expires_in * 1000
          ).toISOString(),
        })
        .eq('id', emailAccountId);
    }

    // Create email message in RFC 2822 format
    const emailLines = [
      `From: ${accountData.email}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      html || text || '',
    ];

    const emailBody = emailLines.join('\r\n');
    const base64Email = Buffer.from(emailBody).toString('base64');

    // Send via Gmail API
    const sendResponse = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: base64Email,
        }),
      }
    );

    const sendData = await sendResponse.json();

    if (!sendResponse.ok) {
      console.error('Gmail API error:', sendData);
      return Response.json(
        { error: sendData.error?.message || 'Failed to send email' },
        { status: 400 }
      );
    }

    console.log('✅ Email sent via Gmail:', sendData.id);

    return Response.json({
      success: true,
      messageId: sendData.id,
    });
  } catch (error) {
    console.error('Gmail send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
