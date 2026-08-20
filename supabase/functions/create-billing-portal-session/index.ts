import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Stripe from "npm:stripe@17"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Create a Stripe Billing Portal session so a subscriber can manage
 * or cancel their subscription.
 *
 * Required Supabase secrets:
 *   STRIPE_SECRET_KEY
 *   SITE_URL — base URL of the frontend (e.g. https://klasup.com)
 *
 * Body: (none required)
 * Auth: JWT required — user ID extracted from token
 */

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

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: 'Stripe is not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // ── Verify caller identity via JWT ──
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('KLASUP_SECRET_KEY')!,
    )
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const userId = user.id

    // ── Look up the user's Stripe customer ID ──
    const { data: profileRow, error: profileLookupError } = await authClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    if (profileLookupError) {
      return new Response(JSON.stringify({ error: 'Unable to load your billing information. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const customerId = profileRow?.stripe_customer_id
    if (!customerId) {
      return new Response(JSON.stringify({ error: 'No billing account found. This is only available after a paid subscription.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Create a Billing Portal session ──
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' })
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/dashboard`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to open billing portal. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
