'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
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
  const [activeCollection, setActiveCollection] = useState<string>('all')
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null)
  const galleryRef = useRef<HTMLDivElement>(null)

  const collections = useMemo(() => {
    const seen = new Map<string, { cover: Photo; count: number }>()
    for (const photo of photos) {
      if (!seen.has(photo.collection)) {
        seen.set(photo.collection, { cover: photo, count: 0 })
      }
      seen.get(photo.collection)!.count++
    }
    return Array.from(seen.entries()).map(([name, { cover, count }]) => ({ name, cover, count }))
  }, [photos])

  const collectionFiltered =
    activeCollection === 'all' ? photos : photos.filter((p) => p.collection === activeCollection)

  const filtered =
    activeFilter === 'all'
      ? collectionFiltered
      : collectionFiltered.filter((p) =>
          p.category.includes(activeFilter as Exclude<PhotoCategory, 'all'>),
        )

  const currentIndex = lightboxPhoto ? filtered.findIndex((p) => p.id === lightboxPhoto.id) : -1

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setLightboxPhoto(filtered[currentIndex - 1])
  }, [currentIndex, filtered])

  const handleNext = useCallback(() => {
    if (currentIndex < filtered.length - 1) setLightboxPhoto(filtered[currentIndex + 1])
  }, [currentIndex, filtered])

  const selectCollection = (name: string) => {
    setActiveCollection(name)
    setActiveFilter('all')
    setTimeout(() => {
      galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
  }

  return (
    <div>
      {/* Collections */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
          Collections
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          {/* All card */}
          <button
            onClick={() => selectCollection('all')}
            className={`relative flex-shrink-0 w-36 h-24 rounded-xl overflow-hidden transition-all duration-200 ${
              activeCollection === 'all' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-300 to-zinc-500 dark:from-zinc-600 dark:to-zinc-800" />
            <div className="absolute inset-0 flex flex-col justify-end p-3">
              <p className="text-white font-semibold text-sm leading-tight">All</p>
              <p className="text-white/60 text-xs">{photos.length} photos</p>
            </div>
            {activeCollection === 'all' && (
              <div className="absolute inset-0 rounded-xl ring-2 ring-inset ring-brand pointer-events-none" />
            )}
          </button>

          {collections.map((col) => (
            <button
              key={col.name}
              onClick={() => selectCollection(col.name)}
              className={`relative flex-shrink-0 w-36 h-24 rounded-xl overflow-hidden transition-all duration-200 ${
                activeCollection === col.name ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={col.cover.thumbnail}
                alt={col.name}
                fill
                className="object-cover"
                sizes="144px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white font-semibold text-sm leading-tight">{col.name}</p>
                <p className="text-white/60 text-xs">{col.count} photos</p>
              </div>
              {activeCollection === col.name && (
                <div className="absolute inset-0 rounded-xl ring-2 ring-inset ring-brand pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Category filters */}
      <div ref={galleryRef} className="flex flex-wrap gap-2 mb-8">
        {filterCategories
          .filter(
            ({ value }) =>
              value === 'all' ||
              collectionFiltered.some((p) =>
                p.category.includes(value as Exclude<PhotoCategory, 'all'>),
              ),
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
