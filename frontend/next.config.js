/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101',
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
  // Enable SWC minification
  swcMinify: true,
};

module.exports = nextConfig;