/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    distDir: '.next',
    // Add this if you're using API routes
    experimental: {
      outputFileTracingRoot: undefined,
    }
  }
  
  module.exports = nextConfig