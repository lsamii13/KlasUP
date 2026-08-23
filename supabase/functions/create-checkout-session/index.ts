import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Stripe from "npm:stripe@17"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const VALID_PRICE_IDS = [
  'price_1U7fciEA4xWM73CVdZFPeDJL', // Monthly $19.99 LIVE
  'price_1U7fchEA4xWM73CV4a2HqKxg', // Annual $179.99 LIVE
]

/**
 * Create a Stripe Checkout Session for a KlasUp Pro subscription.
 *
 * Required Supabase secrets:
 *   STRIPE_SECRET_KEY
 *   SITE_URL — base URL of the frontend (e.g. https://klasup.com)
 *
 * Body: { priceId: string }
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

    // ── Guard: reject if user already has an active Stripe subscription ──
    const { data: activeSubs, error: subLookupError } = await authClient
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due'])
      .limit(1)

    if (subLookupError) {
      return new Response(JSON.stringify({ error: 'Unable to verify subscription status. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (activeSubs && activeSubs.length > 0) {
      return new Response(JSON.stringify({ error: 'You already have an active subscription. Contact hello@klasup.com if you need to make changes.' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Look up existing Stripe customer to avoid creating duplicates ──
    const { data: profileRow, error: profileLookupError } = await authClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    if (profileLookupError) {
      return new Response(JSON.stringify({ error: 'Unable to verify account status. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const existingCustomerId = profileRow?.stripe_customer_id || null

    const { priceId } = await req.json()

    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Missing priceId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!VALID_PRICE_IDS.includes(priceId)) {
      return new Response(JSON.stringify({ error: 'Invalid price ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' })
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000'

    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { supabase_user_id: userId },
      },
      success_url: `${siteUrl}/dashboard?checkout=success`,
      cancel_url: `${siteUrl}/pricing`,
      client_reference_id: userId,
    }

    if (existingCustomerId) {
      checkoutParams.customer = existingCustomerId
    }

    const session = await stripe.checkout.sessions.create(checkoutParams)

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to create checkout session' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
