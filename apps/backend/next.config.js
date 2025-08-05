/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization to avoid server-side context issues
  output: 'standalone',
  
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          // Use environment variable for CORS origin in production
          { 
            key: "Access-Control-Allow-Origin", 
            value: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "*"
          },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      }
    ]
  }
}

module.exports = nextConfig
