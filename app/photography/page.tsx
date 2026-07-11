import type { Metadata } from 'next'
import { PhotoCarousel } from '@/components/photography/PhotoCarousel'
import { PhotoGallery } from '@/components/photography/PhotoGallery'
import { PhotoStatsProvider } from '@/components/photography/photo-stats-context'
import { featuredPhotos, galleryPhotos } from '@/data/photos'
import { FiCamera, FiInstagram, FiShoppingBag } from 'react-icons/fi'

export const metadata: Metadata = {
  title: 'Photography',
  description:
    'Photography by Christian Calloway — landscapes, cityscapes, and nature from the Pacific Northwest. Prints available for purchase.',
}

export default function PhotographyPage() {
  return (
    <div className="page-transition py-16 lg:py-24">
      <div className="page-container">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <FiCamera className="text-brand" size={22} />
            <h1 className="section-heading mb-0">Photography</h1>
          </div>
          <div className="section-divider" />
          <p className="section-subheading max-w-2xl mb-0">
            📸 Capture the moments — focus on the experience
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Check out and follow my photography Instagram!{' '}
            <a
              href="https://www.instagram.com/cmc.snaps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 -mx-1 px-1.5 py-0.5 rounded-md text-brand transition-colors hover:bg-brand/10 hover:text-red-400"
            >
              <FiInstagram size={14} className="shrink-0" />
              @cmc.snaps
            </a>
          </p>
        </div>

        <PhotoStatsProvider>
          {/* Featured carousel */}
          <section className="mb-16">
            <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
              Featured
            </h2>
            <PhotoCarousel photos={featuredPhotos} />
          </section>

          {/* Gallery */}
          <section>
            <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
              <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">
                Full Gallery
              </h2>
            </div>
            <PhotoGallery photos={galleryPhotos} />
          </section>
        </PhotoStatsProvider>
      </div>
    </div>
  )
}
