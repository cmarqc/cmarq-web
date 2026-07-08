'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronLeft, FiChevronRight, FiMapPin } from 'react-icons/fi'
import type { Photo } from '@/data/photos'
import { popularityScore, usePhotoStats } from './photo-stats-context'

const AUTO_DELAY = 5000
const MANUAL_DELAY = 8000

interface PhotoCarouselProps {
  photos: Photo[]
}

export function PhotoCarousel({ photos }: PhotoCarouselProps) {
  const { stats } = usePhotoStats()
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Most popular first. Before stats load every score is 0, so the sort is a
  // no-op and the curated data order shows through.
  const orderedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => popularityScore(stats[b.id]) - popularityScore(stats[a.id]))
  }, [photos, stats])
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isManualRef = useRef(false)

  const scheduleNext = useCallback(
    (delay: number) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => emblaApi?.scrollNext(), delay)
    },
    [emblaApi],
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
    const delay = isManualRef.current ? MANUAL_DELAY : AUTO_DELAY
    isManualRef.current = false
    scheduleNext(delay)
  }, [emblaApi, scheduleNext])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [emblaApi, onSelect])

  // Re-sync Embla when the popularity order changes (e.g. once stats load).
  useEffect(() => {
    emblaApi?.reInit()
  }, [emblaApi, orderedPhotos])

  const scrollPrev = useCallback(() => {
    isManualRef.current = true
    emblaApi?.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    isManualRef.current = true
    emblaApi?.scrollNext()
  }, [emblaApi])

  const scrollTo = useCallback(
    (i: number) => {
      isManualRef.current = true
      emblaApi?.scrollTo(i)
    },
    [emblaApi],
  )

  const current = orderedPhotos[selectedIndex]

  return (
    <div className="relative group">
      {/* Carousel viewport */}
      <div className="embla rounded-2xl overflow-hidden" ref={emblaRef}>
        <div className="embla__container">
          {orderedPhotos.map((photo, i) => (
            <div key={photo.id} className="embla__slide relative aspect-[16/9]">
              <Image
                src={photo.src}
                alt={photo.title}
                fill
                className="object-cover"
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1152px"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-brand transition-all duration-200 z-10"
        aria-label="Previous photo"
      >
        <FiChevronLeft size={20} />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-brand transition-all duration-200 z-10"
        aria-label="Next photo"
      >
        <FiChevronRight size={20} />
      </button>

      {/* Caption */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none"
        >
          <p className="text-white font-semibold text-xl drop-shadow-lg">{current.title}</p>
          {current.location && (
            <p className="flex items-center gap-1.5 text-white/80 text-sm mt-1">
              <FiMapPin size={12} />
              {current.location}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dot navigation */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 z-10">
        {orderedPhotos.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`rounded-full transition-all duration-200 ${
              i === selectedIndex
                ? 'w-5 h-1.5 bg-brand'
                : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
