import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Stripe from "npm:stripe@17"
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2"

/**
 * Stripe webhook handler for subscription lifecycle events.
 *
 * Required Supabase secrets:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 *   SUPABASE_URL        (auto-set by Supabase)
 *   KLASUP_SECRET_KEY   (the service role key, renamed during the June 2026 key rotation)
 *
 * Handles:
 *   - checkout.session.completed     → record customer + sync subscription
 *   - customer.subscription.updated  → sync subscription state
 *   - customer.subscription.deleted  → mark canceled, expire access
 *
 * Design notes:
 *   - This function NEVER writes profiles.role. Access is decided by
 *     subscription_expires_at in checkSubscriptionStatus(); role carries
 *     permission level (admin / institutional) and must not be clobbered.
 *   - Any write failure returns 500 so Stripe retries. processed_at is only
 *     stamped after a fully successful run.
 */

// Statuses that should keep a faculty member's access switched on.
// 'past_due' is included deliberately: Stripe retries a failed card for ~2 weeks,
// and locking someone out mid-term over an expired card is worse than a short grace period.
const ACTIVE_STATUSES = ['active', 'trialing', 'past_due']

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Find the KlasUp user for a Stripe subscription.
 * Prefers metadata (stamped at checkout, always present, order-independent).
 * Falls back to a stripe_customer_id lookup for subscriptions created outside our flow.
 */
async function resolveUserId(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const fromMetadata = subscription.metadata?.supabase_user_id
  if (fromMetadata) return fromMetadata

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id

  if (!customerId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (error) {
    console.error('resolveUserId lookup failed:', error.message)
    return null
  }
  return data?.id ?? null
}

/**
 * Write subscription state to both tables.
 * Throws on failure so the caller can return 500 and let Stripe retry.
 */
async function syncSubscription(
  supabase: SupabaseClient,
  userId: string,
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id ?? null

  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null

  const priceId = subscription.items?.data?.[0]?.price?.id ?? null
  const isActive = ACTIVE_STATUSES.includes(subscription.status)

  // 1. subscriptions — full record of what Stripe says.
  //    Upsert on stripe_subscription_id (UNIQUE) so repeat events overwrite cleanly.
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: subscription.status,
        current_period_end: periodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_subscription_id' },
    )

  if (subError) {
    throw new Error(`subscriptions upsert failed: ${subError.message}`)
  }

  // 2. profiles — only what the app actually reads for access.
  //    NOTE: role is deliberately absent. Do not add it.
  const profileUpdate: Record<string, unknown> = {
    subscription_expires_at: isActive
      ? periodEnd
      : new Date().toISOString(), // inactive → expire now
  }
  if (customerId) profileUpdate.stripe_customer_id = customerId

  const { error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', userId)

  if (profileError) {
    throw new Error(`profiles update failed: ${profileError.message}`)
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!stripeKey || !webhookSecret) {
    return json({ error: 'Stripe is not configured' }, 500)
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' })

  // ---- Signature verification (security boundary — do not modify) ----
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return json({ error: 'Missing stripe-signature header' }, 400)
  }

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    return json({ error: `Webhook signature verification failed: ${err.message}` }, 400)
  }

  // Service-role client bypasses RLS.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('KLASUP_SECRET_KEY')!,
  )

  // ---- Duplicate-event guard ----
  // A row exists with processed_at set  → already handled, acknowledge and stop.
  // A row exists with processed_at null → a previous attempt failed; retry it.
  // No row                              → first delivery; record it and proceed.
  const { data: existingEvent, error: lookupError } = await supabase
    .from('stripe_events')
    .select('id, processed_at')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (lookupError) {
    console.error('stripe_events lookup failed:', lookupError.message)
    return json({ error: 'Event lookup failed' }, 500)
  }

  if (existingEvent?.processed_at) {
    return json({ received: true, duplicate: true })
  }

  if (!existingEvent) {
    const { error: insertError } = await supabase
      .from('stripe_events')
      .insert({
        stripe_event_id: event.id,
        type: event.type,
        payload: event as unknown as Record<string, unknown>,
      })

    // 23505 = unique violation: a concurrent delivery inserted it first. Safe to continue;
    // all writes below are idempotent upserts.
    if (insertError && insertError.code !== '23505') {
      console.error('stripe_events insert failed:', insertError.message)
      return json({ error: 'Event record failed' }, 500)
    }
  }

  // ---- Handle the event ----
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'subscription' || !session.subscription) {
          console.log('checkout.session.completed: not a subscription checkout, ignoring')
          break
        }

        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id

        // Fetch the full subscription so we get a real period end.
        // The session alone does not carry it — this is what prevents the
        // "paid, then immediately dropped to Free" window.
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        const userId = session.client_reference_id
          ?? subscription.metadata?.supabase_user_id
          ?? await resolveUserId(supabase, subscription)

        if (!userId) {
          console.error('checkout.session.completed: could not resolve user', session.id)
          throw new Error('Could not resolve user for checkout session')
        }

        await syncSubscription(supabase, userId, subscription)
        console.log('Activated subscription for user', userId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = await resolveUserId(supabase, subscription)

        if (!userId) {
          console.error('subscription.updated: could not resolve user', subscription.id)
          throw new Error('Could not resolve user for subscription update')
        }

        await syncSubscription(supabase, userId, subscription)
        console.log('Synced subscription for user', userId, 'status', subscription.status)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = await resolveUserId(supabase, subscription)

        if (!userId) {
          console.error('subscription.deleted: could not resolve user', subscription.id)
          throw new Error('Could not resolve user for subscription deletion')
        }

        // syncSubscription handles this correctly: status is 'canceled',
        // which is not in ACTIVE_STATUSES, so access expires now.
        await syncSubscription(supabase, userId, subscription)
        console.log('Canceled subscription for user', userId)
        break
      }

      default:
        // Unhandled event types are acknowledged, not retried.
        console.log('Unhandled event type:', event.type)
        break
    }
  } catch (err) {
    // Do NOT stamp processed_at — leaving it null lets Stripe's retry pick it up.
    console.error('Webhook handler error:', err.message)
    return json({ error: 'Webhook handler failed' }, 500)
  }

  // ---- Mark processed only after everything above succeeded ----
  const { error: stampError } = await supabase
    .from('stripe_events')
    .update({ processed_at: new Date().toISOString() })
    .eq('stripe_event_id', event.id)

  if (stampError) {
    // The work succeeded; only the bookkeeping failed. Acknowledge so Stripe
    // does not retry — a retry would redo idempotent writes harmlessly anyway.
    console.error('Failed to stamp processed_at:', stampError.message)
  }

  return json({ received: true })
})
