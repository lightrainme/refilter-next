// next.config.ts
import { config } from "dotenv";
import type { NextConfig } from "next";
import path from "path";

// 환경 구분
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.local";

config({ path: path.resolve(process.cwd(), envFile) });

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: true,
};

export default nextConfig;
