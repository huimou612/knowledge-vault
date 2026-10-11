import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/toast";
import { ServiceWorkerRegister, OfflineBanner } from "@/components/pwa";

export const metadata: Metadata = {
  title: "知识仓库 Knowledge Vault · 个人工作台",
  description: "个人第二大脑：任务管理、日程安排、便签备忘录与快捷入口，离线可用、可安装到手机桌面。",
  applicationName: "知识仓库",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "知识仓库",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#050507",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <div className="ambient">
          <div className="scan" />
        </div>
        <Sidebar />
        <Toaster />
        <ServiceWorkerRegister />
        <OfflineBanner />
        <main className="min-h-screen min-h-dvh px-3 pt-[4.5rem] pb-[5rem] md:pt-8 md:pb-10 md:pl-72 md:pr-8 transition-all duration-300">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </body>
    </html>
  );
}
