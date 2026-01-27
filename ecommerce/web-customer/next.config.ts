import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ipfs.io', pathname: '/ipfs/**' },
    ],
  },
}

export default nextConfig
