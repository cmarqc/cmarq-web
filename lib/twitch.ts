// Optional Twitch live-status check for twitch.tv/cmarqq.
//
// Requires TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET (register an app at
// https://dev.twitch.tv/console/apps — the "client credentials" grant needs no
// user login and no redirect flow). When either is absent or any request fails,
// the site treats the channel as offline — the live badge simply never shows,
// and nothing else on the page depends on Twitch being reachable.

const TWITCH_LOGIN = 'cmarqq'
const OAUTH_URL = 'https://id.twitch.tv/oauth2/token'
const STREAMS_URL = 'https://api.twitch.tv/helix/streams'
const LIVE_CACHE_TTL_MS = 60 * 1000 // 1 min; live status doesn't need to be fresher
const TOKEN_SAFETY_WINDOW_MS = 60 * 1000 // refresh a minute before real expiry

// App access tokens are long-lived (~60 days), so cache across requests.
let tokenCache: { token: string; expiresAt: number } | null = null
let liveCache: { isLive: boolean; fetchedAt: number } | null = null

async function twitchError(label: string, res: Response): Promise<Error> {
  let detail = ''
  try {
    const body = (await res.json()) as { message?: string }
    if (body.message) detail = ` — ${body.message}`
  } catch {
    // non-JSON body; status alone will have to do
  }
  return new Error(`${label} failed: ${res.status}${detail}`)
}

async function getAppToken(clientId: string, clientSecret: string): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - TOKEN_SAFETY_WINDOW_MS) {
    return tokenCache.token
  }
  const res = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw await twitchError('token request', res)
  const body = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!body.access_token) throw new Error('token request returned no access_token')
  tokenCache = {
    token: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
  }
  return tokenCache.token
}

/**
 * Whether twitch.tv/cmarqq is currently live. Returns false (never throws) when
 * credentials are missing or Twitch is unreachable, so callers can treat "not
 * live" and "can't tell" identically.
 */
export async function getTwitchLive(): Promise<boolean> {
  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET
  if (!clientId || !clientSecret) return false
  if (liveCache && Date.now() - liveCache.fetchedAt < LIVE_CACHE_TTL_MS) {
    return liveCache.isLive
  }

  try {
    const token = await getAppToken(clientId, clientSecret)
    const res = await fetch(`${STREAMS_URL}?user_login=${TWITCH_LOGIN}`, {
      headers: { 'Client-Id': clientId, Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    // A stale/revoked token surfaces as 401 — drop it so the next call re-mints.
    if (res.status === 401) tokenCache = null
    if (!res.ok) throw await twitchError('streams fetch', res)
    const body = (await res.json()) as { data?: { type?: string }[] }
    // The streams endpoint only returns a row while the channel is live; an
    // empty array means offline.
    const isLive = (body.data ?? []).some((s) => s.type === 'live')
    liveCache = { isLive, fetchedAt: Date.now() }
    return isLive
  } catch (err) {
    console.error('[twitch] live-status fetch failed:', err)
    // Cache the failure briefly so a broken token doesn't add latency to every
    // request, but keep the TTL short enough to recover quickly once fixed.
    liveCache = { isLive: false, fetchedAt: Date.now() }
    return false
  }
}
