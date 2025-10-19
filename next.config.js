/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to allow API routes
  // Removed trailingSlash: true to fix API route issues
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
