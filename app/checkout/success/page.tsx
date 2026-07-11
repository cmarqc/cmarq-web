import type { Metadata } from 'next'
import Link from 'next/link'
import { FiCheckCircle, FiClock, FiArrowLeft } from 'react-icons/fi'
import { isStripeConfigured } from '@/lib/stripe'
import { isEmailConfigured } from '@/lib/email'
import { fulfillCheckoutSession } from '@/lib/orders'
import { OrderDownloads } from '@/components/photography/OrderDownloads'

export const metadata: Metadata = {
  title: 'Purchase complete',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Post-checkout landing page. Stripe redirects here with the session id. We
 * fulfill the order right here as a fallback (the webhook is the primary path,
 * but this makes downloads available immediately even if the webhook is delayed).
 * Fulfillment is idempotent, so calling it from both places is safe.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id: sessionId } = await searchParams

  const order =
    sessionId && isStripeConfigured()
      ? await fulfillCheckoutSession(sessionId).catch(() => null)
      : null

  return (
    <div className="page-transition py-16 lg:py-24">
      <div className="page-container max-w-2xl">
        {order ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <FiCheckCircle className="text-green-500" size={28} />
              <h1 className="section-heading mb-0">Thank you!</h1>
            </div>
            <div className="section-divider" />
            <p className="text-zinc-600 dark:text-zinc-300 mb-8">
              Your payment was successful. Download your full-resolution{' '}
              {order.items.length > 1 ? 'files' : 'file'} below.{' '}
              {isEmailConfigured() && order.customerEmail ? (
                <>
                  We also emailed a download link to <strong>{order.customerEmail}</strong>, but
                  it&apos;s a good idea to bookmark this page too.
                </>
              ) : (
                <>Bookmark this page so you can return to your downloads anytime.</>
              )}
            </p>

            <div className="card">
              <OrderDownloads order={order} />
            </div>

            <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
              Bookmark your private downloads page:{' '}
              <Link
                href={`/purchases/${order.accessToken}`}
                className="text-brand hover:underline break-all"
              >
                /purchases/{order.accessToken}
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-2">
              <FiClock className="text-brand" size={26} />
              <h1 className="section-heading mb-0">Finalizing your order…</h1>
            </div>
            <div className="section-divider" />
            <p className="text-zinc-600 dark:text-zinc-300 mb-8">
              Your payment is being confirmed. This usually takes only a moment — refresh
              this page shortly, or check your email for your download link. If this persists,
              reach out through the contact page and we&apos;ll sort it out.
            </p>
          </>
        )}

        <Link href="/photography" className="btn-ghost mt-8 -ml-4">
          <FiArrowLeft size={16} />
          Back to Photography
        </Link>
      </div>
    </div>
  )
}
