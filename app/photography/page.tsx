import type { Metadata } from 'next'
import { PhotoCarousel } from '@/components/photography/PhotoCarousel'
import { PhotoGallery } from '@/components/photography/PhotoGallery'
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
            Capturing moments — Focused on the experience
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Check out and follow my photography Instagram!{' '}
            <a
              href="https://www.instagram.com/cmc.snaps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-brand hover:underline"
            >
              <FiInstagram size={14} />
              @cmc.snaps
            </a>
          </p>
        </div>

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
            {/* Coming Soon */}
            {/* <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg">
              <FiShoppingBag size={14} className="text-brand" />
              Prints available — hover a photo to purchase
            </div> */}
          </div>
          <PhotoGallery photos={galleryPhotos} />
        </section>

        {/* Coming Soon */}
        {/* Print info callout */}
        {/* <section className="mt-16 card bg-brand/5 dark:bg-brand/10 border-brand/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand/15 dark:bg-brand/25 flex items-center justify-center text-brand shrink-0">
              <FiShoppingBag size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                Interested in a print?
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                All photos are available as high-quality prints in a variety of sizes and finishes.
                Reach out through the contact form for pricing, sizing options, and shipping details.
              </p>
              <a
                href="https://www.instagram.com/cmc.snaps"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-sm text-brand hover:underline"
              >
                <FiInstagram size={13} />
                Follow @cmc.snaps for more
              </a>
            </div>
          </div>
        </section> */}
      </div>
    </div>
  )
}
