'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  FiArrowDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiSearch,
  FiX,
} from 'react-icons/fi'
import { PhotoCard } from './PhotoCard'
import { PhotoLightbox } from './PhotoLightbox'
import { PurchaseButton } from './PurchaseButton'
import { popularityScore, totalLikes, usePhotoStats } from './photo-stats-context'
import type { Photo, PhotoCategory } from '@/data/photos'
import { getPhotoExif } from '@/data/photo-metadata'
import {
  collectionPersonalCents,
  formatUsd,
  productIdForCollection,
  storeEnabled,
} from '@/lib/store-display'

interface PhotoGalleryProps {
  photos: Photo[]
}

const filterCategories: { value: PhotoCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'nature', label: 'Nature' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'street', label: 'Street' },
  { value: 'astro', label: 'Astro' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'fine art', label: 'Fine Art' },
  { value: 'commercial', label: 'Commercial' },
]

// Matches the Tailwind breakpoints used by the gallery: 1 col < sm, 2 cols < lg, 3 cols otherwise.
function useColumnCount() {
  const [count, setCount] = useState(3)
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth
      setCount(w >= 1024 ? 3 : w >= 640 ? 2 : 1)
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])
  return count
}

// Photos per page in the full gallery. Divides evenly across the 1/2/3-column layouts.
const PAGE_SIZE = 12

// Compact page list with ellipses: always the first, last, and current ±1 pages.
function buildPageList(current: number, total: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }
  return pages
}

type SortKey = 'default' | 'newest' | 'oldest' | 'popular' | 'likes' | 'views'

// Sorts that rely only on static EXIF data — available even before stats load.
const staticSortOptions: { value: SortKey; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'newest', label: 'Newest captured' },
  { value: 'oldest', label: 'Oldest captured' },
]

// Sorts driven by engagement stats — only meaningful once those have loaded.
const statSortOptions: { value: SortKey; label: string }[] = [
  { value: 'popular', label: 'Most popular' },
  { value: 'likes', label: 'Most liked' },
  { value: 'views', label: 'Most viewed' },
]

