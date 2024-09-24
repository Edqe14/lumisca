const { config } = require('dotenv');

config({
  path: '.env.local',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/:path*`,
      },
    ];
  },
  webpack(config) {
    config.resolve.symlinks = false;

    return config;
  },
  pageExtensions: [
    'page.tsx',
    'page.ts',
    'page.jsx',
    'page.js',
    'page.md',
    'page.mdx',
  ],
};

module.exports = nextConfig;
