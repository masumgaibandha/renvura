import type { NextConfig } from 'next';

/**
 * No i18n plugin: Renvura is one English-first page set with Bangla applied per
 * content run, so there is no locale routing to configure (D-02, D-03).
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
