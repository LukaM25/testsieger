/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  outputFileTracingIncludes: {
    // This forces the binary to be included in your API routes
    '/api/**/*': ['./node_modules/@sparticuz/chromium/bin/**/*'],
  },
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
