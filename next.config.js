/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/holdom',
  assetPrefix: '/holdom/',
  trailingSlash: true,
  distDir: 'out',
}

module.exports = nextConfig 