// Keeps the Instagram long-lived access token alive, and emails when it can't.
//
// Tokens from the Instagram API with Instagram Login last 60 days, but Meta
// lets you trade an unexpired token that is at least 24 hours old for a fresh
// 60-day one. A token refreshed on a schedule therefore never expires, which
// removes the "it died weeks ago and the photography stats have looked empty
// ever since" cycle entirely.
//
// A refresh returns a NEW token string, so it has to be persisted somewhere
// writable — environment variables on Hostinger are not. The live token lives
// in MySQL (one row in `instagram_token`), with INSTAGRAM_ACCESS_TOKEN as the
// seed for the first run and as the fallback whenever the database is
// unreachable. Rotating INSTAGRAM_ACCESS_TOKEN by hand still works: a changed
// env value is detected by fingerprint and takes over the stored row.
//
// Email alerts are the backstop for everything refreshing cannot fix (a revoked
// token, a removed permission, an app in the wrong state): see maybeAlert().

import { createHash } from 'node:crypto'
import { tokensDb, describeDbError, isDbConfigured } from '@/lib/db'
import { isEmailConfigured, sendAlertEmail } from '@/lib/email'

const REFRESH_URL = 'https://graph.instagram.com/refresh_access_token'

const DAY_MS = 24 * 60 * 60 * 1000
/** Refresh once the token has less than this left — ample room to retry. */
const REFRESH_WHEN_REMAINING_MS = 30 * DAY_MS
/** Meta rejects a refresh for a token younger than 24h; leave a little slack. */
const MIN_TOKEN_AGE_MS = 25 * 60 * 60 * 1000
/** Re-send an unresolved alert this often, so a missed email isn't the end. */
const ALERT_RESEND_MS = 3 * DAY_MS
/** How often the opportunistic (traffic-driven) check may run per process. */
const MAINTENANCE_INTERVAL_MS = 6 * 60 * 60 * 1000
/** In-process cache for the active token, so stats fetches don't hit MySQL. */
const TOKEN_CACHE_TTL_MS = 5 * 60 * 1000

export type AlertStage = 'warning' | 'urgent' | 'expired' | 'refresh_failed'

// Higher rank = more serious. An alert is only emailed when the situation gets
// worse than the last one we sent about (or when the same problem goes stale).
const STAGE_RANK: Record<AlertStage, number> = {
  warning: 1,
  urgent: 2,
  refresh_failed: 3,
  expired: 4,
}

export interface TokenStatus {
  /** 'unconfigured' when there is no token at all; 'unknown' before the first refresh. */
  state: 'unconfigured' | 'unknown' | 'healthy' | 'warning' | 'urgent' | 'expired' | 'error'
  /** Epoch ms at which the active token expires, when known. */
  expiresAt: number | null
  daysRemaining: number | null
  /** Epoch ms of the last successful refresh. */
  refreshedAt: number | null
  refreshed: boolean
  alertStage: AlertStage | null
  alertSent: boolean
  /** Human-readable reason when something went wrong. */
  detail?: string
  /** True when the token only lives in the env var (no database to persist to). */
  envOnly: boolean
}

interface TokenRow {
  access_token: string
  seed_fingerprint: string
  expires_at: string | number | null
  refreshed_at: string | number | null
  alert_stage: string | null
  alert_sent_at: string | number | null
}

interface TokenState {
  token: string
  seedFingerprint: string
  expiresAt: number | null
  refreshedAt: number | null
  alertStage: AlertStage | null
  alertSentAt: number | null
}