/** Capture timestamp (ms) from EXIF, or null when unknown. */
function captureTime(photo: Photo): number | null {
  const exif = getPhotoExif(photo.src)
  if (exif?.dateTakenTs != null) return exif.dateTakenTs
  // Fall back to the date-only display string (no time-of-day) for photos whose
  // metadata predates the dateTakenTs field.
  if (!exif?.dateTaken) return null
  const t = Date.parse(exif.dateTaken)
  return Number.isNaN(t) ? null : t
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const { available, stats } = usePhotoStats()
  const [activeFilter, setActiveFilter] = useState<PhotoCategory>('all')
  const [activeCollection, setActiveCollection] = useState<string>('all')
  const [activeSubcollection, setActiveSubcollection] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortKey>('default')
  const [page, setPage] = useState(1)
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null)
  const [collectionSearch, setCollectionSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const galleryRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // Collections narrowed by the search box (case-insensitive substring on the name).
  const visibleCollections = useMemo(() => {
    const q = collectionSearch.trim().toLowerCase()
    if (!q) return collections
    return collections.filter((col) => col.name.toLowerCase().includes(q))
  }, [collections, collectionSearch])

  // Focus the search field the moment it opens so the user can type immediately.
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  // Sub-collections available within the active collection, in first-seen order.
  // Empty when "All" is selected or the collection has no sub-grouped photos.
  const subcollections = useMemo(() => {
    if (activeCollection === 'all') return []
    const seen = new Map<string, number>()
    for (const photo of photos) {
      if (photo.collection !== activeCollection || !photo.subcollection) continue
      seen.set(photo.subcollection, (seen.get(photo.subcollection) ?? 0) + 1)
    }
    return Array.from(seen.entries()).map(([name, count]) => ({ name, count }))
  }, [photos, activeCollection])

  const collectionFiltered = useMemo(() => {
    const inCollection =
      activeCollection === 'all' ? photos : photos.filter((p) => p.collection === activeCollection)
    return activeSubcollection === 'all'
      ? inCollection
      : inCollection.filter((p) => p.subcollection === activeSubcollection)
  }, [photos, activeCollection, activeSubcollection])

  const filtered =
    activeFilter === 'all'
      ? collectionFiltered
      : collectionFiltered.filter((p) =>
          p.category.includes(activeFilter as Exclude<PhotoCategory, 'all'>),
        )

  const sorted = useMemo(() => {
    if (sortBy === 'default') return filtered

    if (sortBy === 'newest' || sortBy === 'oldest') {
      const dir = sortBy === 'newest' ? -1 : 1
      // Stable sort: undated photos sink to the end, same-day photos keep curated order.
      return [...filtered].sort((a, b) => {
        const ta = captureTime(a)
        const tb = captureTime(b)
        if (ta === null && tb === null) return 0
        if (ta === null) return 1
        if (tb === null) return -1
        return (ta - tb) * dir
      })
    }

    const metric = (photo: Photo) => {
      const s = stats[photo.id]
      if (sortBy === 'likes') return totalLikes(s)
      if (sortBy === 'views') return s?.views ?? 0
      return popularityScore(s)
    }
    // Stable sort: equal metrics keep the curated data order.
    return [...filtered].sort((a, b) => metric(b) - metric(a))
  }, [filtered, sortBy, stats])

  const columnCount = useColumnCount()

  // Reset to the first page whenever the result set changes underneath us.
  useEffect(() => {
    setPage(1)
  }, [activeFilter, activeCollection, activeSubcollection, sortBy])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  // Clamp in case the active page fell out of range after filtering.
  const currentPage = Math.min(page, pageCount)
  const paginated = useMemo(
    () => sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sorted, currentPage],
  )

  // Greedy shortest-column masonry: each photo goes into whichever column is
  // currently shortest, using height/width as a proxy for rendered height (columns
  // render at equal width, so this ratio is directly comparable across columns).
  // A naive i % columnCount round-robin looks right only when every row is the same
  // height — one portrait photo throws off a column's height and visually scrambles
  // the reading order for everything after it.
  const columns = useMemo(() => {
    const cols: Photo[][] = Array.from({ length: columnCount }, () => [])
    const colHeights = Array<number>(columnCount).fill(0)
    paginated.forEach((photo) => {
      const shortest = colHeights.indexOf(Math.min(...colHeights))
      cols[shortest].push(photo)
      colHeights[shortest] += photo.height / photo.width
    })
    return cols
  }, [paginated, columnCount])

  const goToPage = (p: number) => {
    setPage(p)
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const renderPageNav = () => (
    <nav className="flex items-center gap-1.5" aria-label="Gallery pagination">
      <button
        onClick={() => goToPage(1)}
        disabled={currentPage === 1}
        aria-label="First page"
        className="flex items-center justify-center w-9 h-9 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <FiChevronsLeft size={18} />
      </button>
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="flex items-center justify-center w-9 h-9 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <FiChevronLeft size={18} />
      </button>

      {buildPageList(currentPage, pageCount).map((p, i) =>
        p === 'ellipsis' ? (
          <span
            key={`ellipsis-${i}`}
            className="w-9 h-9 flex items-center justify-center text-zinc-400 dark:text-zinc-500 select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goToPage(p)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
            className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
              p === currentPage
                ? 'bg-brand text-white shadow-sm shadow-brand/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === pageCount}
        aria-label="Next page"
        className="flex items-center justify-center w-9 h-9 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <FiChevronRight size={18} />
      </button>
      <button
        onClick={() => goToPage(pageCount)}
        disabled={currentPage === pageCount}
        aria-label="Last page"
        className="flex items-center justify-center w-9 h-9 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <FiChevronsRight size={18} />
      </button>
    </nav>
  )

  const currentIndex = lightboxPhoto ? sorted.findIndex((p) => p.id === lightboxPhoto.id) : -1

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setLightboxPhoto(sorted[currentIndex - 1])
  }, [currentIndex, sorted])

  const handleNext = useCallback(() => {
    if (currentIndex < sorted.length - 1) setLightboxPhoto(sorted[currentIndex + 1])
  }, [currentIndex, sorted])

  const selectCollection = (name: string) => {
    setActiveCollection(name)
    setActiveSubcollection('all')
    setActiveFilter('all')
    setTimeout(() => {
      galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
  }

  const selectSubcollection = (name: string) => {
    setActiveSubcollection(name)
    setActiveFilter('all')
  }

  return (
    <div>
      {/* Collections */}
      <div className="mb-10">
        <div className="mb-3 flex items-center gap-3">
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Collections
          </p>
          {searchOpen && (
            <div className="relative flex-1 max-w-xs">
              <FiSearch
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setCollectionSearch('')
                    setSearchOpen(false)
                  }
                }}
                placeholder="Search collections…"
                className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-8 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => {
                  setCollectionSearch('')
                  setSearchOpen(false)
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <FiX size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-slim">
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

          {/* Search card — toggles the collection-name search field */}
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-pressed={searchOpen}
            className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden transition-all duration-200 ${
              searchOpen ? 'opacity-100' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-400 dark:from-zinc-700 dark:to-zinc-900" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-zinc-700 dark:text-zinc-200">
              <FiSearch size={20} />
              <span className="text-sm font-semibold">Search</span>
            </div>
            {searchOpen && (
              <div className="absolute inset-0 rounded-xl ring-2 ring-inset ring-brand pointer-events-none" />
            )}
          </button>

          {visibleCollections.map((col) => (
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

          {searchOpen && visibleCollections.length === 0 && (
            <p className="flex h-24 items-center px-2 text-sm text-zinc-400 dark:text-zinc-500">
              No collections match “{collectionSearch.trim()}”.
            </p>
          )}
        </div>
      </div>

      {/* Sub-collections — only shown when the active collection has sub-groups */}
      {subcollections.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
            {activeCollection} · Sub-collections
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => selectSubcollection('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeSubcollection === 'all'
                  ? 'bg-brand text-white shadow-sm shadow-brand/30'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              All {activeCollection}
            </button>
            {subcollections.map((sub) => (
              <button
                key={sub.name}
                onClick={() => selectSubcollection(sub.name)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeSubcollection === sub.name
                    ? 'bg-brand text-white shadow-sm shadow-brand/30'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {sub.name}
                <span className="ml-1.5 opacity-60">{sub.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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

        {/* Sort — date sorts always work; engagement sorts appear once stats load */}
        <label className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 shrink-0">
          <span className="hidden sm:inline">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/40 cursor-pointer"
          >
            {[...staticSortOptions, ...(available ? statSortOptions : [])].map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Gentle, understated pointer to the collection buy option below the gallery */}
      {storeEnabled() &&
        activeCollection !== 'all' &&
        (collections.find((c) => c.name === activeCollection)?.count ?? 0) >= 2 && (
          <p className="mb-8 flex items-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500">
            <FiArrowDown size={13} className="shrink-0" />
            Like this experience? You can purchase the full {activeCollection} collection below.
          </p>
        )}

      {/* Top pagination — mirrors the bottom controls so long galleries are navigable without scrolling */}
      {pageCount > 1 && <div className="mb-8 flex justify-center">{renderPageNav()}</div>}

      {/* Masonry-style gallery — shortest-column placement keeps reading order top-to-bottom */}
      <div className="flex gap-4 items-start">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex-1 min-w-0 space-y-4">
            {column.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onExpand={setLightboxPhoto} />
            ))}
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-20 text-zinc-400 dark:text-zinc-500">
          No photos in this category yet.
        </div>
      )}

      {/* Bottom pagination — only when the gallery spills past a single page */}
      {pageCount > 1 && (
        <div className="mt-12 flex flex-col items-center gap-3">
          {renderPageNav()}
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length} photos
          </p>
        </div>
      )}

      {/* Collection purchase bar — below the gallery, only for a selected collection once the store is live */}
      {storeEnabled() &&
        activeCollection !== 'all' &&
        (() => {
          const col = collections.find((c) => c.name === activeCollection)
          // A single-photo "collection" isn't sold as a collection — see photography-products.ts.
          if (!col || col.count < 2) return null
          const price = collectionPersonalCents(col.name, col.count)
          return (
            <div className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand/5 dark:bg-brand/10 p-4">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {col.name} Collection
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {col.count} full-resolution photos ·{' '}
                  <Link
                    href="/licensing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted underline-offset-2 hover:text-brand transition-colors"
                  >
                    personal-use license
                  </Link>
                </p>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
                  Every image in the gallery is watermarked to protect the work from theft. Your
                  purchase is delivered at full resolution, finished with my signature in the
                  lower-right corner.
                </p>
              </div>
              <div className="sm:w-60">
                <PurchaseButton
                  productId={productIdForCollection(col.name)}
                  priceCents={price}
                  label={`Purchase collection — ${formatUsd(price)}`}
                />
              </div>
            </div>
          )
        })()}

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
