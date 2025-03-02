/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/holdom',
  images: {
    unoptimized: true,
  },
  assetPrefix: '/holdom/',
  trailingSlash: true,
}

module.exports = nextConfig 