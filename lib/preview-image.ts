// Client-SAFE preview-image helpers.
//
// Watermarked gallery previews are theft-protected JPEGs stored in Cloudflare R2.
// There are two serving modes; `previewSrc` picks whichever is configured:
//
//   1. Same-bucket signed URLs (default, no extra infra). Previews live in the
//      SAME private bucket as the originals under a "previews/" prefix, and are
//      served via the /api/preview route which mints short-lived signed URLs.
//      Turn on with NEXT_PUBLIC_PREVIEWS_ENABLED=true.
//
//   2. Public CDN (optional upgrade). If the previews are put behind a public
//      custom domain, set NEXT_PUBLIC_PREVIEW_BASE_URL to that base and previews
//      are linked directly (cacheable, no server round-trip). Takes precedence.
//
// When neither is configured (local dev, or before previews exist) these return
// null so callers fall back to the bundled local image.

import type { Photo } from '@/data/photos'

/** The optional public preview CDN base, without a trailing slash, or null. */
export function previewBaseUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL?.trim()
  return base ? base.replace(/\/+$/, '') : null
}

/** Whether same-bucket signed-URL previews are switched on. */
export function previewsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PREVIEWS_ENABLED === 'true'
}

/**
 * URL of a photo's watermarked preview, or null when previews aren't configured
 * (caller should fall back to `photo.src`).
 */
export function previewSrc(photo: Pick<Photo, 'src'>): string | null {
  const rel = photo.src.replace(/^\/+photos\//, '')
  // src wasn't under /photos/ — there's no preview mapping for it.
  if (rel === photo.src) return null

  const base = previewBaseUrl()
  if (base) return `${base}/${rel}` // public CDN fast-path

  if (previewsEnabled()) return `/api/preview?src=${encodeURIComponent(photo.src)}`

  return null
}
