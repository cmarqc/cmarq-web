'use client'

import { ThemeProvider } from 'next-themes'
import { TwitchLiveProvider } from '@/components/layout/twitch-live-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TwitchLiveProvider>{children}</TwitchLiveProvider>
    </ThemeProvider>
  )
}
