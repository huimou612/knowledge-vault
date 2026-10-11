// ===== 数据类型定义（与 supabase/schema.sql 对应） =====

export interface Task {
  id: string;
  title: string;
  category: string; // 学习 / 自媒体 / 闲鱼 / 生活 / 其他
  priority: "high" | "medium" | "low";
  date: string; // YYYY-MM-DD 计划执行日期
  time?: string; // HH:mm 时间轴排程
  done: boolean;
  doneAt?: string;
  createdAt: string;
}

export interface Checkin {
  id: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface StudyLog {
  id: string;
  date: string;
  subject: string; // 英语 / 编程 / 运营 / 其他
  minutes: number;
  note?: string;
  createdAt: string;
}

export interface Word {
  id: string;
  word: string;
  phonetic?: string;
  meaning: string;
  example?: string;
  mastered: boolean;
  createdAt: string;
}

export interface StudyPlan {
  id: string;
  title: string;
  subject: string;
  target: string; // 目标描述
  deadline: string;
  progress: number; // 0-100
  createdAt: string;
}

export type MediaPlatform = "xiaohongshu" | "douyin" | "gongzhonghao";
export type MediaStatus = "idea" | "drafting" | "ready" | "published";

export interface MediaWork {
  id: string;
  platform: MediaPlatform;
  title: string;
  status: MediaStatus;
  publishDate?: string;
  views?: number;
  likes?: number;
  comments?: number;
  collects?: number;
  review?: string; // 数据复盘
  createdAt: string;
}

export type ProductStatus = "on-sale" | "sold" | "off-shelf";

export interface Product {
  id: string;
  title: string;
  cost: number; // 成本
  price: number; // 售价
  stock: number;
  status: ProductStatus;
  // 易店助手对齐字段（可选）
  shopId?: string; // 店铺 ID
  sourceId?: string; // 闲鱼/易店助手商品 ID
  imageUrl?: string; // 商品图
  exposure?: number; // 曝光量
  pageViews?: number; // 浏览量
  wants?: number; // 想要数
  autoDeliver?: boolean; // 是否自动发货
  createdAt: string;
}

export interface Order {
  id: string;
  productId?: string;
  title: string;
  price: number; // 成交价
  cost: number; // 成本
  quantity: number;
  date: string;
  status: "completed" | "refunded";
  createdAt: string;
}

export interface KnowledgeNote {
  id: string;
  title: string;
  content: string; // Markdown
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ===== 闲鱼扩展：店铺 / 卡券 / 模板 / 自动回复 / 日志 =====

export interface Shop {
  id: string;
  name: string;
  platform: "xianyu"; // 后续可扩展多平台
  status: "active" | "paused" | "suspended";
  rating: number; // 0-5
  followerCount: number;
  description?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "fixed" | "percent";
  value: number; // 固定金额 或 百分比
  minSpend: number; // 满多少可用
  status: "active" | "expired" | "used-up";
  expiresAt: string;
  used: number;
  total: number;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  trigger: string; // 触发关键词
  content: string; // 回复内容
  enabled: boolean;
  matchMode: "exact" | "fuzzy" | "contains";
  createdAt: string;
}

export interface RunLog {
  id: string;
  type: "auto-send" | "auto-reply" | "system" | "warning";
  message: string;
  timestamp: string;
}
