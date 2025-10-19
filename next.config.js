/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to allow API routes
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
