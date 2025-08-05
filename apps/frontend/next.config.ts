import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['pub-5f2b20e3d1e945a8821922fe1f11631c.r2.dev'],
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Use standalone output to avoid static generation issues
  output: 'standalone',
  
  // Custom webpack config to handle the build issue
  webpack: (config, { dev, isServer }) => {
    // Disable minification for server builds to avoid context issues
    if (!dev && isServer) {
      config.optimization.minimize = false;
    }
    return config;
  },
};

export default nextConfig;
