/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable and enabled by default in Next.js 14
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pckspbmqfewwpvjafvvf.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
