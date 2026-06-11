import type { Metadata } from 'next'
import Link from 'next/link'
import { HeroSection } from '@/components/home/HeroSection'
import { projects } from '@/data/projects'
import { FiArrowRight, FiCamera, FiCode, FiMail } from 'react-icons/fi'

export const metadata: Metadata = {
  title: { absolute: 'Christian Calloway — Software Engineer & Photographer' },
}

export default function HomePage() {
  const featured = projects.filter((p) => p.featured).slice(0, 3)

  return (
    <>
      <HeroSection />

      {/* Quick links section */}
      <section className="py-20 bg-white dark:bg-surface-card-dark">
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: FiCode,
                title: 'Projects',
                desc: 'Full-stack apps, data tools, and games built end-to-end.',
                href: '/projects',
              },
              {
                icon: FiCamera,
                title: 'Photography',
                desc: 'Landscapes, street scenes, and nature captured across the Pacific Northwest.',
                href: '/photography',
              },
              {
                icon: FiMail,
                title: 'Get in Touch',
                desc: "Have a question, opportunity, or just want to say hi? I'd love to hear from you.",
                href: '/contact',
              },
            ].map(({ icon: Icon, title, desc, href }) => (
              <Link
                key={href}
                href={href}
                className="card card-hover group flex flex-col gap-4 p-8"
              >
                <div className="w-12 h-12 rounded-xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-all duration-300">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    {title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
                </div>
                <span className="mt-auto flex items-center gap-1 text-sm font-medium text-brand opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all duration-200">
                  Explore <FiArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured projects */}
      <section className="py-20">
        <div className="page-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-heading">Featured Projects</h2>
              <div className="section-divider" />
            </div>
            <Link
              href="/projects"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover transition-colors"
            >
              All projects <FiArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((project) => (
              <div key={project.id} className="card card-hover flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="tag">{project.category}</span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {project.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed flex-1">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  {project.tech.slice(0, 3).map((t) => (
                    <span key={t} className="text-xs text-zinc-500 dark:text-zinc-500">
                      {t}
                    </span>
                  ))}
                  {project.tech.length > 3 && (
                    <span className="text-xs text-zinc-400">+{project.tech.length - 3}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 sm:hidden">
            <Link href="/projects" className="btn-secondary w-full justify-center">
              All projects <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
