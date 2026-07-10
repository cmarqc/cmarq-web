'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { FiArrowRight, FiFileText } from 'react-icons/fi'
import { galleryPhotos } from '@/data/photos'
import { popularityScore, usePhotoStats } from '@/components/photography/photo-stats-context'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export function HeroSection() {
  const { stats } = usePhotoStats()

  // The single most popular photo, ranked the same way the gallery is. Null
  // until stats load (or when the stats backend is unreachable), in which case
  // the hero falls back to the plain gradient below.
  const heroPhoto = useMemo(() => {
    let best: (typeof galleryPhotos)[number] | null = null
    let bestScore = 0
    for (const photo of galleryPhotos) {
      const score = popularityScore(stats[photo.id])
      if (score > bestScore) {
        bestScore = score
        best = photo
      }
    }
    return best
  }, [stats])

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden">
      {heroPhoto ? (
        <motion.div
          key={heroPhoto.id}
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Image
            src={heroPhoto.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Theme-aware legibility scrim — heavier under the text on the left,
              lighter on the right so the photo stays visible. */}
          <div className="absolute inset-0 bg-gradient-to-r from-surface-light/95 via-surface-light/75 to-surface-light/40 dark:from-surface-dark/95 dark:via-surface-dark/75 dark:to-surface-dark/40" />
        </motion.div>
      ) : (
        /* Background gradient (fallback while stats load / when unavailable) */
        <div className="absolute inset-0 bg-gradient-to-br from-surface-light via-surface-light to-zinc-200 dark:from-surface-nav-dark dark:via-surface-dark dark:to-zinc-900 -z-10" />
      )}

      {/* Decorative red accent blob */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand/5 dark:bg-brand/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-brand/5 dark:bg-brand/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="page-container py-20 w-full">
        <motion.div
          className="max-w-3xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.p
            variants={itemVariants}
            className="text-sm font-semibold text-brand uppercase tracking-widest mb-4"
          >
            Software Engineer II @ Microsoft
          </motion.p>

          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight mb-6"
          >
            Hello there!
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-300 leading-relaxed mb-10 max-w-2xl"
          >
            &ldquo;I&apos;m just a simple man trying to make my way in the universe.&rdquo;
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
            <Link href="/photography" className="btn-primary text-base">
              Photography
              <FiArrowRight size={18} />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-zinc-400 dark:border-zinc-500 text-zinc-800 dark:text-zinc-100 hover:bg-brand hover:border-brand hover:text-white dark:hover:border-brand dark:hover:text-white font-semibold rounded-xl transition-all duration-200 active:scale-95 text-base"
            >
              View My Work
              <FiArrowRight size={18} />
            </Link>
            <Link href="/resume" className="btn-ghost text-base px-6 py-3">
              Resume
              <FiFileText size={18} />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-400 dark:text-zinc-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
        <motion.div
          className="w-px h-8 bg-gradient-to-b from-zinc-400 to-transparent dark:from-zinc-600"
          animate={{ scaleY: [1, 0.6, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  )
}
