import { NextResponse } from 'next/server'
import { isStripeConfigured, stripe } from '@/lib/stripe'
import { clientKey, rateLimit } from '@/lib/rate-limit'
import {
  formatUsd,
  getProduct,
  isLicenseEnabled,
  priceCents,
  storeEnabled,
  type LicenseId,
} from '@/lib/photography-products'

export const dynamic = 'force-dynamic'

/**
 * Creates a Stripe Checkout Session for one catalog product and returns its URL.
 *
 * The client sends only { productId, license }. The price and product name are
 * resolved on the server from the catalog and passed to Stripe as inline
 * price_data — so there are no 50+ Stripe Price objects to hand-maintain, and a
 * tampered client can't change what it's charged. The productId + license ride
 * along as metadata for the webhook to fulfill.
 */
export async function POST(request: Request) {
  if (!storeEnabled()) {
    return NextResponse.json({ error: 'store_disabled' }, { status: 503 })
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 })
  }
  if (!rateLimit(`checkout:${clientKey(request)}`, 20, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let body: { productId?: unknown; license?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const productId = typeof body.productId === 'string' ? body.productId : ''
  const license: LicenseId = body.license === 'commercial' ? 'commercial' : 'personal'

  const product = getProduct(productId)
  if (!product) {
    return NextResponse.json({ error: 'unknown_product' }, { status: 400 })
  }
  if (!isLicenseEnabled(license)) {
    return NextResponse.json({ error: 'license_unavailable' }, { status: 400 })
  }

  const amount = priceCents(product, license)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const licenseLabel = license === 'commercial' ? 'Commercial license' : 'Personal license'

  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      allow_promotion_codes: true,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: `${product.title} — ${formatUsd(amount)}`,
              description: `${product.type === 'collection' ? 'Full-resolution collection' : 'High-resolution digital download'} · ${licenseLabel}`,
              ...(product.previewSrc.startsWith('http')
                ? { images: [product.previewSrc] }
                : {}),
            },
          },
        },
      ],
      // We collect the buyer's email so downloads can be re-sent later.
      customer_creation: 'always',
      metadata: { productId: product.id, license },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/photography`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] failed to create session:', err)
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 })
  }
}
