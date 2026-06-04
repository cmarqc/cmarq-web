'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiMapPin, FiShoppingBag, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import type { Photo } from '@/data/photos'

interface PhotoLightboxProps {
  photo: Photo
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}

export function PhotoLightbox({ photo, onClose, onPrev, onNext }: PhotoLightboxProps) {
  const purchaseHref = `/contact?subject=${encodeURIComponent(`Print Inquiry: ${photo.title}`)}`

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
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
  }, [onClose, onPrev, onNext])

  return (
    <AnimatePresence>
      <motion.div
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
          {/* Photo */}
          <div className="relative flex-1 bg-black" style={{ minHeight: '60vmin' }}>
            <Image
              src={photo.src}
              alt={photo.title}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 75vw"
              priority
            />
          </div>

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
              {photo.camera && (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">{photo.camera}</p>
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

            {photo.available && photo.price != null && (
              <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">
                  Available as a print. Prices start from ${photo.price}. Contact me for size and
                  finish options.
                </p>
                <Link
                  href={purchaseHref}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors duration-200"
                >
                  <FiShoppingBag size={15} />
                  Inquire About a Print
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
