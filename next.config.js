/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to allow API routes
  // Removed trailingSlash: true to fix API route issues
  images: {
    unoptimized: true
  },
  // Fix for Electron static asset loading
  assetPrefix: process.env.NODE_ENV === 'development' ? '' : undefined,
  // Ensure proper base path for Electron
  basePath: '',
  // Fix for webpack chunk loading issues
  webpack: (config, { isServer }) => {
    // Fix for webpack chunk loading issues
    if (!isServer) {
      // Keep AWS Amplify in the main bundle to avoid chunk loading issues
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          aws: {
            test: /[\\/]node_modules[\\/]@?aws-amplify[\\/]/,
            name: 'aws-amplify',
            chunks: 'all',
            priority: 10,
            enforce: true,
            reuseExistingChunk: true
          },
        },
      }
      
      // Fix for Electron asset loading
      config.output.publicPath = '/'
    }
    return config
  }
}

module.exports = nextConfig
