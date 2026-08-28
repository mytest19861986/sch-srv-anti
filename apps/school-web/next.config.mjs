/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  swcMinify: false,
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
