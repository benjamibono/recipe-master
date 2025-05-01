/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dkgfpvmstymrqeodpqis.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "*.pexels.com",
      },
    ],
  },
  eslint: {
    // Desactivar comprobación de ESLint durante la build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚠️ Esto permite ignorar errores de tipo durante la build
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
