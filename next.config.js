/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  // Expoe o SHA do commit pro client (auto-reload em App.jsx)
  env: {
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || "dev",
  },
  async headers() {
    return [
      {
        source: '/:path((?!_next/static).*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ];
  },
};
module.exports = nextConfig;
