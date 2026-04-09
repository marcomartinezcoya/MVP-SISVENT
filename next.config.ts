import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['jspdf', 'jspdf-autotable'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "pfuecwemraoqggpjymvf.supabase.co",
      },
    ],
  },
};

export default nextConfig;

