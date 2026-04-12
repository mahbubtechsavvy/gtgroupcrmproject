import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { to, subject, html } = await req.json()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'GT Group CRM <notifications@gtgroupcrm.com>',
      to: [to],
      subject: subject,
      html: html,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
})
