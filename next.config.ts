import type { NextConfig } from "next";

const backendBaseUrl = (process.env.BACKEND_URL || 'https://betting-backend-adlh.onrender.com').replace(/\/$/, '');

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
  ]
};

export default nextConfig;
