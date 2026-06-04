import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Christian Calloway',
    template: '%s | Christian Calloway',
  },
  description:
    'Full-stack Software Engineer II at Microsoft. Personal portfolio showcasing projects, photography, and more.',
  keywords: ['Christian Calloway', 'Software Engineer', 'Microsoft', 'Portfolio', 'Photography'],
  authors: [{ name: 'Christian Calloway' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.cmarqc.com',
    siteName: 'Christian Calloway',
    title: 'Christian Calloway',
    description: 'Full-stack Software Engineer II at Microsoft.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmPlexSans.variable} font-sans min-h-screen flex flex-col`}>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
