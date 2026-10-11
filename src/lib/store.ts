"use client";

// ===== 本地优先数据层 =====
// 默认使用 localStorage 持久化，开箱即用；
// 配置 .env.local 中的 Supabase 环境变量后，可在此基础上扩展为云端同步。

import { useCallback, useEffect, useState } from "react";
import { uid, todayStr } from "./utils";

const PREFIX = "kv_";

function read<T>(key: string): T[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T[]) : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

/** 通用集合 Hook：管理一类数据（数组），自动持久化到 localStorage */
export function useCollection<T extends { id: string }>(key: string, seed: T[] = []) {
  const [items, setItems] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const existing = read<T>(key);
    if (existing) {
      setItems(existing);
    } else {
      setItems(seed);
      write(key, seed);
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const saveAll = useCallback(
    (next: T[] | ((prev: T[]) => T[])) => {
      setItems((prev) => {
        const value = typeof next === "function" ? (next as (p: T[]) => T[])(prev) : next;
        write(key, value);
        return value;
      });
    },
    [key]
  );

  const add = useCallback(
    (item: Omit<T, "id"> & { id?: string }): T => {
      const full = { ...item, id: item.id ?? uid() } as T;
      saveAll((prev) => [full, ...prev]);
      return full;
    },
    [saveAll]
  );

  const update = useCallback(
    (id: string, patch: Partial<T>) => {
      saveAll((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    },
    [saveAll]
  );

  const remove = useCallback(
    (id: string) => {
      saveAll((prev) => prev.filter((it) => it.id !== id));
    },
    [saveAll]
  );

  return { items, loaded, add, update, remove, saveAll };
}

/** 跨集合聚合读取（用于 Dashboard / AI 助手，只在客户端调用） */
export function readAllCollections() {
  return {
    tasks: read<import("./types").Task>("tasks") ?? [],
    checkins: read<import("./types").Checkin>("checkins") ?? [],
    studyLogs: read<import("./types").StudyLog>("study_logs") ?? [],
    words: read<import("./types").Word>("words") ?? [],
    plans: read<import("./types").StudyPlan>("plans") ?? [],
    mediaWorks: read<import("./types").MediaWork>("media_works") ?? [],
    products: read<import("./types").Product>("products") ?? [],
    orders: read<import("./types").Order>("orders") ?? [],
    notes: read<import("./types").KnowledgeNote>("notes") ?? [],
    shops: read<import("./types").Shop>("shops") ?? [],
    coupons: read<import("./types").Coupon>("coupons") ?? [],
    templates: read<import("./types").MessageTemplate>("templates") ?? [],
    runLogs: read<import("./types").RunLog>("run_logs") ?? [],
  };
}

/** 批量写入（CSV 导入用） */
export function writeCollection<T>(key: string, value: T[]) {
  write(key, value);
}

export { todayStr };
