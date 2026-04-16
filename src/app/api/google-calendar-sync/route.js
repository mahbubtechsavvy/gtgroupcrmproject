import { createClient } from '@supabase/supabase-js';
import { refreshGoogleToken, createCalendarEvent } from '@/lib/googleCalendar';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      counselorId, 
      studentId, 
      studentEmail,
      title, 
      description, 
      startTime, 
      endTime, 
      isOnline 
    } = body;

    if (!counselorId || !title || !startTime || !endTime) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // 1. Find the connected Google account for the counselor
    const { data: accounts, error: accountError } = await supabase
      .from('user_email_accounts')
      .select('*')
      .eq('user_id', counselorId)
      .eq('oauth_provider', 'google')
      .eq('oauth_connected', true);

    if (accountError || !accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Counselor does not have a connected Google account for calendar sync.' 
      }), { status: 404 });
    }

    // Prefer the primary account, otherwise pick the first one
    const primaryAccount = accounts.find(a => a.is_primary) || accounts[0];

    // 2. Refresh token if needed
    let accessToken = primaryAccount.oauth_token;
    const isExpired = new Date(primaryAccount.oauth_expires_at) <= new Date();

    if (isExpired) {
      try {
        accessToken = await refreshGoogleToken(counselorId, primaryAccount.id);
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr);
        return new Response(JSON.stringify({ error: 'Failed to refresh Google authorization.' }), { status: 401 });
      }
    }

    // 3. Create the Google Calendar event
    // Note: This also handles the Student Invitation if studentEmail is provided
    const calendarEvent = await createCalendarEvent({
      accessToken,
      title,
      description,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      studentEmail: studentEmail || null,
      isOnline
    });

    return new Response(JSON.stringify({ 
      success: true, 
      eventId: calendarEvent.id, 
      htmlLink: calendarEvent.htmlLink,
      meetLink: calendarEvent.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri || null
    }), { status: 200 });

  } catch (error) {
    console.error('Google Calendar Sync Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
