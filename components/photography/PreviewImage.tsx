'use client'

import { useEffect, useState } from 'react'
import type { Photo } from '@/data/photos'
import { previewSrc } from '@/lib/preview-image'

interface PreviewImageProps {
  photo: Photo
  className?: string
}

/**
 * Renders a photo's watermarked R2 preview when one is configured, falling back
 * to the bundled local image if the preview URL is unset or fails to load.
 *
 * Uses a plain <img> (not next/image) because the R2 file is already sized and
 * watermarked — there's nothing for the Next optimizer to add, and this keeps the
 * heavy full-resolution bytes off the Hostinger server, served straight from the
 * Cloudflare CDN instead.
 */
export function PreviewImage({ photo, className }: PreviewImageProps) {
  const [src, setSrc] = useState(() => previewSrc(photo) ?? photo.src)

  // Reset to the new photo's preview when navigating prev/next in the lightbox.
  useEffect(() => {
    setSrc(previewSrc(photo) ?? photo.src)
  }, [photo])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={photo.title}
      className={className}
      draggable={false}
      onError={() => {
        // Preview missing/unreachable — fall back to the bundled local file once.
        if (src !== photo.src) setSrc(photo.src)
      }}
    />
  )
}
