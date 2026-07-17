import { NextResponse } from 'next/server'
import { clientKey, rateLimit } from '@/lib/rate-limit'
import { isR2Configured, presignPreviewUrl } from '@/lib/r2'

export const dynamic = 'force-dynamic'

/**
 * Watermarked-preview endpoint. The gallery points an <img> at
 * `/api/preview?src=/photos/<Collection>/<file>.jpg`; this validates the path,
 * mints a short-lived signed URL for the matching `previews/<...>` object in the
 * (private) R2 bucket, and 302-redirects the browser straight to R2.
 *
 * The `previews/` prefix is hard-coded, so this can never be coerced into signing
 * a private original under `photos/`. When R2 isn't configured or the preview
 * hasn't been generated yet, the caller's <img> onError falls back to the local
 * bundled image.
 */
export async function GET(request: Request) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: 'previews_unavailable' }, { status: 503 })
  }
  if (!rateLimit(`preview:${clientKey(request)}`, 240, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const src = new URL(request.url).searchParams.get('src') ?? ''
  const rel = toPreviewRel(src)
  if (!rel) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  try {
    const url = await presignPreviewUrl(`previews/${rel}`)
    const res = NextResponse.redirect(url, 302)
    // Let the browser reuse the redirect briefly so panning prev/next doesn't
    // re-sign on every keystroke; well under the signed URL's own TTL.
    res.headers.set('Cache-Control', 'private, max-age=300')
    return res
  } catch (err) {
    console.error('[preview] failed to presign url:', err)
    return NextResponse.json({ error: 'preview_failed' }, { status: 500 })
  }
}

/**
 * Turn a public gallery src ("/photos/Europe/Europe-1.jpg") into the decoded R2
 * key suffix ("Europe/Europe-1.jpg"), or null if it isn't a well-formed,
 * in-gallery JPEG path. Rejects traversal and anything outside /photos/.
 */
function toPreviewRel(src: string): string | null {
  if (!src.startsWith('/photos/')) return null
  let rel = src.slice('/photos/'.length)
  try {
    rel = decodeURIComponent(rel)
  } catch {
    return null
  }
  if (!rel || rel.startsWith('/') || rel.includes('..') || rel.includes('\\')) return null
  if (!/\.jpe?g$/i.test(rel)) return null
  return rel
}
