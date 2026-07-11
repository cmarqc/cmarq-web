'use client'

import { useState } from 'react'
import { FiShoppingBag, FiLoader } from 'react-icons/fi'
import { formatUsd, type LicenseId } from '@/lib/store-display'

interface PurchaseButtonProps {
  productId: string
  /** Price in cents, for the button label. */
  priceCents: number
  license?: LicenseId
  /** Overrides the default "Purchase — $X" label. */
  label?: string
  className?: string
}

/**
 * Kicks off Stripe Checkout for a single product. Sends only { productId,
 * license } to /api/checkout — the server resolves the price — then redirects
 * the browser to the Stripe-hosted payment page.
 */
export function PurchaseButton({
  productId,
  priceCents,
  license = 'personal',
  label,
  className,
}: PurchaseButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  const startCheckout = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, license }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'checkout_failed')
      window.open(data.url, '_blank', 'noopener,noreferrer')
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={(e) => {
          e.stopPropagation()
          void startCheckout()
        }}
        disabled={status === 'loading'}
        className={
          className ??
          'flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-70 text-white text-sm font-semibold transition-colors duration-200'
        }
      >
        {status === 'loading' ? (
          <FiLoader size={15} className="animate-spin" />
        ) : (
          <FiShoppingBag size={15} />
        )}
        {label ?? `Purchase — ${formatUsd(priceCents)}`}
      </button>
      {status === 'error' && (
        <p className="mt-2 text-xs text-red-500" role="alert">
          Something went wrong starting checkout. Please try again.
        </p>
      )}
    </div>
  )
}
