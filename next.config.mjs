/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        // Watermarked gallery previews served from the public R2 bucket. Not
        // strictly required (previews render via a plain <img>), but keeps the
        // door open for next/image use and documents the trusted host.
        protocol: 'https',
        hostname: 'photography.christiancalloway.com',
      },
    ],
  },
}

export default nextConfig
