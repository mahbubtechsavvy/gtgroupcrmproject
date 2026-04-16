import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Refresh Google Access Token
 * @param {string} userId - UUID of the counselor
 * @param {string} emailAccountId - UUID of the email account
 * @returns {Promise<string>} - New access token
 */
export async function refreshGoogleToken(userId, emailAccountId) {
  const { data: account, error } = await supabase
    .from('user_email_accounts')
    .select('*')
    .eq('id', emailAccountId)
    .single();

  if (error || !account?.oauth_refresh_token) {
    throw new Error('No refresh token found for this account.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: account.oauth_refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Google token.');
  }

  const tokens = await response.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Update DB with new tokens
  await supabase
    .from('user_email_accounts')
    .update({
      oauth_token: tokens.access_token,
      oauth_expires_at: expiresAt,
    })
    .eq('id', emailAccountId);

  return tokens.access_token;
}

/**
 * Create Google Calendar Event
 * @param {Object} params - Event parameters
 * @returns {Promise<Object>} - Google API response
 */
export async function createCalendarEvent({
  accessToken,
  title,
  description,
  startTime,
  endTime,
  studentEmail,
  isOnline = false
}) {
  const event = {
    summary: title,
    description: description,
    start: { dateTime: startTime, timeZone: 'Asia/Dhaka' },
    end: { dateTime: endTime, timeZone: 'Asia/Dhaka' },
    attendees: studentEmail ? [{ email: studentEmail }] : [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  };

  if (isOnline) {
    event.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Google Calendar API error: ${err.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}
