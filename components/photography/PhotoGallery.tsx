'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import { PhotoCard } from './PhotoCard'
import { PhotoLightbox } from './PhotoLightbox'
import { popularityScore, totalLikes, usePhotoStats } from './photo-stats-context'
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

type SortKey = 'default' | 'popular' | 'likes' | 'views'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'popular', label: 'Most popular' },
  { value: 'likes', label: 'Most liked' },
  { value: 'views', label: 'Most viewed' },
]

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const { available, stats } = usePhotoStats()
  const [activeFilter, setActiveFilter] = useState<PhotoCategory>('all')
  const [activeCollection, setActiveCollection] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortKey>('default')
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

  const sorted = useMemo(() => {
    if (sortBy === 'default') return filtered
    const metric = (photo: Photo) => {
      const s = stats[photo.id]
      if (sortBy === 'likes') return totalLikes(s)
      if (sortBy === 'views') return s?.views ?? 0
      return popularityScore(s)
    }
    // Stable sort: equal metrics keep the curated data order.
    return [...filtered].sort((a, b) => metric(b) - metric(a))
  }, [filtered, sortBy, stats])

  const currentIndex = lightboxPhoto ? sorted.findIndex((p) => p.id === lightboxPhoto.id) : -1

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setLightboxPhoto(sorted[currentIndex - 1])
  }, [currentIndex, sorted])

  const handleNext = useCallback(() => {
    if (currentIndex < sorted.length - 1) setLightboxPhoto(sorted[currentIndex + 1])
  }, [currentIndex, sorted])

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

      {/* Category filters + sort */}
      <div
        ref={galleryRef}
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-8"
      >
        <div className="flex flex-wrap gap-2">
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

        {/* Sort — only meaningful once engagement stats have loaded */}
        {available && (
          <label className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 shrink-0">
            <span className="hidden sm:inline">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/40 cursor-pointer"
            >
              {sortOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Masonry-style gallery */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {sorted.map((photo) => (
          <div key={photo.id} className="break-inside-avoid">
            <PhotoCard photo={photo} onExpand={setLightboxPhoto} />
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
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
          onNext={currentIndex < sorted.length - 1 ? handleNext : undefined}
        />
      )}
    </div>
  )
}
