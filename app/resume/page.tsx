'use client'

import { motion } from 'framer-motion'
import { FiDownload, FiBriefcase, FiBook, FiCode } from 'react-icons/fi'
import { experiences, education } from '@/data/experience'
import { skillGroups } from '@/data/skills'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const typeBadge: Record<string, string> = {
  'full-time': 'Full-time',
  intern: 'Internship',
  'part-time': 'Part-time',
  volunteer: 'Volunteer',
}

export default function ResumePage() {
  return (
    <div className="page-transition py-16 lg:py-24">
      <div className="page-container">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12"
          >
            <div>
              <h1 className="section-heading">Resume</h1>
              <div className="section-divider" />
              <p className="section-subheading">Experience, education, and technical skills.</p>
            </div>
            <a
              href="/resume.pdf"
              download
              className="btn-primary shrink-0 self-start sm:self-auto"
            >
              <FiDownload size={18} />
              Download PDF
            </a>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Experience — main column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Work Experience */}
              <motion.section variants={itemVariants}>
                <div className="flex items-center gap-2 mb-6">
                  <FiBriefcase className="text-brand" size={20} />
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Experience
                  </h2>
                </div>

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />

                  <div className="space-y-8 pl-12">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-[2.05rem] top-1.5 w-3 h-3 rounded-full bg-brand border-2 border-white dark:border-surface-dark" />

                        <div className="card">
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                            <div>
                              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {exp.role}
                              </h3>
                              <p className="text-brand font-medium text-sm">{exp.company}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                {exp.period}
                              </span>
                              <span className="tag text-xs">{typeBadge[exp.type]}</span>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">
                            {exp.location}
                          </p>
                          <ul className="space-y-1.5 mb-4">
                            {exp.bullets.map((bullet, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300"
                              >
                                <span className="w-1 h-1 rounded-full bg-brand mt-2 shrink-0" />
                                {bullet}
                              </li>
                            ))}
                          </ul>
                          {exp.tech && (
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                              {exp.tech.map((t) => (
                                <span
                                  key={t}
                                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>

              {/* Education */}
              <motion.section variants={itemVariants}>
                <div className="flex items-center gap-2 mb-6">
                  <FiBook className="text-brand" size={20} />
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Education
                  </h2>
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />
                  <div className="pl-12">
                    {education.map((edu) => (
                      <div key={edu.id} className="relative">
                        <div className="absolute -left-[2.05rem] top-1.5 w-3 h-3 rounded-full bg-brand border-2 border-white dark:border-surface-dark" />
                        <div className="card">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {edu.school}
                              </h3>
                              <p className="text-brand font-medium text-sm">
                                {edu.degree} — {edu.field}
                              </p>
                              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                {edu.location}
                              </p>
                            </div>
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
                              {edu.period}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            </div>

            {/* Skills — sidebar */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <FiCode className="text-brand" size={20} />
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Skills</h2>
              </div>

              {skillGroups.map((group) => (
                <div key={group.category} className="card">
                  <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                    {group.category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-brand/10 dark:hover:bg-brand/20 hover:text-brand dark:hover:text-red-400 transition-colors duration-200 cursor-default"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <div className="card bg-brand/5 dark:bg-brand/10 border-brand/20">
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Want the full picture?{' '}
                  <a
                    href="/resume.pdf"
                    download
                    className="text-brand font-medium hover:underline"
                  >
                    Download my resume
                  </a>{' '}
                  for a complete overview of my background.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
