// ===== 首次启动时的演示数据，帮助用户快速了解各模块 =====
import { Task, StudyLog, Word, StudyPlan, MediaWork, Product, Order, KnowledgeNote, Checkin, Shop, Coupon, MessageTemplate, RunLog } from "./types";
import { todayStr, lastNDays } from "./utils";

const days = lastNDays(7);
const at = (i: number) => days[Math.min(i, days.length - 1)];

export const seedTasks: Task[] = [
  { id: "t1", title: "背 30 个英语单词", category: "学习", priority: "high", date: at(6), done: true, doneAt: at(6), createdAt: at(6) },
  { id: "t2", title: "小红书笔记选题 1 个", category: "自媒体", priority: "medium", date: at(6), done: true, doneAt: at(6), createdAt: at(6) },
  { id: "t3", title: "闲鱼上新 2 个商品", category: "闲鱼", priority: "medium", date: at(6), done: false, createdAt: at(6) },
  { id: "t4", title: "整理知识库笔记", category: "学习", priority: "low", date: at(6), done: false, createdAt: at(6) },
  { id: "t5", title: "阅读 30 分钟", category: "学习", priority: "medium", date: at(5), done: true, doneAt: at(5), createdAt: at(5) },
];

export const seedCheckins: Checkin[] = days.slice(2).map((d, i) => ({
  id: "c" + i,
  date: d,
  createdAt: d,
}));

export const seedStudyLogs: StudyLog[] = [
  { id: "s1", date: at(2), subject: "英语", minutes: 45, note: "精听训练", createdAt: at(2) },
  { id: "s2", date: at(3), subject: "英语", minutes: 60, note: "单词 + 阅读", createdAt: at(3) },
  { id: "s3", date: at(4), subject: "运营", minutes: 30, note: "研究小红书爆款", createdAt: at(4) },
  { id: "s4", date: at(5), subject: "编程", minutes: 90, note: "Next.js 实战", createdAt: at(5) },
  { id: "s5", date: at(6), subject: "英语", minutes: 40, note: "口语跟读", createdAt: at(6) },
];

export const seedWords: Word[] = [
  { id: "w1", word: "discipline", phonetic: "/ˈdɪsəplɪn/", meaning: "n. 纪律；自律", example: "Discipline is the bridge between goals and accomplishment.", mastered: true, createdAt: at(3) },
  { id: "w2", word: "leverage", phonetic: "/ˈliːvərɪdʒ/", meaning: "n./v. 杠杆；利用", example: "Leverage your knowledge to build assets.", mastered: false, createdAt: at(4) },
  { id: "w3", word: "compound", phonetic: "/kəmˈpaʊnd/", meaning: "v. 复合增长；adj. 复合的", example: "Small habits compound over time.", mastered: false, createdAt: at(5) },
];

export const seedPlans: StudyPlan[] = [
  { id: "p1", title: "英语词汇量破 8000", subject: "英语", target: "每天 30 词，持续 3 个月", deadline: at(6).slice(0, 8) + "30", progress: 35, createdAt: at(0) },
  { id: "p2", title: "掌握 Next.js 全栈开发", subject: "编程", target: "完成 3 个实战项目", deadline: at(6).slice(0, 8) + "28", progress: 60, createdAt: at(1) },
];

export const seedMediaWorks: MediaWork[] = [
  { id: "m1", platform: "xiaohongshu", title: "如何用第二大脑管理碎片知识", status: "published", publishDate: at(4), views: 3200, likes: 268, comments: 34, collects: 152, review: "封面图点击率高，但完读率一般，下次开头更抓人。", createdAt: at(3) },
  { id: "m2", platform: "douyin", title: "30 秒讲清费曼学习法", status: "ready", publishDate: at(6), createdAt: at(4) },
  { id: "m3", platform: "gongzhonghao", title: "我的闲鱼副业复盘（第 1 期）", status: "drafting", createdAt: at(5) },
  { id: "m4", platform: "xiaohongshu", title: "自律打卡 100 天会发生什么", status: "idea", createdAt: at(6) },
];

export const seedProducts: Product[] = [
  { id: "pr1", title: "考研英语真题电子版合集", cost: 5, price: 19.9, stock: 999, status: "on-sale", createdAt: at(0) },
  { id: "pr2", title: "Notion 模板 · 个人知识库", cost: 0, price: 29.9, stock: 999, status: "on-sale", createdAt: at(1) },
  { id: "pr3", title: "二手机械键盘 87 键", cost: 120, price: 199, stock: 1, status: "sold", createdAt: at(2) },
];

