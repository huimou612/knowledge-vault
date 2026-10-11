"use client";

import React from "react";
import Link from "next/link";

// ===== 通用玻璃拟态 UI 组件（蓝色科技风） =====

export function GlassCard({
  children,
  className = "",
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`glass ${hover ? "" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-white/90 tracking-wide">{title}</h3>
      {action}
    </div>
  );
}

export function PageHeader({ title, desc, extra, avatar }: { title: string; desc?: string; extra?: React.ReactNode; avatar?: boolean }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-4">
        {avatar && (
          <div className="avatar-ring shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/avatar.jpg" alt="" className="h-14 w-14 rounded-full object-cover" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h1>
          {desc && <p className="mt-1 text-sm text-blue-200/60">{desc}</p>}
        </div>
      </div>
      {extra}
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  accent = "blue",
  href,
  onClick,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent?: "blue" | "cyan" | "pink" | "amber" | "green";
  href?: string;
  onClick?: () => void;
}) {
  const accents = {
    blue: "from-blue-500/25 to-blue-500/5 text-blue-300",
    cyan: "from-cyan-500/25 to-cyan-500/5 text-cyan-300",
    pink: "from-pink-500/25 to-pink-500/5 text-pink-300",
    amber: "from-amber-500/25 to-amber-500/5 text-amber-300",
    green: "from-emerald-500/25 to-emerald-500/5 text-emerald-300",
  };
  const clickable = Boolean(href || onClick);
  const body = (
    <GlassCard hover className={`fade-up ${clickable ? "cursor-pointer transition-transform active:scale-[0.97] hover:border-blue-400/30" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-blue-200/70 uppercase">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white tabular-nums md:text-3xl">{value}</p>
          {sub && <p className="mt-1 text-xs text-blue-200/50">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-xl ${accents[accent]}`}>
          {icon}
        </div>
      </div>
      {clickable && <p className="mt-2 text-right text-[10px] text-cyan-400/60">点击查看 →</p>}
    </GlassCard>
  );
  if (href) return <Link href={href} className="block">{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className="block w-full text-left">{body}</button>;
  return body;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const styles = {
    primary:
      "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-900/40",
    ghost: "glass text-blue-100 hover:text-white hover:bg-blue-500/20",
    danger: "bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-blue-400/15 bg-blue-950/40 px-3 py-2 text-sm text-white placeholder-blue-200/40 transition-all ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded-xl border border-blue-400/15 bg-blue-950/40 px-3 py-2 text-sm text-white transition-all ${props.className ?? ""}`}
    >
      {props.children}
    </select>
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-blue-400/15 bg-blue-950/40 px-3 py-2 text-sm text-white placeholder-blue-200/40 transition-all ${props.className ?? ""}`}
    />
  );
}

export function Tag({ children, color = "blue" }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, string> = {
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    red: "bg-red-500/15 text-red-300 border-red-500/30",
    zinc: "bg-white/10 text-zinc-300 border-white/15",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${map[color] ?? map.zinc}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-blue-950/50 ${className}`}>
      <div className="progress-fill h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/** 迷你柱状图（纯 CSS） */
export function MiniBarChart({
  data,
  labels,
  color = "bg-blue-500",
  height = 80,
}: {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="group flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] text-blue-200/60 opacity-0 transition-opacity group-hover:opacity-100">{v}</span>
          <div
            className={`w-full rounded-t-md ${color} opacity-75 transition-all group-hover:opacity-100`}
            style={{ height: `${Math.max(4, (v / max) * (height - 30))}px` }}
          />
          <span className="text-[10px] text-blue-200/50">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <span className="text-3xl opacity-50">{icon}</span>
      <p className="mt-2 text-sm text-blue-200/50">{text}</p>
    </div>
  );
}

export function Avatar({ size = "md", ring = true }: { size?: "sm" | "md" | "lg"; ring?: boolean }) {
  const sizes = { sm: "h-8 w-8", md: "h-11 w-11", lg: "h-16 w-16" };
  return (
    <div className={ring ? "avatar-ring shrink-0" : "shrink-0 rounded-full overflow-hidden"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/avatar.jpg" alt="avatar" className={`${sizes[size]} rounded-full object-cover`} />
    </div>
  );
}