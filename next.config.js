/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/personality-test',
  assetPrefix: '/personality-test',
  experimental: {
    appDir: true,
  },
  compiler: {
    styledComponents: true,
  },
  images: {
    domains: ['images.unsplash.com', 'cdn.openai.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    GA_TRACKING_ID: process.env.GA_TRACKING_ID,
  },
}

module.exports = nextConfig