export const seedOrders: Order[] = [
  { id: "o1", productId: "pr1", title: "考研英语真题电子版合集", price: 19.9, cost: 5, quantity: 1, date: at(3), status: "completed", createdAt: at(3) },
  { id: "o2", productId: "pr2", title: "Notion 模板 · 个人知识库", price: 29.9, cost: 0, quantity: 2, date: at(4), status: "completed", createdAt: at(4) },
  { id: "o3", productId: "pr3", title: "二手机械键盘 87 键", price: 199, cost: 120, quantity: 1, date: at(5), status: "completed", createdAt: at(5) },
  { id: "o4", productId: "pr1", title: "考研英语真题电子版合集", price: 19.9, cost: 5, quantity: 1, date: at(6), status: "completed", createdAt: at(6) },
];

export const seedNotes: KnowledgeNote[] = [
  {
    id: "n1",
    title: "第二大脑方法论（PARA）",
    content: "# PARA 笔记法\n\n- **Projects**：有截止日期的短期目标\n- **Areas**：长期维护的领域\n- **Resources**：未来可能有用的资料\n- **Archives**：归档内容\n\n> 知识不是收藏出来的，是用出来的。",
    category: "方法论",
    tags: ["知识管理", "PARA"],
    createdAt: at(2),
    updatedAt: at(2),
  },
  {
    id: "n2",
    title: "闲鱼选品原则",
    content: "# 选品三原则\n\n1. 虚拟资料优先：零成本、可复制\n2. 信息差套利：你知道的，别人不知道\n3. 复购与口碑：标题关键词 + 详情页信任感",
    category: "副业",
    tags: ["闲鱼", "选品"],
    createdAt: at(3),
    updatedAt: at(4),
  },
];

export const seedShops: Shop[] = [
  {
    id: "shop1",
    name: "知识仓库小店",
    platform: "xianyu",
    status: "active",
    rating: 5.0,
    followerCount: 1280,
    description: "专注个人成长类虚拟资料 / 模板 / 课程",
    createdAt: at(0),
  },
];

export const seedCoupons: Coupon[] = [
  {
    id: "c1", code: "WELCOME10", type: "fixed", value: 10,
    minSpend: 30, status: "active", expiresAt: "2026-12-31",
    used: 5, total: 100, createdAt: at(2),
  },
  {
    id: "c2", code: "FANS20", type: "percent", value: 20,
    minSpend: 50, status: "active", expiresAt: "2026-09-30",
    used: 12, total: 50, createdAt: at(4),
  },
];

export const seedTemplates: MessageTemplate[] = [
  {
    id: "t1", name: "价格咨询", trigger: "多少钱",
    content: "您好！具体价格已标在商品页面哦～如需批发优惠，可以聊聊看 :)",
    enabled: true, matchMode: "contains", createdAt: at(0),
  },
  {
    id: "t2", name: "发货时间", trigger: "什么时候发",
    content: "拍下后 5 分钟内自动发货（虚拟商品），您会在订单页面看到发货链接 :)",
    enabled: true, matchMode: "contains", createdAt: at(0),
  },
  {
    id: "t3", name: "退换问题", trigger: "可以退吗",
    content: "虚拟资料默认不退款哦～如果商品质量问题可以联系我解决 :)",
    enabled: true, matchMode: "contains", createdAt: at(0),
  },
];

export const seedRunLogs: RunLog[] = [
  { id: "l1", type: "auto-send", message: "订单 #20260728-001 已自动发货（考研真题合集）", timestamp: new Date(Date.now() - 600_000).toISOString() },
  { id: "l2", type: "auto-reply", message: "买家「小明」咨询价格，已自动回复", timestamp: new Date(Date.now() - 1_200_000).toISOString() },
  { id: "l3", type: "auto-send", message: "订单 #20260728-002 已自动发货（Notion 模板）", timestamp: new Date(Date.now() - 3_600_000).toISOString() },
  { id: "l4", type: "system", message: "店铺「知识仓库小店」状态正常", timestamp: new Date(Date.now() - 7_200_000).toISOString() },
  { id: "l5", type: "warning", message: "商品「机械键盘」库存为 0，已自动下架", timestamp: new Date(Date.now() - 18_000_000).toISOString() },
];
