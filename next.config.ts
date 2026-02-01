import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 生产构建时忽略 ESLint 错误（警告会显示但不会阻止构建）
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 生产构建时忽略 TypeScript 错误（仅在开发时检查）
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
