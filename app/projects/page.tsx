'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiExternalLink, FiGithub, FiFilter, FiX } from 'react-icons/fi'
import { projects, type Project } from '@/data/projects'

type FilterCategory = 'all' | Project['category']

const categories: { value: FilterCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'web', label: 'Web' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'data', label: 'Data' },
  { value: 'game', label: 'Games' },
  { value: 'other', label: 'Other' },
]

const categoryColor: Record<Project['category'], string> = {
  web: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  mobile: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  data: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  game: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  other: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
}

export default function ProjectsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all')
  const [openPickerId, setOpenPickerId] = useState<string | null>(null)

  const filtered =
    activeFilter === 'all' ? projects : projects.filter((p) => p.category === activeFilter)

  const handleCardClick = (project: Project) => {
    const { outputUrl, sourceUrl } = project
    if (!outputUrl && !sourceUrl) return
    if (outputUrl && sourceUrl) {
      setOpenPickerId(project.id)
      return
    }
    window.open((outputUrl ?? sourceUrl)!, '_blank', 'noreferrer')
  }

  const isClickable = (project: Project) => !!(project.outputUrl || project.sourceUrl)

  return (
    <div className="page-transition py-16 lg:py-24">
      <div className="page-container">
        {/* Header */}
        <div className="mb-12">
          <h1 className="section-heading">Projects</h1>
          <div className="section-divider" />
          <p className="section-subheading">
            A collection of things I&apos;ve built — from web apps to data tools and games.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <FiFilter size={14} className="text-zinc-400 mr-1" />
          {categories.map(({ value, label }) => (
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

        {/* Backdrop — closes picker when clicking outside */}
        {openPickerId && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpenPickerId(null)}
          />
        )}

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={activeFilter}
        >
          <AnimatePresence mode="wait">
            {filtered.map((project) => (
              <motion.article
                key={project.id}
                variants={itemVariants}
                layout
                onClick={() => handleCardClick(project)}
                className={`card card-hover flex flex-col gap-4 group relative overflow-hidden${
                  isClickable(project) ? ' cursor-pointer' : ''
                }${openPickerId === project.id ? ' z-50' : ''}`}
              >
                {/* Category badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColor[project.category]}`}
                  >
                    {project.category}
                  </span>
                  {project.featured && (
                    <span className="tag">Featured</span>
                  )}
                </div>

                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-brand dark:group-hover:text-brand transition-colors duration-200">
                  {project.title}
                </h2>

                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed flex-1">
                  {project.description}
                </p>

                {/* Tech stack */}
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Link picker overlay */}
                <AnimatePresence>
                  {openPickerId === project.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
                        Open
                      </p>

                      {project.outputUrl && (
                        <a
                          href={project.outputUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setOpenPickerId(null)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-brand hover:text-white dark:hover:bg-brand dark:hover:text-white transition-colors duration-200"
                        >
                          <FiExternalLink size={14} />
                          Live Site
                        </a>
                      )}

                      {project.sourceUrl && (
                        <a
                          href={project.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setOpenPickerId(null)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-brand hover:text-white dark:hover:bg-brand dark:hover:text-white transition-colors duration-200"
                        >
                          <FiGithub size={14} />
                          Source Code
                        </a>
                      )}

                      <button
                        onClick={() => setOpenPickerId(null)}
                        className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors duration-200"
                      >
                        <FiX size={12} />
                        Cancel
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-zinc-400 dark:text-zinc-500">
            No projects in this category yet.
          </div>
        )}
      </div>
    </div>
  )
}
