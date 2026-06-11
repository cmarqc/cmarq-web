'use client'

import { motion } from 'framer-motion'
import { FiMapPin, FiBriefcase, FiHeart } from 'react-icons/fi'
import { FaGithub, FaInstagram, FaLinkedin } from 'react-icons/fa'

const interests = [
  { emoji: '💻', label: 'Programming & Software Engineering' },
  { emoji: '📸', label: 'Photography' },
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '🏀', label: 'Basketball' },
  { emoji: '🏈', label: 'Football' },
  { emoji: '🥏', label: 'Ultimate Frisbee' },
  { emoji: '🎾', label: 'Tennis' },
  { emoji: '🥾', label: 'Hiking' },
  { emoji: '🏂', label: 'Snowboarding' },
  { emoji: '🎨', label: 'Digital & Traditional Art' },
  { emoji: '📡', label: 'Streaming' },
]

const socialLinks = [
  { href: 'https://github.com/cmarq07', icon: FaGithub, label: 'GitHub', handle: '@cmarq07' },
  {
    href: 'https://www.instagram.com/cmarq07',
    icon: FaInstagram,
    label: 'Instagram',
    handle: '@cmarq07',
  },
  {
    href: 'https://www.linkedin.com/in/chrcalloway',
    icon: FaLinkedin,
    label: 'LinkedIn',
    handle: 'in/chrcalloway',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function AboutPage() {
  return (
    <div className="page-transition py-16 lg:py-24">
      <div className="page-container">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-12">
            <h1 className="section-heading">About Me</h1>
            <div className="section-divider" />
            <p className="section-subheading max-w-xl">
              A little bit about who I am beyond the code.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Bio */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Who I Am
                </h2>
                <div className="space-y-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  <p>
                    I&apos;m Christian Calloway — a full-stack Software Engineer II at Microsoft, a
                    University of Washington alum, and a lifelong technology enthusiast from the
                    Pacific Northwest.
                  </p>
                  <p>
                    I currently work on the Cybersecurity Defensive Engineering (CDE) Federal team, where I build and ship internal security tooling used across Microsoft.
                    My work spans full-stack development — from React frontends to C# and .NET
                    backend services running on Azure.
                  </p>
                  <p>
                    Outside of work, I&apos;ve always had a passion for creating things. I graduated
                    from UW with a degree in Informatics, where I built everything from Android apps
                    and interactive data tools to browser-based games. I&apos;m driven by curiosity
                    and the satisfaction of shipping something that genuinely helps people.
                  </p>
                  <p>
                    When I step away from the keyboard, you&apos;ll find me with a camera in hand,
                    on a basketball court, hiking trails around the PNW, or deep in a game session.
                    Photography has become a serious passion — I love capturing landscapes, cityscapes,
                    and the quiet moments in between.
                  </p>
                </div>
              </div>

              {/* Interests */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <FiHeart className="text-brand" size={18} />
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    Interests
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {interests.map(({ emoji, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-brand/5 dark:hover:bg-brand/10 transition-colors duration-200"
                    >
                      <span className="text-xl">{emoji}</span>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Quick info */}
              <div className="card">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  At a Glance
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FiBriefcase className="text-brand mt-0.5 shrink-0" size={16} />
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Software Engineer II
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Microsoft</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiMapPin className="text-brand mt-0.5 shrink-0" size={16} />
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Redmond, WA
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Pacific Northwest
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Education */}
              <div className="card">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Education
                </h2>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand font-bold text-sm shrink-0">
                    UW
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      University of Washington
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      B.S. in Informatics
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      Class of 2022 · Seattle, WA
                    </p>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="card">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Find Me
                </h2>
                <div className="space-y-3">
                  {socialLinks.map(({ href, icon: Icon, label, handle }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand/5 dark:hover:bg-brand/10 group transition-colors duration-200"
                    >
                      <Icon
                        size={18}
                        className="text-zinc-500 dark:text-zinc-400 group-hover:text-brand transition-colors"
                      />
                      <div>
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-brand transition-colors">
                          {label}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">{handle}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
