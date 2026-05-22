import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Send transactional email via Resend API.
 *
 * Required Supabase secrets:
 *   RESEND_API_KEY
 *
 * Body: { template: string, to: string, first_name: string }
 *   - template: "welcome" | "trial_day_10" | "trial_day_13"
 *   - to: recipient email address
 *   - first_name: recipient's first name (falls back to "there")
 */

const FROM = 'Leila Samii <hello@klasup.com>'
const UPGRADE_URL = 'https://klasup.com/pricing'

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
  ol { font-size:16px; line-height:1.8; padding-left:20px; margin:0 0 16px; }
  ol li { margin-bottom:8px; }
  ul { font-size:16px; line-height:1.8; padding-left:20px; margin:0 0 16px; }
  ul li { margin-bottom:4px; }
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
/*  Templates                                                          */
/* ------------------------------------------------------------------ */

interface TemplateResult {
  subject: string
  html: string
}

function welcomeEmail(firstName: string): TemplateResult {
  return {
    subject: "Welcome to KlasUp — let's build something better",
    html: wrap(`
<h1>Welcome to KlasUp</h1>
<p>Hi ${firstName},</p>
<p>I'm so glad you're here!</p>
<p>KlasUp exists for one reason: nobody taught us how to teach. We earned advanced degrees in our disciplines, and then we were handed a roster and a room. KlasUp is the support I wish I'd had and am excited to have it now. It's evidence-based, it's in your corner, and it's built to make teaching feel lighter instead of heavier.</p>
<p>Here's the best way to start:</p>
<ol>
  <li><strong>Tell KlasUp about your course.</strong> Just the basics, like what you teach and who your students are. This helps KlasUp tailor everything to your discipline and your students.</li>
  <li><strong>Upload one assignment.</strong> KlasUp will give you research-backed feedback in seconds.</li>
  <li><strong>Say hello to Klas.</strong> Klas is your AI teaching coach. Ask it anything, whether that's how to scaffold a project, how to make a discussion board land, or how to rethink a rubric. It's there to think with you.</li>
</ol>
<p>That's it. Start small, and the rest will follow.</p>
<p>You have a <strong>14-day Pro trial</strong>, so everything is unlocked while you explore.</p>
<p>Teaching well is hard work. I hope this makes it a little less lonely and more fun!</p>
<div class="signature">
  <p>Gratefully,</p>
  <p><strong>Leila Samii, PhD</strong></p>
  <p>Founder, KlasUp</p>
</div>`),
  }
}

function trialDay10Email(firstName: string): TemplateResult {
  return {
    subject: 'Your KlasUp trial ends in 4 days',
    html: wrap(`
<h1>Your trial ends in 4 days</h1>
<p>Hi ${firstName},</p>
<p>Quick heads-up: your KlasUp Pro trial wraps up in 4 days.</p>
<p>No pressure here. I just didn't want it to slip past you. If KlasUp has earned a place in your teaching, here's what staying Pro keeps in your hands:</p>
<ul>
  <li>Unlimited Klas coaching and Assignment Builder</li>
  <li>Slide Studio and Course Portfolio</li>
  <li>Exports to Word, PDF, and PowerPoint</li>
</ul>
<p>When your trial ends, your account stays put. You just drop back to the free tier and lose the Pro tools above.</p>
<p>If you're ready, upgrading takes one click:</p>
<p><a href="${UPGRADE_URL}" class="btn">Upgrade to Pro →</a></p>
<p>And if now isn't the time, that's okay. KlasUp will be here when you're ready.</p>
<div class="signature">
  <p>Gratefully,</p>
  <p><strong>Leila Samii, PhD</strong></p>
  <p>Founder, KlasUp</p>
</div>`),
  }
}

function trialDay13Email(firstName: string): TemplateResult {
  return {
    subject: 'Last day of your KlasUp trial',
    html: wrap(`
<h1>Last day of your trial</h1>
<p>Hi ${firstName},</p>
<p>Today is the last day of your KlasUp Pro trial.</p>
<p>If you'd like to keep your Pro tools, including unlimited Klas, the full builder suite, and exports, you can upgrade in one click:</p>
<p><a href="${UPGRADE_URL}" class="btn">Upgrade to Pro →</a></p>
<p>If not, that's no problem. Your account stays active on the free plan, and your work stays yours.</p>
<p>Thank you for giving KlasUp a try. I'd love to hear what you thought.</p>
<div class="signature">
  <p>Gratefully,</p>
  <p><strong>Leila Samii, PhD</strong></p>
  <p>Founder, KlasUp</p>
</div>`),
  }
}

const TEMPLATES: Record<string, (firstName: string) => TemplateResult> = {
  welcome: welcomeEmail,
  trial_day_10: trialDay10Email,
  trial_day_13: trialDay13Email,
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
    const { template, to, first_name } = body

    if (!template || !to) {
      return new Response(JSON.stringify({ error: 'Missing "template" or "to"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const buildTemplate = TEMPLATES[template]
    if (!buildTemplate) {
      return new Response(JSON.stringify({ error: `Unknown template: ${template}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const name = (first_name || '').trim() || 'there'
    const { subject, html } = buildTemplate(name)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
      return new Response(JSON.stringify({ error: err.message || `Resend error (${res.status})` }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
