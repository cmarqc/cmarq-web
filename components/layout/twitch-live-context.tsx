'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// Polled slightly slower than the server-side cache TTL (60s) so most client
// polls are served from cache and only occasionally hit Twitch.
const POLL_INTERVAL_MS = 90 * 1000

const TwitchLiveContext = createContext(false)

export function TwitchLiveProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      // Skip while the tab is hidden — no point polling a page nobody's viewing.
      if (document.visibilityState === 'hidden') return
      try {
        const res = await fetch('/api/twitch/status')
        if (!res.ok) return
        const body = (await res.json()) as { live?: boolean }
        if (!cancelled) setLive(Boolean(body.live))
      } catch {
        // Endpoint unreachable — leave the last known state; the badge just
        // won't appear/update. Never surface an error for a decorative badge.
      }
    }

    check()
    const id = setInterval(check, POLL_INTERVAL_MS)
    // Re-check immediately when the user returns to the tab, so someone who
    // left it open overnight sees an up-to-date badge.
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return <TwitchLiveContext.Provider value={live}>{children}</TwitchLiveContext.Provider>
}

/** Whether twitch.tv/cmarqq is currently live streaming. */
export function useTwitchLive() {
  return useContext(TwitchLiveContext)
}
