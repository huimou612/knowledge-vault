import type { NextConfig } from "next";

// GitHub Pages 会把站点部署在 /<仓库名>/ 子路径下，
// 此时必须设置 basePath，否则 CSS/JS 等静态资源会全部 404。
// 本地开发、CloudStudio、Vercel 等根路径部署时该变量为空，行为不变。
const basePath = process.env.PAGES_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
