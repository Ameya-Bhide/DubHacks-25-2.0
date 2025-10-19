/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to allow API routes
  // Removed trailingSlash: true to fix API route issues
  images: {
    unoptimized: true
  },
  // Temporarily disable CSP for development to fix AWS Cognito issues
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'Content-Security-Policy',
  //           value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' http://localhost:5004 https://cognito-idp.us-east-1.amazonaws.com https://*.amazonaws.com https://*.amazon.com https:; frame-src 'self' https:;"
  //         }
  //       ]
  //     }
  //   ]
  // }
}

module.exports = nextConfig
