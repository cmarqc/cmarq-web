import Stripe from 'stripe'

let client: Stripe | null = null

/** True when a Stripe secret key is configured. Routes 503 when it isn't. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

/**
 * Lazily-created Stripe client. Throws if called without STRIPE_SECRET_KEY, so
 * always guard callers with `isStripeConfigured()` first (mirrors lib/db.ts).
 */
export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    // Pin no apiVersion so the account default is used; upgrade deliberately.
    client = new Stripe(key)
  }
  return client
}
