'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMapPin, FiShoppingBag, FiZoomIn } from 'react-icons/fi'
import type { Photo } from '@/data/photos'

interface PhotoCardProps {
  photo: Photo
  onExpand: (photo: Photo) => void
}

export function PhotoCard({ photo, onExpand }: PhotoCardProps) {
  const [hovered, setHovered] = useState(false)

  const purchaseHref = `/contact?subject=${encodeURIComponent(`Print Inquiry: ${photo.title}`)}`

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 cursor-pointer group"
      style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onExpand(photo)}
    >
      <Image
        src={photo.thumbnail}
        alt={photo.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Hover overlay */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/55 flex flex-col justify-between p-4"
          >
            {/* Expand button top-right */}
            <div className="flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onExpand(photo)
                }}
                className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
                aria-label="Expand photo"
              >
                <FiZoomIn size={16} />
              </button>
            </div>

            {/* Caption bottom */}
            <div>
              <p className="text-white font-semibold text-sm leading-tight mb-1">{photo.title}</p>
              {photo.location && (
                <p className="flex items-center gap-1 text-white/70 text-xs mb-3">
                  <FiMapPin size={10} />
                  {photo.location}
                </p>
              )}
              {photo.available && photo.price != null && (
                <Link
                  href={purchaseHref}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 w-full justify-center px-3 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-colors duration-200"
                >
                  <FiShoppingBag size={12} />
                  Purchase Print — from ${photo.price}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
