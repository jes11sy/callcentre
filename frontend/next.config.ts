import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Отключаем ESLint во время production билда
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Отключаем проверки TypeScript во время production билда
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "media-src 'self' blob: data: https://s3.twcstorage.ru https://*.twcstorage.ru"
          }
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
