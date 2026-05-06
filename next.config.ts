import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
    deviceSizes: [640, 768, 1024],
    imageSizes: [16, 32, 48, 64, 96, 128],
  },
  experimental: {
    viewTransition: true,
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr'],
  },
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
};

export default nextConfig;
