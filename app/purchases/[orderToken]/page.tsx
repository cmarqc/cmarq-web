import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FiDownloadCloud, FiArrowLeft } from 'react-icons/fi'
import { getOrderByToken } from '@/lib/orders'
import { OrderDownloads } from '@/components/photography/OrderDownloads'

export const metadata: Metadata = {
  title: 'Your downloads',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * The buyer's durable downloads page, reached via their private access token.
 * Bookmarkable and (later) emailable — it re-generates fresh, short-lived R2
 * links each time a Download button is clicked.
 */
export default async function PurchasesPage({
  params,
}: {
  params: Promise<{ orderToken: string }>
}) {
  const { orderToken } = await params
  const order = await getOrderByToken(orderToken).catch(() => null)

  if (!order) notFound()

  return (
    <div className="page-transition py-16 lg:py-24">
      <div className="page-container max-w-2xl">
        <div className="flex items-center gap-3 mb-2">
          <FiDownloadCloud className="text-brand" size={26} />
          <h1 className="section-heading mb-0">Your downloads</h1>
        </div>
        <div className="section-divider" />
        <p className="text-zinc-600 dark:text-zinc-300 mb-8">
          Thanks for your purchase. Your full-resolution{' '}
          {order.items.length > 1 ? 'files are' : 'file is'} ready below. Keep this page
          bookmarked — each download link is generated fresh and stays valid for a few minutes.
        </p>

        <div className="card">
          <OrderDownloads order={order} />
        </div>

        <Link href="/photography" className="btn-ghost mt-8 -ml-4">
          <FiArrowLeft size={16} />
          Back to Photography
        </Link>
      </div>
    </div>
  )
}
