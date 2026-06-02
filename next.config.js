/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
module.exports = nextConfig
