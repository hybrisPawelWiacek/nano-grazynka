/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (
      process.env.NODE_ENV === 'production' 
        ? '/api' // Use relative API calls in production
        : 'http://localhost:3001' // Default to localhost for development
    ),
  },
  async rewrites() {
    const rewrites = [];
    
    // For server-side API calls in Docker
    if (process.env.API_URL_INTERNAL) {
      rewrites.push({
        source: '/api/proxy/:path*',
        destination: `${process.env.API_URL_INTERNAL}/api/:path*`,
      });
    }
    
    // In production, rewrite /api/:path* to the backend service
    if (process.env.NODE_ENV === 'production' && process.env.BACKEND_URL) {
      rewrites.push({
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL}/api/:path*`,
      });
    }
    
    return rewrites;
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