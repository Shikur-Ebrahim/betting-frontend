import type { NextConfig } from "next";

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://betting-backend-adlh.onrender.com';

const nextConfig: NextConfig = {
  experimental: {
    // @ts-ignore
    turbopack: {
      root: '.'
    }
  },
  rewrites: async () => [
    {
      source: '/api/:path*',
      destination: `${backendBaseUrl}/api/:path*`
    }
  ],
  env: {
    BACKEND_URL: backendBaseUrl,
    NEXT_PUBLIC_API_URL: `${backendBaseUrl}/api`
  }
};

export default nextConfig;
