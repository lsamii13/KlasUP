import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Stripe from "npm:stripe@17"
import { createClient } from "jsr:@supabase/supabase-js@2"

/**
 * Stripe webhook handler for subscription lifecycle events.
 *
 * Required Supabase secrets:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 *   SUPABASE_URL          (auto-set by Supabase)
 *   SUPABASE_SERVICE_ROLE_KEY (auto-set by Supabase)
 *
 * Handles:
 *   - checkout.session.completed  → activate pro subscription
 *   - customer.subscription.updated → sync subscription state
 *   - customer.subscription.deleted → revert to free tier
 */

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!stripeKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: 'Stripe is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' })

  // Verify webhook signature
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Service-role client bypasses RLS for profile updates
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id

        if (!userId) {
          console.error('checkout.session.completed: missing client_reference_id')
          break
        }

        // Store Stripe customer ID and activate pro
        const { error } = await supabase
          .from('profiles')
          .update({
            role: 'pro',
            stripe_customer_id: session.customer as string,
            subscription_expires_at: null, // managed by Stripe now
          })
          .eq('id', userId)

        if (error) {
          console.error('Failed to activate pro for user', userId, error.message)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const isActive = ['active', 'trialing'].includes(subscription.status)

        const { error } = await supabase
          .from('profiles')
          .update({
            role: isActive ? 'pro' : 'free',
            subscription_expires_at: isActive
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Failed to update subscription for customer', customerId, error.message)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { error } = await supabase
          .from('profiles')
          .update({
            role: 'free',
            subscription_expires_at: null,
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Failed to deactivate pro for customer', customerId, error.message)
        }
        break
      }

      default:
        // Ignore unhandled event types
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', err.message)
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
