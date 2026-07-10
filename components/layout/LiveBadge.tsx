'use client'

import { useTwitchLive } from './twitch-live-context'

interface LiveBadgeProps {
  /**
   * Ring color that blends the badge into its background. Defaults to the
   * header/light surface; pass e.g. `ring-brand-deeper` on dark surfaces.
   */
  ringClassName?: string
}

/**
 * A pulsing red dot that appears over the Twitch icon only while the channel is
 * live. Renders nothing when offline. The parent element must be positioned
 * (e.g. `relative`) for the absolute placement to anchor correctly.
 */
export function LiveBadge({
  ringClassName = 'ring-white dark:ring-surface-nav-dark',
}: LiveBadgeProps) {
  const live = useTwitchLive()
  if (!live) return null

  return (
    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ${ringClassName}`} />
    </span>
  )
}
