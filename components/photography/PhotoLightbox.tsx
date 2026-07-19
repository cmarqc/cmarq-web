'use client'

import Link from 'next/link'
import { Fragment, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiX,
  FiMapPin,
  FiCamera,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiHeart,
  FiInstagram,
  FiZoomIn,
} from 'react-icons/fi'
import type { Photo } from '@/data/photos'
import { getPhotoExif } from '@/data/photo-metadata'
import { PRICING, productIdForPhoto, storeEnabled } from '@/lib/store-display'
import { PurchaseButton } from './PurchaseButton'
import { PreviewImage } from './PreviewImage'
import { PhotoZoomViewer } from './PhotoZoomViewer'
import { usePhotoStats } from './photo-stats-context'

interface PhotoLightboxProps {
  photo: Photo
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}

export function PhotoLightbox({ photo, onClose, onPrev, onNext }: PhotoLightboxProps) {
  const { available, stats, isLiked, toggleLike, recordView } = usePhotoStats()
  const photoStats = stats[photo.id]
  const liked = isLiked(photo.id)
  const [zoomOpen, setZoomOpen] = useState(false)

  // Close the zoom view when navigating to a different photo.
  useEffect(() => {
    setZoomOpen(false)
  }, [photo.id])

  const exif = getPhotoExif(photo.src)
  const details: { label: string; value: string }[] = [
    { label: 'Camera', value: exif?.camera ?? photo.camera ?? '' },
    { label: 'Lens', value: exif?.lens ?? '' },
    { label: 'Date', value: exif?.dateTaken ?? '' },
    { label: 'Resolution', value: exif?.dimensions ?? '' },
    { label: 'Focal length', value: exif?.focalLength ?? '' },
    { label: 'Aperture', value: exif?.aperture ?? '' },
    { label: 'Shutter', value: exif?.shutterSpeed ?? '' },
    { label: 'ISO', value: exif?.iso != null ? String(exif.iso) : '' },
  ].filter((d) => d.value)

  useEffect(() => {
    recordView(photo.id)
  }, [photo.id, recordView])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // While the zoom view is open it owns the keyboard (Escape closes it).
      if (zoomOpen) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && onPrev) onPrev()
      if (e.key === 'ArrowRight' && onNext) onNext()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext, zoomOpen])

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
          aria-label="Close"
        >
          <FiX size={20} />
        </button>

        {/* Prev */}
        {onPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-brand text-white flex items-center justify-center transition-colors z-10"
            aria-label="Previous"
          >
            <FiChevronLeft size={20} />
          </button>
        )}

        {/* Next */}
        {onNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-brand text-white flex items-center justify-center transition-colors z-10"
            aria-label="Next"
          >
            <FiChevronRight size={20} />
          </button>
        )}

        {/* Image + info panel */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative max-w-5xl w-full flex flex-col lg:flex-row gap-0 rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Photo — watermarked preview; click to open the zoom/pan view */}
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="group relative flex-1 bg-black cursor-zoom-in"
            style={{ minHeight: '60vmin' }}
            aria-label="Open full-screen zoom view"
          >
            <PreviewImage
              photo={photo}
              className="absolute inset-0 h-full w-full object-contain select-none"
            />
            <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white/90 opacity-0 transition-opacity group-hover:opacity-100">
              <FiZoomIn size={13} />
              Click to zoom
            </span>
          </button>

          {/* Info panel */}
          <div className="w-full lg:w-64 shrink-0 bg-white dark:bg-zinc-900 p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{photo.title}</h2>
              {photo.location && (
                <p className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  <FiMapPin size={12} className="text-brand" />
                  {photo.location}
                </p>
              )}
            </div>

            <div className="w-8 h-0.5 bg-brand rounded-full" />

            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                {photo.category.length === 1 ? 'Category' : 'Categories'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {photo.category.map((cat) => (
                  <span key={cat} className="tag capitalize">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {details.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FiCamera size={12} className="text-brand" />
                  Details
                </p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  {details.map(({ label, value }) => (
                    <Fragment key={label}>
                      <dt className="text-zinc-400 dark:text-zinc-500">{label}</dt>
                      <dd className="text-right text-zinc-700 dark:text-zinc-300 break-words">
                        {value}
                      </dd>
                    </Fragment>
                  ))}
                </dl>
              </div>
            )}

            {available && (
              <div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleLike(photo.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      liked
                        ? 'bg-brand text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    aria-label={liked ? 'Unlike photo' : 'Like photo'}
                    aria-pressed={liked}
                  >
                    <FiHeart size={14} className={liked ? 'fill-current' : undefined} />
                    {photoStats?.likes ?? 0}
                  </button>
                  <span className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                    <FiEye size={14} />
                    {photoStats?.views ?? 0} views
                  </span>
                </div>
                {photoStats?.instagramLikes != null && (
                  <a
                    href={photoStats.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-brand transition-colors"
                  >
                    <FiInstagram size={12} />+{photoStats.instagramLikes} likes on Instagram
                  </a>
                )}
              </div>
            )}

            {storeEnabled() && (
              <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Full-resolution download, signed in the corner — no watermark.{' '}
                  <Link
                    href="/licensing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted underline-offset-2 hover:text-brand transition-colors"
                  >
                    Personal-use license
                  </Link>
                  .
                </p>
                <PurchaseButton
                  productId={productIdForPhoto(photo.id)}
                  priceCents={PRICING.photoPersonalCents}
                />
                <Link
                  href="/licensing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-xs text-zinc-500 dark:text-zinc-400 hover:text-brand transition-colors"
                >
                  View license details
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {zoomOpen && (
        <PhotoZoomViewer key="zoom" photo={photo} onClose={() => setZoomOpen(false)} />
      )}
    </AnimatePresence>
  )
}
