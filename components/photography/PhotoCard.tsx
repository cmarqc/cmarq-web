'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMapPin, FiShoppingBag, FiZoomIn, FiEye, FiHeart } from 'react-icons/fi'
import type { Photo } from '@/data/photos'
import { usePhotoStats } from './photo-stats-context'

interface PhotoCardProps {
  photo: Photo
  onExpand: (photo: Photo) => void
}

export function PhotoCard({ photo, onExpand }: PhotoCardProps) {
  const [hovered, setHovered] = useState(false)
  const { available, stats, isLiked, toggleLike } = usePhotoStats()

  const purchaseHref = `/contact?subject=${encodeURIComponent(`Print Inquiry: ${photo.title}`)}`
  const photoStats = stats[photo.id]
  const liked = isLiked(photo.id)
  const likeCount = (photoStats?.likes ?? 0) + (photoStats?.instagramLikes ?? 0)

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
            {/* Like + expand buttons top-right */}
            <div className="flex justify-end gap-2">
              {available && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLike(photo.id)
                  }}
                  className={`h-9 px-3 rounded-lg backdrop-blur-sm flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
                    liked
                      ? 'bg-brand text-white'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                  aria-label={liked ? 'Unlike photo' : 'Like photo'}
                  aria-pressed={liked}
                >
                  <FiHeart size={15} className={liked ? 'fill-current' : undefined} />
                  {likeCount > 0 && likeCount}
                </button>
              )}
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
              <div className="flex items-center gap-3 mb-3">
                {photo.location && (
                  <p className="flex items-center gap-1 text-white/70 text-xs">
                    <FiMapPin size={10} />
                    {photo.location}
                  </p>
                )}
                {available && photoStats && photoStats.views > 0 && (
                  <p className="flex items-center gap-1 text-white/70 text-xs">
                    <FiEye size={10} />
                    {photoStats.views}
                  </p>
                )}
              </div>
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
