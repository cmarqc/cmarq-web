import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ContactForm } from '@/components/contact/ContactForm'
import { FiMail, FiGithub, FiLinkedin } from 'react-icons/fi'
import { FaInstagram } from 'react-icons/fa'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Christian Calloway — for opportunities, photography prints, or just to say hello.',
}

const contactInfo = [
  {
    icon: FiMail,
    label: 'Email',
    value: 'cmqcalloway7@gmail.com',
    href: 'mailto:cmqcalloway7@gmail.com',
  },
  {
    icon: FiGithub,
    label: 'GitHub',
    value: 'github.com/cmarq07',
    href: 'https://github.com/cmarq07',
  },
  {
    icon: FaInstagram,
    label: 'Instagram',
    value: '@cmarq07',
    href: 'https://www.instagram.com/cmarq07',
  },
  {
    icon: FiLinkedin,
    label: 'LinkedIn',
    value: 'in/chrcalloway',
    href: 'https://www.linkedin.com/in/chrcalloway',
  },
]

export default function ContactPage() {
  return (
    <div className="page-transition py-16 lg:py-24">
      <div className="page-container">
        {/* Header */}
        <div className="mb-12">
          <h1 className="section-heading">Get in Touch</h1>
          <div className="section-divider" />
          <p className="section-subheading max-w-xl">
            Have an opportunity, a question about a print, or just want to say hello? I&apos;d love
            to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
                Send a message
              </h2>
              <Suspense>
                <ContactForm />
              </Suspense>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Other ways to reach me
              </h2>
              <div className="space-y-4">
                {contactInfo.map(({ icon: Icon, label, value, href }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('mailto') ? undefined : '_blank'}
                    rel="noreferrer"
                    className="flex items-center gap-3 group hover:text-brand transition-colors duration-200"
                  >
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:bg-brand/10 group-hover:text-brand transition-all duration-200 shrink-0">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{label}</p>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-brand transition-colors">
                        {value}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="card bg-brand/5 dark:bg-brand/10 border-brand/20">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Response time
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                I typically respond within 24–48 hours. For print inquiries, please include the
                photo title and your preferred size in the message.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
