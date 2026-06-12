/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/landing',
        destination: '/landing.html',
        permanent: false,
      },
    ];
  },
}
module.exports = nextConfig
