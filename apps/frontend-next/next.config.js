/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // REMOVED: env.NEXT_PUBLIC_API_URL to enable dynamic URL resolution
  // API URL is now computed dynamically in api.ts based on window.location
  
  // Disable caching for development
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  
  // Add headers to prevent aggressive caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
