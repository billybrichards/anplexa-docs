const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@anplexa/core', '@anplexa/ui', '@anplexa/contracts'],
  // For monorepo support - trace dependencies correctly
  outputFileTracingRoot: path.join(__dirname, '../..'),
  // Skip type checking during build (we'll do it separately)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Externalize Node.js-only packages when building for client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        dns: false,
        net: false,
        tls: false,
        'better-sqlite3': false,
        pg: false,
        'pg-native': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
