/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Turbopack (use classic Webpack) — much lower RAM usage
  experimental: {},
  // Reduce memory usage
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable source maps in dev to save RAM
      config.devtool = false;
    }
    return config;
  },
}

module.exports = nextConfig
