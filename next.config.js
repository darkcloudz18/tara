/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    // Add your image hosting domains here later (e.g., cloudinary, s3)
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
