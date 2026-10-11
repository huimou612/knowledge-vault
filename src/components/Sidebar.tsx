"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InstallButton, SyncBadge } from "@/components/pwa";

const NAV = [
  { href: "/", label: "工作台", icon: "◈", desc: "Dashboard" },
  { href: "/tasks", label: "任务管理", icon: "✓", desc: "Tasks" },
  { href: "/learning", label: "学习中心", icon: "❖", desc: "Learning" },
  { href: "/media", label: "自媒体", icon: "▶", desc: "Creator" },
  { href: "/xianyu", label: "闲鱼经营", icon: "¥", desc: "Business" },
  { href: "/knowledge", label: "知识库", icon: "⌘", desc: "Knowledge" },
  { href: "/ai", label: "AI 助手", icon: "✦", desc: "Assistant" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ===== PC 端侧边栏 ===== */}
      <aside className="fixed top-0 left-0 z-40 hidden h-screen w-64 flex-col border-r border-blue-400/10 md:flex">
        {/* 顶部：头像 + 品牌 */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-8">
          <div className="avatar-ring shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/avatar.jpg" alt="avatar" className="h-11 w-11 rounded-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">知识仓库</p>
            <p className="text-[10px] tracking-widest text-blue-300/70 uppercase">Knowledge Vault</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  active
                    ? "bg-gradient-to-r from-blue-600/35 to-cyan-500/15 text-white shadow-inner ring-1 ring-blue-400/30"
                    : "text-blue-100/70 hover:bg-blue-500/10 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-all ${
                    active ? "bg-blue-500/30 text-blue-100" : "bg-blue-500/10 text-blue-300/60 group-hover:text-blue-200"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 pb-6 space-y-2">
          <div className="glass rounded-xl p-3">
            <InstallButton />
            <div className="mt-2 flex items-center justify-between">
              <SyncBadge />
            </div>
          </div>
          <p className="text-center text-[10px] text-blue-200/50">个人第二大脑 · v1.0</p>
        </div>
      </aside>

      {/* ===== 移动端顶部栏 ===== */}
      <header className="fixed top-0 right-0 left-0 z-40 flex items-center gap-3 border-b border-blue-400/10 bg-[#0a1224]/80 px-4 py-3 backdrop-blur safe-top md:hidden">
        <div className="avatar-ring shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/avatar.jpg" alt="avatar" className="h-8 w-8 rounded-full object-cover" />
        </div>
        <p className="text-sm font-bold text-white">知识仓库</p>
        <div className="ml-auto">
          <InstallButton compact />
        </div>
      </header>

      {/* ===== 移动端底部导航（带安全区） ===== */}
      <nav className="fixed right-0 bottom-0 left-0 z-40 grid grid-cols-7 border-t border-blue-400/10 bg-[#0a1224]/95 backdrop-blur-lg safe-bottom pb-[env(safe-area-inset-bottom,0px)] md:hidden">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`touch-btn flex flex-col items-center gap-0.5 py-2 ${
                active ? "text-cyan-300" : "text-blue-200/50"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[9px] leading-tight">{item.label}</span>
              {active && <span className="mt-0.5 h-0.5 w-4 rounded-full bg-cyan-300" />}
            </Link>
          );
        })}
      </nav>
    </>
  );
}