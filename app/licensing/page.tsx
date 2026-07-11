import type { Metadata } from 'next'
import Link from 'next/link'
import { FiFileText, FiCheck, FiX, FiArrowLeft } from 'react-icons/fi'

export const metadata: Metadata = {
  title: 'Licensing',
  description:
    'Licensing terms for high-resolution digital photography downloads by Christian Calloway.',
}

const allowed = [
  'Download and keep the image for your own use.',
  'Use it as a wallpaper or background on your personal devices.',
  'Print it for personal display in your home or office.',
  'Give a physical, personal-use print as a gift.',
]

const prohibited = [
  'Reselling or redistributing the digital file.',
  'Uploading the full-resolution file publicly.',
  'Selling prints or products made from the image.',
  'Using it in advertising, marketing, or business branding.',
  'Claiming authorship of the photograph.',
]

export default function LicensingPage() {
  return (
    <div className="page-transition py-16 lg:py-24">
      <div className="page-container max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <FiFileText className="text-brand" size={22} />
          <h1 className="section-heading mb-0">Licensing</h1>
        </div>
        <div className="section-divider" />
        <p className="section-subheading mb-8">
          What you can and can&apos;t do with a digital download.
        </p>

        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Personal-use license
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
            Every digital download includes a personal-use license. You are buying the right to
            use the photograph personally — copyright stays with the photographer.
          </p>

          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            You may
          </h3>
          <ul className="space-y-2 mb-5">
            {allowed.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <FiCheck className="text-green-500 mt-0.5 shrink-0" size={15} />
                {item}
              </li>
            ))}
          </ul>

          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            You may not
          </h3>
          <ul className="space-y-2">
            {prohibited.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <FiX className="text-red-500 mt-0.5 shrink-0" size={15} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Commercial or extended use
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Need to use an image for business, marketing, editorial, or a client project — or
            want a TIFF or RAW file?{' '}
            <Link href="/contact" className="text-brand hover:underline">
              Get in touch
            </Link>{' '}
            and we&apos;ll arrange a commercial license tailored to your use.
          </p>
        </div>

        <Link href="/photography" className="btn-ghost mt-8 -ml-4">
          <FiArrowLeft size={16} />
          Back to Photography
        </Link>
      </div>
    </div>
  )
}
