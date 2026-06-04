'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMenu, FiX } from 'react-icons/fi'
import { FaGithub, FaInstagram, FaLinkedin } from 'react-icons/fa'
import { ThemeToggle } from './ThemeToggle'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/resume', label: 'Resume' },
  { href: '/projects', label: 'Projects' },
  { href: '/photography', label: 'Photography' },
  { href: '/contact', label: 'Contact' },
]

const socialLinks = [
  { href: 'https://github.com/cmarqc', icon: FaGithub, label: 'GitHub' },
  { href: 'https://www.instagram.com/cmarq07', icon: FaInstagram, label: 'Instagram' },
  { href: 'https://www.linkedin.com/in/chrcalloway', icon: FaLinkedin, label: 'LinkedIn' },
]

export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/90 dark:bg-surface-nav-dark/90 backdrop-blur-md shadow-sm border-b border-zinc-200/80 dark:border-zinc-800/80'
          : 'bg-white dark:bg-surface-nav-dark border-b border-transparent'
          }`}
      >
        <div className="page-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="font-bold text-xl text-zinc-900 dark:text-zinc-100 hover:text-brand dark:hover:text-brand transition-colors duration-200"
            >
              Christian Calloway
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`nav-link ${isActive(href) ? 'nav-link-active' : ''}`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Desktop Right */}
            <div className="hidden md:flex items-center gap-2">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-brand dark:hover:text-brand hover:bg-brand/10 transition-all duration-200"
                >
                  <Icon size={18} />
                </a>
              ))}
              <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
              <ThemeToggle />
            </div>

            {/* Mobile Controls */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-brand dark:hover:text-brand hover:bg-brand/10 transition-all duration-200"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="sticky top-16 z-40 md:hidden bg-white dark:bg-surface-nav-dark border-b border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg"
          >
            <div className="page-container py-4">
              <nav className="flex flex-col gap-1 mb-4">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-colors duration-200 ${isActive(href)
                      ? 'text-brand bg-brand/10 font-semibold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-brand dark:hover:text-brand hover:bg-brand/5'
                      }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-3 px-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                {socialLinks.map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="text-zinc-500 dark:text-zinc-400 hover:text-brand dark:hover:text-brand transition-colors duration-200"
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
