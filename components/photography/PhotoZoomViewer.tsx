'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FiX, FiZoomIn, FiZoomOut, FiMaximize2 } from 'react-icons/fi'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { Photo } from '@/data/photos'
import { previewSrc } from '@/lib/preview-image'

interface PhotoZoomViewerProps {
  photo: Photo
  onClose: () => void
}

/**
 * Full-screen, zoom-and-pan view of a photo's watermarked preview. Opened from
 * the lightbox for close inspection. Because the watermark is burned into the
 * preview pixels, zooming/panning can never reveal a clean copy — the mark scales
 * right along with the image.
 *
 * Wheel / pinch to zoom, drag to pan, double-click to zoom in. Falls back to the
 * bundled local image if the preview URL fails to load.
 */
export function PhotoZoomViewer({ photo, onClose }: PhotoZoomViewerProps) {
  const [src, setSrc] = useState(() => previewSrc(photo) ?? photo.src)

  // Escape closes the zoom view only. stopPropagation keeps the lightbox behind
  // it from also reacting (it additionally guards on its own open-state).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const control =
    'w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black"
    >
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={6}
        doubleClick={{ mode: 'zoomIn', step: 0.9 }}
        // In smooth mode the zoom per wheel event is step × |deltaY|, and a mouse
        // notch reports |deltaY| ≈ 100 — so keep step small (a hair below the
        // library's 0.015 default) or a single scroll rockets straight to maxScale.
        wheel={{ step: 0.004 }}
        centerOnInit
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Controls */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button onClick={() => zoomOut()} className={control} aria-label="Zoom out">
                <FiZoomOut size={18} />
              </button>
              <button onClick={() => zoomIn()} className={control} aria-label="Zoom in">
                <FiZoomIn size={18} />
              </button>
              <button
                onClick={() => resetTransform()}
                className={control}
                aria-label="Reset zoom"
              >
                <FiMaximize2 size={18} />
              </button>
              <button onClick={onClose} className={control} aria-label="Close full view">
                <FiX size={20} />
              </button>
            </div>

            {/* Hint */}
            <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/50 px-4 py-1.5 text-xs text-white/80">
              Scroll or pinch to zoom · drag to pan
            </p>

            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ width: '100%', height: '100%' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={photo.title}
                draggable={false}
                onError={() => {
                  if (src !== photo.src) setSrc(photo.src)
                }}
                className="h-full w-full select-none object-contain"
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </motion.div>
  )
}
