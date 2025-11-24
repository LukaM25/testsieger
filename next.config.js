/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
    outputFileTracingIncludes: {
      // This forces the binary to be included in your API routes
      '/api/**/*': ['./node_modules/@sparticuz/chromium/bin/**/*'],
    },
  },
};

module.exports = nextConfig;