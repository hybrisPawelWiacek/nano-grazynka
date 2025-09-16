/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://6d0e6925-6bd1-4a2e-b8a8-5d737fd235f6-00-3hgmow4b6i0zo.riker.replit.dev:3001',
  },
  async rewrites() {
    // For server-side API calls in Docker
    if (process.env.API_URL_INTERNAL) {
      return [
        {
          source: '/api/proxy/:path*',
          destination: `${process.env.API_URL_INTERNAL}/api/:path*`,
        },
      ];
    }
    return [];
  },
  // Disable strict mode for development
  reactStrictMode: false,
  // Optimize for Docker
  output: 'standalone',
  // Allow all hosts for Replit proxy
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;