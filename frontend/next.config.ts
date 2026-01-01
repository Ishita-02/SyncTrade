/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config: any) => {
    // 1. Fix for RainbowKit / Wagmi polyfills
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false 
    };

    // 2. CRITICAL FIX: Tell webpack to ignore these Node-only packages
    // This stops it from trying to bundle 'why-is-node-running'
    config.externals.push(
      'pino-pretty', 
      'lokijs', 
      'encoding', 
      'why-is-node-running',
      'porto',              
      '@gemini-wallet/core'
    );

    return config;
  },
};

export default nextConfig;