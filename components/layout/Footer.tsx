import Link from 'next/link'
import { FaGithub, FaInstagram, FaLinkedin, FaTwitch } from 'react-icons/fa'

const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/photography', label: 'Photography' },
  { href: '/resume', label: 'Resume' },
  { href: '/projects', label: 'Projects' },
  { href: '/contact', label: 'Contact' },
]

const socialLinks = [
  { href: 'https://github.com/cmarq07', icon: FaGithub, label: 'GitHub' },
  { href: 'https://www.instagram.com/cmarq07', icon: FaInstagram, label: 'Instagram' },
  { href: 'https://www.linkedin.com/in/chrcalloway', icon: FaLinkedin, label: 'LinkedIn' },
  { href: 'https://www.twitch.tv/cmarqq', icon: FaTwitch, label: 'Twitch' },
]

export function Footer() {
  return (
    <footer className="bg-brand-deeper text-zinc-400 mt-auto">
      <div className="page-container py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <p className="font-bold text-lg text-zinc-100 mb-2">
              Christian Calloway
            </p>
            <p className="text-sm leading-relaxed">
              Full-stack Software Engineer II at Microsoft. Passionate about building great software
              and capturing the world through a lens.
            </p>
          </div>

          <div>
            <p className="font-semibold text-zinc-200 mb-3 text-sm uppercase tracking-wider">
              Navigation
            </p>
            <ul className="space-y-2">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm hover:text-brand transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-zinc-200 mb-3 text-sm uppercase tracking-wider">
              Connect
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="hover:text-brand transition-colors duration-200"
                >
                  <Icon size={22} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} Christian Calloway. All rights reserved.
          </p>
          <p className="text-xs">
            Built with Next.js &amp; Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  )
}
