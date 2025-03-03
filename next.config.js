/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/holdom',
  assetPrefix: '/holdom/',
}

module.exports = nextConfig 