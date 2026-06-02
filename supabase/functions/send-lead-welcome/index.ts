import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Send a welcome email to a new lead based on their source.
 *
 * Required Supabase secrets:
 *   RESEND_API_KEY
 *
 * Body: { email: string, source: string }
 *   - source: "prompts_pdf" | "accreditation_waitlist"
 */

const VALID_SOURCES = ['prompts_pdf', 'accreditation_waitlist'] as const
type LeadSource = typeof VALID_SOURCES[number]

/* ------------------------------------------------------------------ */
/*  Shared email wrapper                                               */
/* ------------------------------------------------------------------ */

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700&family=Manrope:wght@400;500;600&display=swap');
  body { margin:0; padding:0; background:#FAF7F2; font-family:'Manrope',Arial,Helvetica,sans-serif; color:#333; }
  .container { max-width:600px; margin:0 auto; padding:40px 24px; }
  h1 { font-family:'Bricolage Grotesque','Georgia',serif; color:#1B2B4B; font-size:24px; font-weight:700; margin:0 0 24px; }
  p { font-size:16px; line-height:1.6; margin:0 0 16px; }
  .btn { display:inline-block; background:#2A9D8F; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:8px; font-family:'Manrope',Arial,Helvetica,sans-serif; font-weight:600; font-size:16px; margin:8px 0 24px; }
  .signature { margin-top:32px; }
  .signature p { margin:0; line-height:1.5; }
  .footer { margin-top:40px; padding-top:24px; border-top:1px solid #e0dcd6; text-align:center; }
  .footer p { font-size:13px; color:#888; margin:0; }
  .tagline { font-family:'Bricolage Grotesque','Georgia',serif; color:#1B2B4B; font-size:14px; font-weight:600; }
  strong { font-weight:600; }
</style>
</head>
<body>
<div class="container">
${body}
<div class="footer">
  <p class="tagline">Teach smarter. Not harder.</p>
</div>
</div>
</body>
</html>`
}

/* ------------------------------------------------------------------ */
/*  Email builders                                                     */
/* ------------------------------------------------------------------ */

interface EmailResult {
  from: string
  replyTo: string
  subject: string
  html: string
}

function promptsPdfEmail(): EmailResult {
  return {
    from: 'KlasUp <hello@klasup.com>',
    replyTo: 'hello@klasup.com',
    subject: '12 prompts down. Want the easy button?',
    html: wrap(`
<h1>12 prompts down. Want the easy button?</h1>
<p>Hi there,</p>
<p>Thanks for grabbing the KlasUp faculty prompts &mdash; I hope they save you a few hours this week. (That's the whole idea: teach smarter, not harder.)</p>
<p>Quick story about why I built these. I spent years as a professor, associate dean, and AVP watching brilliant faculty pour nights and weekends into course design with almost no support. Nobody ever taught us how to teach &mdash; we were just expected to figure it out. KlasUp is the tool I wish I'd had.</p>
<p>The prompts are a taste. The actual platform does the heavier lifting &mdash; an AI teaching coach, instant feedback on your assignments, and a peer-reviewed research library, all in one place.</p>
<p>You can try the whole thing free &mdash; no credit card needed.</p>
<p><a href="https://klasup.com" class="btn">Start your free trial &rarr;</a></p>
<p>And here's the part I mean sincerely: I'd love to hear from you. What do you teach? What's the part of your job that eats your evenings? Just hit reply &mdash; your message comes straight to me, and I read and answer every single one. Hearing from real faculty is how KlasUp gets better.</p>
<div class="signature">
  <p>Gratefully,</p>
  <p><strong>Leila Samii, PhD</strong></p>
  <p>Founder, KlasUp</p>
</div>`),
  }
}

function accreditationWaitlistEmail(): EmailResult {
  return {
    from: 'KlasUp <hello@klasup.com>',
    replyTo: 'leila@klasup.com',
    subject: 'Thanks for your interest in KlasUp for your institution',
    html: wrap(`
<h1>Thanks for your interest in KlasUp</h1>
<p>Hello,</p>
<p>Thank you for your interest in KlasUp's accreditation support &mdash; you're officially on the list, and you'll be among the first to know when it's available (we're targeting this winter).</p>
<p>A bit about what's coming: KlasUp is being built to make accreditation documentation dramatically less painful &mdash; mapping faculty teaching practices to standards like NECHE, HLC, SACSCOC, and AACSB, and generating the evidence your institution needs without the usual scramble.</p>
<p>But I'd rather not just put you on a list and disappear. I'm Leila &mdash; KlasUp's founder, and before this I spent years in academic leadership as an AVP of Academic Affairs, associate dean, and CTL director. I know the accreditation crunch from the inside.</p>
<p>If you're open to it, I'd genuinely value a short conversation about what your institution is navigating &mdash; what's working, what's painful, and what would actually help. It shapes what we build, and it means you get a tool designed around real needs rather than guesses.</p>
<p>Just reply to this email &mdash; it comes directly to me.</p>
<div class="signature">
  <p>Gratefully,</p>
  <p><strong>Leila Samii, PhD</strong></p>
  <p>Founder, KlasUp</p>
</div>`),
  }
}

const EMAILS: Record<LeadSource, () => EmailResult> = {
  prompts_pdf: promptsPdfEmail,
  accreditation_waitlist: accreditationWaitlistEmail,
}

/* ------------------------------------------------------------------ */
/*  Handler                                                            */
/* ------------------------------------------------------------------ */

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Resend API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const { email, source } = body

    if (!email || !source) {
      return new Response(JSON.stringify({ error: 'Missing "email" or "source"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!VALID_SOURCES.includes(source)) {
      return new Response(
        JSON.stringify({
          sent: false,
          message: `Unknown source "${source}". Valid sources: ${VALID_SOURCES.join(', ')}`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { from, replyTo, subject, html } = EMAILS[source as LeadSource]()

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, reply_to: replyTo, to: email, subject, html }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
      return new Response(JSON.stringify({ error: err.message || `Resend error (${res.status})` }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    return new Response(
      JSON.stringify({ sent: true, source, resend_id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
