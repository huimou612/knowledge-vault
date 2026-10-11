"use client";

// ===== 全局 Toast 系统 =====
// 用法：import { toast } from "@/components/toast";
//       toast.success("已添加"); toast.error("操作失败"); toast.info("提示");
// 无需 Context，模块级事件总线，任意组件/工具函数中均可调用。

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

type Listener = (items: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let listeners: Listener[] = [];
let seq = 0;

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

function push(type: ToastType, message: string, duration = 2200) {
  const id = ++seq;
  toasts = [...toasts, { id, type, message }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, duration);
}

export const toast = {
  success: (msg: string) => push("success", msg),
  error: (msg: string) => push("error", msg, 3000),
  info: (msg: string) => push("info", msg),
};

const STYLES: Record<ToastType, { icon: string; cls: string }> = {
  success: { icon: "✅", cls: "border-emerald-400/40 bg-emerald-950/80 text-emerald-100" },
  error: { icon: "❌", cls: "border-red-400/40 bg-red-950/80 text-red-100" },
  info: { icon: "💡", cls: "border-blue-400/40 bg-blue-950/85 text-blue-100" },
};

/** 挂载在 layout 中的 Toast 容器 */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const l: Listener = (v) => setItems(v);
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 md:top-6">
      {items.map((t) => {
        const s = STYLES[t.type];
        return (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto flex max-w-[92vw] items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium shadow-2xl shadow-black/40 backdrop-blur-xl md:max-w-md ${s.cls}`}
          >
            <span>{s.icon}</span>
            <span className="flex-1">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
