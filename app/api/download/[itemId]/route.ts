import { NextResponse } from 'next/server'
import { clientKey, rateLimit } from '@/lib/rate-limit'
import { isR2Configured, objectExists, presignDownloadUrl } from '@/lib/r2'
import {
  claimDownload,
  downloadFileName,
  DOWNLOAD_LIMIT,
  getItemWithOrder,
} from '@/lib/orders'

export const dynamic = 'force-dynamic'

/**
 * Secure download endpoint. The purchase page links here with the order's access
 * token. The flow:
 *   1. Load the item + its order.
 *   2. Verify the token matches the owning order and the order is paid.
 *   3. Atomically claim one download against the per-item limit.
 *   4. Mint a short-lived presigned R2 URL and redirect to it.
 *
 * The original's R2 key is never exposed; the buyer only ever sees a temporary
 * signed URL. A fabricated `?token=` can't match a random 256-bit access token.
 */
export async function GET(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: 'downloads_unavailable' }, { status: 503 })
  }
  if (!rateLimit(`download:${clientKey(request)}`, 60, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const { itemId } = await params
  const id = Number(itemId)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'invalid_item' }, { status: 400 })
  }

  const token = new URL(request.url).searchParams.get('token') ?? ''
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const found = await getItemWithOrder(id)
  // Same generic 403 whether the item is missing or the token is wrong, so the
  // endpoint doesn't confirm which item ids exist.
  if (!found || found.order.accessToken !== token) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (found.order.status !== 'paid') {
    return NextResponse.json({ error: 'not_paid' }, { status: 402 })
  }

  // Fail clearly if the original was never uploaded, instead of redirecting the
  // buyer to R2's raw "NoSuchKey" XML — and don't burn a download on a 404.
  if (!(await objectExists(found.item.objectKey))) {
    console.error(`[download] object missing in R2: ${found.item.objectKey}`)
    return NextResponse.json(
      { error: 'file_unavailable', key: found.item.objectKey },
      { status: 404 },
    )
  }

  const claim = await claimDownload(id, clientKey(request))
  if (!claim.allowed) {
    return NextResponse.json(
      { error: 'download_limit_reached', limit: DOWNLOAD_LIMIT },
      { status: 429 },
    )
  }

  try {
    const url = await presignDownloadUrl(
      found.item.objectKey,
      downloadFileName({ title: found.item.title, objectKey: found.item.objectKey }),
    )
    return NextResponse.redirect(url, 302)
  } catch (err) {
    console.error('[download] failed to presign url:', err)
    return NextResponse.json({ error: 'download_failed' }, { status: 500 })
  }
}
