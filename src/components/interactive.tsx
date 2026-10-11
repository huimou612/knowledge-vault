"use client";

// ===== 全局交互组件：Modal / ActionSheet / FAB / 长按 Hook / 确认框 =====

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui";

/* ---------------- Modal 弹窗（表单容器） ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        className="glass-strong modal-in w-full max-h-[88dvh] overflow-y-auto rounded-t-3xl border border-blue-400/20 bg-[#0a1229]/95 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:max-w-lg md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="touch-btn flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-200/60 hover:text-white">
            ✕
          </button>
        </div>
        <div className="space-y-3">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- ActionSheet 底部操作面板（长按触发） ---------------- */
export interface SheetAction {
  label: string;
  icon?: string;
  danger?: boolean;
  onClick: () => void;
}

export function ActionSheet({
  open,
  onClose,
  title,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  actions: SheetAction[];
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div
        className="modal-in w-full rounded-t-3xl border border-blue-400/20 bg-[#0a1229]/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:max-w-sm md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <p className="mb-3 truncate px-2 text-center text-xs text-blue-200/60">{title}</p>}
        <div className="space-y-1.5">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => {
                onClose();
                a.onClick();
              }}
              className={`touch-btn flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all active:scale-[0.98] ${
                a.danger
                  ? "bg-red-500/10 text-red-300 hover:bg-red-500/20"
                  : "bg-blue-500/10 text-blue-50 hover:bg-blue-500/20"
              }`}
            >
              {a.icon && <span className="text-base">{a.icon}</span>}
              <span>{a.label}</span>
            </button>
          ))}
          <button onClick={onClose} className="touch-btn mt-2 w-full rounded-2xl bg-white/5 px-4 py-3.5 text-sm text-blue-200/60 hover:text-white">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- FAB 悬浮按钮 ---------------- */
export function FAB({ onClick, icon = "＋", label }: { onClick: () => void; icon?: string; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label ?? "新增"}
      className="fab-pop fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-[80] flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-2xl font-light text-white shadow-xl shadow-blue-900/50 transition-all active:scale-90 md:bottom-8 md:right-8 md:h-[3.75rem] md:w-auto md:gap-2 md:px-5"
    >
      <span>{icon}</span>
      {label && <span className="hidden text-sm font-medium md:inline">{label}</span>}
    </button>
  );
}

/* ---------------- 长按 Hook（500ms 触发，移动端友好） ---------------- */
export function useLongPress(onLongPress: () => void, onClick?: () => void, ms = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      longPressed.current = false;
      const point = "touches" in e ? e.touches[0] : e;
      startPos.current = { x: point.clientX, y: point.clientY };
      timer.current = setTimeout(() => {
        longPressed.current = true;
        if (navigator.vibrate) navigator.vibrate(15);
        onLongPress();
      }, ms);
    },
    [onLongPress, ms]
  );

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const move = useCallback(
    (e: React.TouchEvent) => {
      // 手指滑动超过 10px 视为滚动，取消长按
      if (!startPos.current) return;
      const t = e.touches[0];
      if (Math.abs(t.clientX - startPos.current.x) > 10 || Math.abs(t.clientY - startPos.current.y) > 10) cancel();
    },
    [cancel]
  );

  const end = useCallback(() => {
    cancel();
    if (!longPressed.current && onClick) onClick();
  }, [cancel, onClick]);

  return {
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: end,
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      cancel();
      if (!longPressed.current) {
        longPressed.current = true;
        onLongPress();
      }
    },
  };
}

/* ---------------- 确认对话框（删除等危险操作） ---------------- */
export function Confirm({
  open,
  onClose,
  onConfirm,
  title = "确认操作",
  message,
  confirmText = "确认删除",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-blue-100/80">{message}</p>
    </Modal>
  );
}

/* ---------------- 通用表单字段包装 ---------------- */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-blue-200/70">{label}</span>
      {children}
    </label>
  );
}
