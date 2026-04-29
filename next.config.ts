import type { NextConfig } from "next";

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
      destination: 'http://127.0.0.1:3001/api/:path*'
    }
  ]
};

export default nextConfig;
