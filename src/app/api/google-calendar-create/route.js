// API Route: Create event in Google Calendar
// POST /api/google-calendar-create
import { supabase } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const { emailAccountId, eventData } = await request.json();

    if (!emailAccountId || !eventData) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get email account with OAuth tokens
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
      return Response.json(
        { error: 'Google account not connected' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(emailData.oauth_expires_at);
    const now = new Date();
    let accessToken = emailData.oauth_token;

    if (now >= expiresAt && emailData.oauth_refresh_token) {
      // Refresh token
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

    // Parse event date and time
    const eventDate = new Date(`${eventData.date}T${eventData.time}`);
    const endDate = new Date(
      eventDate.getTime() + (eventData.duration || 60) * 60000
    );

    // Create Google Calendar event
    const calendarEvent = {
      summary: eventData.title,
      description: eventData.description || '',
      start: {
        dateTime: eventDate.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 }, // 24 hours
          { method: 'popup', minutes: 15 },
        ],
      },
    };

    // Add meet link if provided
    if (eventData.googleMeetLink) {
      calendarEvent.conferenceData = {
        createRequest: {
          requestId: Math.random().toString(36).substr(2, 9),
          conferenceSolution: {
            key: { type: 'hangoutsMeet' },
          },
        },
      };
      calendarEvent.description = 
        `${calendarEvent.description}\n\nGoogle Meet: ${eventData.googleMeetLink}`.trim();
    }

    // Add attendees if provided
    if (eventData.attendees && Array.isArray(eventData.attendees)) {
      calendarEvent.attendees = eventData.attendees.map((email) => ({
        email,
        responseStatus: 'needsAction',
      }));
    }

    // Make request to Google Calendar API
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarEvent),
      }
    );

    const calendarData = await calendarResponse.json();

    if (!calendarResponse.ok) {
      console.error('Calendar API error:', calendarData);
      return Response.json(
        { error: calendarData.error?.message || 'Failed to create calendar event' },
        { status: 400 }
      );
    }

    console.log('✅ Calendar event created:', calendarData.id);

    return Response.json({
      success: true,
      calendarEventId: calendarData.id,
      eventLink: calendarData.htmlLink,
    });
  } catch (error) {
    console.error('Calendar creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
