import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { isStripeConfigured, stripe } from '@/lib/stripe'
import { fulfillCheckoutSession } from '@/lib/orders'

// Webhooks must read the exact raw body to verify Stripe's signature, so this
// route must never be statically optimized or have its body parsed/cached.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Stripe webhook. Stripe recommends fulfilling Checkout via the
 * `checkout.session.completed` event rather than the success-page redirect,
 * because the redirect can be missed (closed tab, flaky network). Fulfillment is
 * idempotent (see fulfillCheckoutSession), so Stripe's retries are harmless.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 })
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'webhook_not_configured' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    console.error('[webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const order = await fulfillCheckoutSession(session.id)
      if (order) {
        // Hook for later: email the buyer their /purchases/<accessToken> link here.
        console.log(`[webhook] fulfilled order ${order.id} for session ${session.id}`)
      }
    }
  } catch (err) {
    // Return 500 so Stripe retries — the DB may have been briefly unavailable.
    console.error(`[webhook] failed to handle ${event.type}:`, err)
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