function fingerprint(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** mysql2 hands BIGINT back as a string under some driver configurations. */
function toMs(value: string | number | null): number | null {
  if (value == null) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function daysFrom(expiresAt: number | null): number | null {
  if (expiresAt == null) return null
  return Math.floor((expiresAt - Date.now()) / DAY_MS)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Reading the active token ────────────────────────────────────────────────

let tokenCache: { token: string | null; fetchedAt: number } | null = null

/**
 * The token to authenticate Instagram calls with: the stored (refreshed) one
 * when the database has it, otherwise INSTAGRAM_ACCESS_TOKEN. Never throws —
 * a database problem just falls back to the env var.
 */
export async function getInstagramToken(): Promise<string | null> {
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN || null
  if (!isDbConfigured()) return envToken
  if (tokenCache && Date.now() - tokenCache.fetchedAt < TOKEN_CACHE_TTL_MS) {
    return tokenCache.token ?? envToken
  }
  try {
    const state = await loadState()
    // A hand-edited env var wins until the next maintenance run reconciles it.
    const stored =
      state && (!envToken || state.seedFingerprint === fingerprint(envToken)) ? state.token : null
    tokenCache = { token: stored, fetchedAt: Date.now() }
    return stored ?? envToken
  } catch (err) {
    console.error('[instagram] token lookup failed:', describeDbError(err))
    return envToken
  }
}

// ── Persistence ─────────────────────────────────────────────────────────────

async function loadState(): Promise<TokenState | null> {
  const pool = await tokensDb()
  const [rows] = await pool.query('SELECT * FROM instagram_token WHERE id = 1')
  const row = (rows as TokenRow[])[0]
  if (!row) return null
  const stage = row.alert_stage
  return {
    token: row.access_token,
    seedFingerprint: row.seed_fingerprint,
    expiresAt: toMs(row.expires_at),
    refreshedAt: toMs(row.refreshed_at),
    alertStage: stage && stage in STAGE_RANK ? (stage as AlertStage) : null,
    alertSentAt: toMs(row.alert_sent_at),
  }
}

async function saveState(state: TokenState): Promise<void> {
  const pool = await tokensDb()
  await pool.query(
    `INSERT INTO instagram_token
       (id, access_token, seed_fingerprint, expires_at, refreshed_at, alert_stage, alert_sent_at)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       access_token = VALUES(access_token),
       seed_fingerprint = VALUES(seed_fingerprint),
       expires_at = VALUES(expires_at),
       refreshed_at = VALUES(refreshed_at),
       alert_stage = VALUES(alert_stage),
       alert_sent_at = VALUES(alert_sent_at)`,
    [
      state.token,
      state.seedFingerprint,
      state.expiresAt,
      state.refreshedAt,
      state.alertStage,
      state.alertSentAt,
    ],
  )
  tokenCache = { token: state.token, fetchedAt: Date.now() }
}

// ── Refreshing ──────────────────────────────────────────────────────────────

type RefreshFailure =
  /** The token is dead or the app lost access — only a human can fix this. */
  | { kind: 'fatal'; detail: string }
  /** Meta refuses to refresh a token younger than 24h. Harmless; retry later. */
  | { kind: 'too_young'; detail: string }
  /** Network blip or a 5xx. Not worth an email; the next run will retry. */
  | { kind: 'transient'; detail: string }

type RefreshResult =
  | { ok: true; token: string; expiresIn: number }
  | ({ ok: false } & RefreshFailure)

async function refreshToken(token: string): Promise<RefreshResult> {
  let res: Response
  try {
    res = await fetch(
      `${REFRESH_URL}?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`,
      { cache: 'no-store' },
    )
  } catch (err) {
    return { ok: false, kind: 'transient', detail: `network error: ${String(err)}` }
  }

  if (res.ok) {
    const body = (await res.json().catch(() => null)) as {
      access_token?: string
      expires_in?: number
    } | null
    if (!body?.access_token) {
      return { ok: false, kind: 'transient', detail: 'refresh returned no access_token' }
    }
    // Fall back to 60 days if Meta ever omits expires_in, so we still schedule.
    return { ok: true, token: body.access_token, expiresIn: body.expires_in ?? 60 * 24 * 60 * 60 }
  }

  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string; type?: string; code?: number; error_subcode?: number }
  } | null
  const error = body?.error
  const message = error?.message ?? `HTTP ${res.status}`
  const detail = `${message}${error?.code != null ? ` (code ${error.code})` : ''}`

  // Meta phrases this a few ways; all of them mean "come back later", not "broken".
  if (/24 hours|too soon|not old enough/i.test(message)) {
    return { ok: false, kind: 'too_young', detail }
  }
  // 190 = invalid/expired OAuth token. 10 and 200 = the app no longer holds the
  // required permission. Both need the token re-issued by hand.
  if (
    error?.type === 'OAuthException' ||
    error?.code === 190 ||
    error?.code === 10 ||
    error?.code === 200
  ) {
    return { ok: false, kind: 'fatal', detail }
  }
  if (res.status >= 500) return { ok: false, kind: 'transient', detail }
  return { ok: false, kind: 'fatal', detail }
}

// ── Alerting ────────────────────────────────────────────────────────────────

function alertCopy(stage: AlertStage, status: TokenStatus): { subject: string; lead: string } {
  const days = status.daysRemaining
  switch (stage) {
    case 'expired':
      return {
        subject: 'Instagram token has expired — photography stats are degraded',
        lead: 'The Instagram access token is no longer valid, so the photography page has dropped back to site-only stats: no follower count, and no "likes on Instagram" figures. It needs to be re-issued by hand.',
      }
    case 'refresh_failed':
      return {
        subject: 'Instagram token could not be refreshed — action needed',
        lead: 'Automatic renewal of the Instagram access token failed. The current token may still work for now, but it will expire unless this is sorted out.',
      }
    case 'urgent':
      return {
        subject: `Instagram token expires in ${days} day${days === 1 ? '' : 's'}`,
        lead: 'Automatic renewal has not succeeded and the token is about to expire. Once it does, the photography page loses its Instagram figures.',
      }
    case 'warning':
      return {
        subject: `Instagram token expires in ${days} days`,
        lead: 'The Instagram access token is approaching expiry and automatic renewal has not managed to extend it yet.',
      }
  }
}

function alertHtml(stage: AlertStage, status: TokenStatus): string {
  const { lead } = alertCopy(stage, status)
  const expiry =
    status.expiresAt != null
      ? new Date(status.expiresAt).toUTCString()
      : 'unknown — the token has never been successfully refreshed'
  const detail = status.detail
    ? `<p style="margin:0 0 16px;color:#52525b"><strong>Reported by Instagram:</strong> ${escapeHtml(status.detail)}</p>`
    : ''

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#18181b">
    <h1 style="font-size:20px;margin:0 0 8px">Instagram access token</h1>
    <p style="margin:0 0 16px;color:#52525b">${escapeHtml(lead)}</p>
    ${detail}
    <p style="margin:0 0 16px;color:#52525b"><strong>Expires:</strong> ${escapeHtml(expiry)}</p>
    <h2 style="font-size:15px;margin:0 0 8px">To fix it</h2>
    <ol style="padding-left:18px;margin:0 0 20px;color:#3f3f46;line-height:1.6">
      <li>Open your app in the <a href="https://developers.facebook.com/apps" style="color:#e11d48">Meta app dashboard</a> &rarr; Instagram &rarr; API setup with Instagram login.</li>
      <li>Generate a new long-lived Instagram User access token for @cmc.snaps.</li>
      <li>Set it as <code>INSTAGRAM_ACCESS_TOKEN</code> in the app's environment variables and restart.</li>
    </ol>
    <p style="margin:0;color:#a1a1aa;font-size:12px">The new value is picked up automatically and takes over from the stored token, after which renewal resumes on its own. The site stays up either way &mdash; only the Instagram figures are affected.</p>
  </div>`
}

/**
 * Emails about `stage` unless we've already said the same thing recently.
 * Returns the stage/timestamp to persist so the next run can make the same call.
 */
async function maybeAlert(
  stage: AlertStage | null,
  previous: { stage: AlertStage | null; sentAt: number | null },
  status: TokenStatus,
): Promise<{ stage: AlertStage | null; sentAt: number | null; sent: boolean }> {
  // Recovered: clear the record so the next problem alerts immediately.
  if (!stage) return { stage: null, sentAt: null, sent: false }

  const worsened = !previous.stage || STAGE_RANK[stage] > STAGE_RANK[previous.stage]
  const stale = previous.sentAt != null && Date.now() - previous.sentAt > ALERT_RESEND_MS
  if (!worsened && !stale) return { stage: previous.stage, sentAt: previous.sentAt, sent: false }

  const { subject } = alertCopy(stage, status)
  const sent = await sendAlertEmail(subject, alertHtml(stage, status))
  // If the email couldn't go out, don't record it as sent — retry next run.
  if (!sent) return { stage: previous.stage, sentAt: previous.sentAt, sent: false }
  return { stage, sentAt: Date.now(), sent: true }
}

// ── The maintenance routine ─────────────────────────────────────────────────

function unmanagedStatus(state: TokenStatus['state'], detail: string, envOnly: boolean): TokenStatus {
  return {
    state,
    expiresAt: null,
    daysRemaining: null,
    refreshedAt: null,
    refreshed: false,
    alertStage: null,
    alertSent: false,
    envOnly,
    detail,
  }
}

/**
 * Renews the Instagram token when it's getting on, and emails when it can't.
 * Safe to call as often as you like — it only talks to Meta when a refresh is
 * actually due. Never throws; failures are reported in the returned status.
 *
 * @param force attempt a refresh even when one isn't due yet. Meta's 24-hour
 *              minimum token age still applies.
 */
export async function ensureFreshInstagramToken(force = false): Promise<TokenStatus> {
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN || null

  if (!isDbConfigured()) {
    // There's no store to persist a refreshed token into, so renewal isn't
    // possible. Report that rather than silently doing nothing.
    return unmanagedStatus(
      envToken ? 'unknown' : 'unconfigured',
      envToken
        ? 'database not configured — the token cannot be renewed automatically'
        : 'INSTAGRAM_ACCESS_TOKEN is not set',
      true,
    )
  }

  try {
    let state = await loadState()

    // Seed on first run, and let a hand-rotated env var take over the row.
    if (envToken) {
      const seed = fingerprint(envToken)
      if (!state || state.seedFingerprint !== seed) {
        state = {
          token: envToken,
          seedFingerprint: seed,
          expiresAt: null,
          refreshedAt: null,
          alertStage: null,
          alertSentAt: null,
        }
        await saveState(state)
      }
    }

    if (!state) {
      return unmanagedStatus(
        'unconfigured',
        'INSTAGRAM_ACCESS_TOKEN is not set and no token is stored',
        false,
      )
    }

    const previousAlert = { stage: state.alertStage, sentAt: state.alertSentAt }
    let refreshed = false
    let detail: string | undefined
    let failureKind: RefreshFailure['kind'] | null = null

    // An unknown expiry means this token has never been refreshed, so do it
    // now — that's also how we find out when it runs out.
    const remaining = state.expiresAt != null ? state.expiresAt - Date.now() : null
    const due = remaining == null || remaining < REFRESH_WHEN_REMAINING_MS
    const oldEnough = state.refreshedAt == null || Date.now() - state.refreshedAt > MIN_TOKEN_AGE_MS

    if ((due || force) && oldEnough) {
      const result = await refreshToken(state.token)
      if (result.ok) {
        state = {
          ...state,
          token: result.token,
          expiresAt: Date.now() + result.expiresIn * 1000,
          refreshedAt: Date.now(),
        }
        refreshed = true
      } else {
        detail = result.detail
        failureKind = result.kind
        if (result.kind === 'fatal') {
          console.error('[instagram] token refresh failed:', result.detail)
        } else {
          console.warn(`[instagram] token refresh skipped (${result.kind}):`, result.detail)
        }
        // A fatal error on a token of unknown expiry means it's already dead.
        if (result.kind === 'fatal' && state.expiresAt == null) {
          state = { ...state, expiresAt: Date.now() }
        }
      }
    }

    const days = daysFrom(state.expiresAt)

    // Work out how bad things are, worst case first.
    let stage: AlertStage | null = null
    let reportedState: TokenStatus['state'] = 'healthy'
    if (days != null && days <= 0) {
      stage = 'expired'
      reportedState = 'expired'
    } else if (days != null && days <= 3) {
      stage = 'urgent'
      reportedState = 'urgent'
    } else if (days != null && days <= 14) {
      stage = 'warning'
      reportedState = 'warning'
    } else if (failureKind === 'fatal') {
      // Renewal is broken in a way only a human can fix, but there's still
      // time on the clock — say so now rather than waiting for the deadline.
      // (A fatal failure on a token of unknown expiry was dated above, so it
      // has already been caught by the days <= 0 branch.)
      stage = 'refresh_failed'
      reportedState = 'error'
    } else if (state.expiresAt == null) {
      // Seeded but not yet renewable — Meta rejects tokens under 24h old — or
      // a transient blip. Both resolve on their own within a run or two, so
      // they get no alert; if one somehow persists, the expiry ladder above
      // becomes the safety net as the deadline approaches.
      reportedState = 'unknown'
    }

    const status: TokenStatus = {
      state: reportedState,
      expiresAt: state.expiresAt,
      daysRemaining: days,
      refreshedAt: state.refreshedAt,
      refreshed,
      alertStage: stage,
      alertSent: false,
      envOnly: false,
      detail,
    }

    const alert = await maybeAlert(stage, previousAlert, status)
    status.alertSent = alert.sent
    await saveState({ ...state, alertStage: alert.stage, alertSentAt: alert.sentAt })

    return status
  } catch (err) {
    const message = describeDbError(err)
    console.error('[instagram] token maintenance failed:', message)
    return unmanagedStatus('error', message, false)
  }
}

// ── Opportunistic trigger ───────────────────────────────────────────────────

let lastMaintenanceAt = 0

/**
 * Runs maintenance at most every few hours, piggybacking on normal site
 * traffic. This alone keeps the token alive on any site that gets visitors;
 * the cron endpoint (/api/instagram/token) exists so renewal doesn't depend
 * on someone happening to load the page.
 */
export function maybeRunTokenMaintenance(): void {
  if (!isDbConfigured() || !process.env.INSTAGRAM_ACCESS_TOKEN) return
  if (Date.now() - lastMaintenanceAt < MAINTENANCE_INTERVAL_MS) return
  lastMaintenanceAt = Date.now()
  // Deliberately not awaited — this must never add latency to a page request.
  void ensureFreshInstagramToken().catch((err) => {
    console.error('[instagram] background token maintenance failed:', err)
  })
}

/** True when an alert could actually be delivered. Surfaced for diagnostics. */
export function isAlertingConfigured(): boolean {
  return isEmailConfigured() && Boolean(process.env.ALERT_EMAIL_TO ?? process.env.EMAIL_REPLY_TO)
}
