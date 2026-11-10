import { NextResponse } from 'next/server'
import {
  ensureFreshInstagramToken,
  isAlertingConfigured,
  type TokenStatus,
} from '@/lib/instagram-token'

export const dynamic = 'force-dynamic'

// Token upkeep endpoint, meant for a scheduler (Hostinger hPanel → Advanced →
// Cron Jobs, or any uptime pinger):
//
//   curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
//     https://your-domain.com/api/instagram/token
//
// Daily is plenty. It renews the long-lived Instagram token when it's getting
// on and emails if it can't, so the photography page never quietly loses its
// Instagram figures. Normal site traffic triggers the same routine (see
// lib/instagram.ts), so this is belt-and-braces for quiet periods.
//
// Add `?force=1` to attempt a refresh even when one isn't due — handy right
// after pasting in a new token, though Meta still refuses tokens under 24h old.
//
// Protected by CRON_SECRET. Without that set the route is available only in
// development, so an unprotected deployment can't have its token poked at.

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  const header = request.headers.get('authorization')
  if (header === `Bearer ${secret}`) return true
  // Query-string form, for schedulers that can't send custom headers.
  return new URL(request.url).searchParams.get('key') === secret
}

/** The token is never included — only whether it's healthy and until when. */
function publicStatus(status: TokenStatus) {
  return {
    state: status.state,
    expiresAt: status.expiresAt != null ? new Date(status.expiresAt).toISOString() : null,
    daysRemaining: status.daysRemaining,
    lastRefreshedAt:
      status.refreshedAt != null ? new Date(status.refreshedAt).toISOString() : null,
    refreshedNow: status.refreshed,
    alert: status.alertStage,
    alertEmailSent: status.alertSent,
    alertingConfigured: isAlertingConfigured(),
    autoRenewal: status.envOnly ? 'unavailable (no database)' : 'enabled',
    detail: status.detail ?? null,
  }
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const force = new URL(request.url).searchParams.get('force') === '1'
  const status = await ensureFreshInstagramToken(force)

  // Non-200 for trouble, so a cron job that mails on failure flags it too,
  // independently of whether our own alert email made it out.
  const unhealthy = status.state === 'expired' || status.state === 'error'
  return NextResponse.json(publicStatus(status), { status: unhealthy ? 503 : 200 })
}
