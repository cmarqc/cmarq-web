import { FiDownload, FiImage, FiPackage } from 'react-icons/fi'
import { DOWNLOAD_LIMIT, type OrderWithItems } from '@/lib/orders'
import { formatUsd } from '@/lib/store-display'

/**
 * Renders the download links for a fulfilled order. Server component: the access
 * token is baked into the `/api/download/...` hrefs, which re-verify it before
 * handing back a short-lived R2 URL. Shared by the success and purchases pages.
 */
export function OrderDownloads({ order }: { order: OrderWithItems }) {
  return (
    <div className="space-y-4">
      {order.items.map((item) => {
        const remaining = Math.max(0, DOWNLOAD_LIMIT - item.downloadCount)
        const isCollection = item.productType === 'collection'
        return (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <div className="w-11 h-11 rounded-lg bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand shrink-0">
              {isCollection ? <FiPackage size={20} /> : <FiImage size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {item.title}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isCollection ? 'Full-resolution collection (ZIP)' : 'High-resolution JPEG'} ·{' '}
                {item.license === 'commercial' ? 'Commercial license' : 'Personal license'} ·{' '}
                {remaining} of {DOWNLOAD_LIMIT} downloads left
              </p>
            </div>
            <a
              href={`/api/download/${item.id}?token=${order.accessToken}`}
              className="btn-primary shrink-0 justify-center"
              aria-disabled={remaining === 0}
            >
              <FiDownload size={16} />
              Download
            </a>
          </div>
        )
      })}

      <p className="text-sm text-zinc-500 dark:text-zinc-400 pt-2">
        Total paid: {formatUsd(order.amountTotal)} {order.currency.toUpperCase()}
      </p>
    </div>
  )
}
