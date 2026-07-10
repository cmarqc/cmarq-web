import { NextResponse } from 'next/server'
import { getTwitchLive } from '@/lib/twitch'

export const dynamic = 'force-dynamic'

export async function GET() {
  const live = await getTwitchLive()
  return NextResponse.json({ live })
}
