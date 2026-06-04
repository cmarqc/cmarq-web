'use client'

import { useState, useCallback } from 'react'
import { PhotoCard } from './PhotoCard'
import { PhotoLightbox } from './PhotoLightbox'
import type { Photo, PhotoCategory } from '@/data/photos'

interface PhotoGalleryProps {
  photos: Photo[]
}

const filterCategories: { value: PhotoCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'nature', label: 'Nature' },
  { value: 'urban', label: 'Urban' },
  { value: 'street', label: 'Street' },
  { value: 'portrait', label: 'Portrait' },
]

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [activeFilter, setActiveFilter] = useState<PhotoCategory>('all')
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null)

  const filtered =
    activeFilter === 'all' ? photos : photos.filter((p) => p.category === activeFilter)

  const currentIndex = lightboxPhoto ? filtered.findIndex((p) => p.id === lightboxPhoto.id) : -1

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setLightboxPhoto(filtered[currentIndex - 1])
  }, [currentIndex, filtered])

  const handleNext = useCallback(() => {
    if (currentIndex < filtered.length - 1) setLightboxPhoto(filtered[currentIndex + 1])
  }, [currentIndex, filtered])

  return (
    <div>
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {filterCategories
          .filter(
            ({ value }) =>
              value === 'all' ||
              photos.some((p) => p.category === value),
          )
          .map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveFilter(value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === value
                  ? 'bg-brand text-white shadow-sm shadow-brand/30'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {label}
            </button>
          ))}
      </div>

      {/* Masonry-style gallery */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {filtered.map((photo) => (
          <div key={photo.id} className="break-inside-avoid">
            <PhotoCard photo={photo} onExpand={setLightboxPhoto} />
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-zinc-400 dark:text-zinc-500">
          No photos in this category yet.
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <PhotoLightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
          onPrev={currentIndex > 0 ? handlePrev : undefined}
          onNext={currentIndex < filtered.length - 1 ? handleNext : undefined}
        />
      )}
    </div>
  )
}
