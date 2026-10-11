"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/interactive";
import { toast } from "@/components/toast";

/* ===== 1. 注册 Service Worker（离线壳层缓存） ===== */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // 新版本发布后自动激活，无需用户手动刷新
          if (reg.waiting) reg.waiting.postMessage("SKIP_WAITING");
          reg.addEventListener("updatefound", () => {
            const nw = reg.installing;
            nw?.addEventListener("statechange", () => {
              if (nw.state === "installed" && navigator.serviceWorker.controller) {
                nw.postMessage("SKIP_WAITING");
              }
            });
          });
        })
        .catch(() => {
          /* 注册失败不影响正常使用 */
        });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}

/* ===== 2. 在线状态 Hook（含网络恢复自动同步打点） ===== */
export function useOnlineStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => {
      const isOnline = navigator.onLine;
      setOnline(isOnline);
      if (isOnline) {
        // 网络恢复：记录同步时间戳，清空待同步计数
        localStorage.setItem("kv:lastSynced", String(Date.now()));
        localStorage.setItem("kv:pending", "0");
      }
      window.dispatchEvent(new Event("kv:sync"));
    };
    setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

/* ===== 3. 离线提示横幅（不遮挡顶栏，置于其下方） ===== */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="fixed left-1/2 top-16 z-[60] -translate-x-1/2 rounded-full bg-amber-500/95 px-4 py-1.5 text-center text-[11px] font-medium text-black shadow-lg shadow-amber-900/30">
      离线模式 · 数据已本地保存，恢复网络后自动同步
    </div>
  );
}

/* ===== 4. 安装到桌面按钮（兼容不支持安装的浏览器，提供指引兜底） ===== */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton({ compact = false }: { compact?: boolean }) {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [guide, setGuide] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt as EventListener);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    // 等待一小段时间，确认浏览器不会触发安装事件后再显示「指引」
    const t = setTimeout(() => setTimedOut(true), 2000);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt as EventListener);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
  };

  // 支持安装的浏览器（Chrome / Edge / Samsung / Firefox）：直接弹安装
  if (deferred) {
    if (compact) {
      return (
        <button
          onClick={install}
          className="touch-btn rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur"
        >
          ⤓ 安装
        </button>
      );
    }
    return (
      <button
        onClick={install}
        className="touch-btn flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-900/30"
      >
        ⤓ 安装到桌面
      </button>
    );
  }

  // 不支持安装的浏览器（如 vivo 自带浏览器）：提供安装指引入口
  if (!timedOut) return null;
  if (compact) {
    return (
      <button
        onClick={() => setGuide(true)}
        className="touch-btn rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur"
      >
        ⤓ 指引
      </button>
    );
  }
  return (
    <>
      <button
        onClick={() => setGuide(true)}
        className="touch-btn flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-100 hover:bg-blue-500/20"
      >
        ⤓ 安装指引
      </button>
      <InstallGuide open={guide} onClose={() => setGuide(false)} />
    </>
  );
}

/* ===== 安装指引（针对不支持 PWA 安装的浏览器，引导用 Chrome 安装） ===== */
function InstallGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("链接已复制，去 Chrome 打开即可安装");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请手动复制地址栏链接");
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="安装到手机桌面">
      <div className="space-y-3 text-sm text-blue-100/90">
        <p className="text-[13px] leading-relaxed text-blue-200/70">
          部分手机自带浏览器（如 vivo / 华为 / 小米浏览器）不支持安装 PWA。请改用 Chrome（谷歌浏览器）安装：
        </p>
        <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
          <li>点击下方「复制链接」按钮</li>
          <li>打开手机上的 <b className="text-white">Chrome（谷歌浏览器）</b></li>
          <li>把链接粘贴到地址栏并打开本页面</li>
          <li>
            点击地址栏右侧的「安装」图标，或右上角 ⋮ →「安装应用」
          </li>
        </ol>
        <button
          onClick={copy}
          className="touch-btn w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30"
        >
          {copied ? "✓ 已复制" : "复制链接"}
        </button>
      </div>
    </Modal>
  );
}

/* ===== 5. 同步状态徽标（在线/离线 + 最近同步时间） ===== */
export function SyncBadge() {
  const online = useOnlineStatus();
  const [last, setLast] = useState("");

  useEffect(() => {
    const update = () => {
      const t = localStorage.getItem("kv:lastSynced");
      if (t) {
        const d = new Date(Number(t));
        setLast(
          d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
        );
      }
    };
    update();
    window.addEventListener("kv:sync", update);
    return () => window.removeEventListener("kv:sync", update);
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`h-2 w-2 rounded-full ${
          online
            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
            : "bg-amber-400"
        }`}
      />
      <span className="text-[10px] text-blue-200/60">
        {online ? `已同步${last ? " · " + last : ""}` : "离线 · 本地数据"}
      </span>
    </div>
  );
}
