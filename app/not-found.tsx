import Link from 'next/link'
import { FiHome, FiArrowRight } from 'react-icons/fi'

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center px-4">
        <p className="text-8xl font-bold text-brand leading-none mb-4">404</p>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          Page not found
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="btn-primary">
            <FiHome size={16} />
            Go Home
          </Link>
          <Link href="/projects" className="btn-ghost">
            View Projects <FiArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
