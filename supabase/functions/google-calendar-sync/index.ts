import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record, old_record, type } = await req.json()

    // 1. Only sync if status is 'scheduled'
    if (record.status !== 'scheduled') return new Response(JSON.stringify({ message: 'Not a scheduled appointment' }), { headers: corsHeaders })

    // 2. Get Integration Settings
    const { data: settings } = await supabase.from('app_settings').select('*')
    const googleKey = settings?.find(s => s.key === 'google_key')?.value
    const masterEmail = settings?.find(s => s.key === 'master_gmail')?.value

    if (!googleKey || !masterEmail) {
      return new Response(JSON.stringify({ error: 'Google Integration not configured' }), { status: 400, headers: corsHeaders })
    }

    // 3. Get Student and Counselor Emails
    const { data: student } = await supabase.from('students').select('email, first_name, last_name, phone').eq('id', record.student_id).single()
    const { data: counselor } = await supabase.from('users').select('email, full_name').eq('id', record.counselor_id).single()

    if (!student?.email || !counselor?.email) {
      return new Response(JSON.stringify({ error: 'Missing emails for sync' }), { status: 400, headers: corsHeaders })
    }

    // 4. PREPARE GOOGLE CALENDAR EVENT
    const startTime = new Date(record.scheduled_at)
    const endTime = new Date(startTime.getTime() + (record.duration_minutes || 60) * 60000)

    const event = {
      summary: `${record.type}: ${student.first_name} ${student.last_name} with ${counselor.full_name}`,
      description: `GT Group CRM Appointment\n\nStudent: ${student.first_name} ${student.last_name} (${student.phone || 'N/A'})\nCounselor: ${counselor.full_name}\nNotes: ${record.notes || 'None'}`,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      attendees: [
        { email: student.email, responseStatus: 'needsAction' },
        { email: counselor.email, responseStatus: 'accepted' },
        { email: masterEmail, responseStatus: 'accepted' }
      ],
      conferenceData: {
        createRequest: { requestId: record.id, conferenceSolutionKey: { type: 'hangoutsMeet' } }
      }
    }

    // 5. CALL GOOGLE API (Simplified for this demonstration)
    // In a real environment, you'd use a library like 'google-auth-library' for Deno
    // We'll simulate the response for the user to show the flow
    console.log(`Syncing Appointment ${record.id} to Google Calendar...`)

    // SIMULATED RESPONSE (In production, replace with actual FETCH to Google API)
    const mockGoogleId = `google_event_${Math.random().toString(36).substr(2, 9)}`
    const mockMeetLink = `https://meet.google.com/abc-defg-hij`

    // 6. UPDATE CRM WITH GOOGLE DETAILS
    await supabase.from('appointments').update({
      google_event_id: mockGoogleId,
      meeting_link: mockMeetLink
    }).eq('id', record.id)

    return new Response(JSON.stringify({ success: true, google_id: mockGoogleId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
