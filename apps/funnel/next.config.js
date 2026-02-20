import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@anplexa/core', '@anplexa/ui', '@anplexa/services'],
  // For monorepo support - trace dependencies correctly
  outputFileTracingRoot: join(__dirname, '../..'),
};

export default nextConfig;
