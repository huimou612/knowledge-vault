"use client";

import { useMemo, useState, useRef } from "react";
import { GlassCard, PageHeader, Button, Input, Select, Tag, StatCard, MiniBarChart, EmptyState, Avatar } from "@/components/ui";
import { toast } from "@/components/toast";
import { FAB, Modal, Confirm, Field } from "@/components/interactive";
import { useCollection } from "@/lib/store";
import { Product, Order, Shop, Coupon, MessageTemplate, RunLog } from "@/lib/types";
import { seedProducts, seedOrders, seedShops, seedCoupons, seedTemplates, seedRunLogs } from "@/lib/seed";
import { todayStr, lastNDays, money, uid } from "@/lib/utils";

const PRODUCT_STATUS: Record<Product["status"], { label: string; color: string }> = {
  "on-sale": { label: "在售", color: "green" },
  sold: { label: "已售", color: "cyan" },
  "off-shelf": { label: "下架", color: "zinc" },
};

type Tab = "overview" | "products" | "orders" | "coupons" | "shops" | "templates" | "replies" | "logs" | "import";

export default function XianyuPage() {
  const { items: products, add: addProduct, update: updateProduct, remove: removeProduct, saveAll: saveAllProducts } = useCollection<Product>("products", seedProducts);
  const { items: orders, add: addOrder, remove: removeOrder, saveAll: saveAllOrders } = useCollection<Order>("orders", seedOrders);
  const { items: shops, add: addShop, update: updateShop, remove: removeShop } = useCollection<Shop>("shops", seedShops);
  const { items: coupons, add: addCoupon, update: updateCoupon, remove: removeCoupon } = useCollection<Coupon>("coupons", seedCoupons);
  const { items: templates, add: addTemplate, update: updateTemplate, remove: removeTemplate } = useCollection<MessageTemplate>("templates", seedTemplates);
  const { items: logs, add: addRunLog } = useCollection<RunLog>("run_logs", seedRunLogs);

  const [tab, setTab] = useState<Tab>("overview");

  // 编辑弹窗 / 删除确认 / 同步状态
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editShop, setEditShop] = useState<Shop | null>(null);
  const [pending, setPending] = useState<{ type: string; id: string; label: string } | null>(null);
  const [syncing, setSyncing] = useState(false);

  const doDelete = () => {
    if (!pending) return;
    if (pending.type === "product") removeProduct(pending.id);
    if (pending.type === "order") removeOrder(pending.id);
    if (pending.type === "coupon") removeCoupon(pending.id);
    if (pending.type === "shop") removeShop(pending.id);
    if (pending.type === "template") removeTemplate(pending.id);
    toast.success("已删除");
    setPending(null);
  };

  /** 一键同步（模拟接口）：模拟从易店助手拉取最新曝光/浏览/想要数据。
   *  真实对接时，把 setTimeout 替换为 fetch("https://ed.weeeg.com/api/...") 即可。 */
  const syncNow = () => {
    if (syncing) return;
    setSyncing(true);
    toast.info("正在同步一点系统数据…");
    setTimeout(() => {
      let touched = 0;
      products.forEach((p) => {
        if (p.status !== "on-sale") return;
        touched++;
        updateProduct(p.id, {
          exposure: (p.exposure ?? 0) + Math.floor(Math.random() * 60 + 10),
          pageViews: (p.pageViews ?? 0) + Math.floor(Math.random() * 15 + 2),
          wants: (p.wants ?? 0) + (Math.random() > 0.6 ? 1 : 0),
        });
      });
      addRunLog({ type: "system", message: `一键同步完成：更新 ${touched} 个在售商品的曝光/浏览/想要数据`, timestamp: new Date().toISOString() });
      setSyncing(false);
      toast.success(`同步完成，已更新 ${touched} 个商品 ✅`);
    }, 1200);
  };

  // 商品表单
  const [pTitle, setPTitle] = useState("");
  const [pCost, setPCost] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pStock, setPStock] = useState("1");

  // 订单表单
  const [oTitle, setOTitle] = useState("");
  const [oPrice, setOPrice] = useState("");
  const [oCost, setOCost] = useState("");
  const [oQty, setOQty] = useState("1");

  // 卡券表单
  const [cCode, setCCode] = useState("");
  const [cType, setCType] = useState<"fixed" | "percent">("fixed");
  const [cValue, setCValue] = useState("");
  const [cMinSpend, setCMinSpend] = useState("");
  const [cExpires, setCExpires] = useState("");
  const [cTotal, setCTotal] = useState("100");

  // 模板表单
  const [tName, setTName] = useState("");
  const [tTrigger, setTTrigger] = useState("");
  const [tContent, setTContent] = useState("");

  // 批量粘贴
  const [bulkText, setBulkText] = useState("");

  // FAB 快捷弹窗（上架商品 / 录入订单）
  const [fabOpen, setFabOpen] = useState(false);
  const [fabType, setFabType] = useState<"product" | "order">("product");

  const fabSubmit = () => {
    if (fabType === "product") {
      if (!pTitle.trim()) { toast.error("请输入商品名称"); return; }
      addProduct({ title: pTitle.trim(), cost: parseFloat(pCost) || 0, price: parseFloat(pPrice) || 0, stock: parseInt(pStock) || 1, status: "on-sale", createdAt: new Date().toISOString() });
      toast.success(`「${pTitle.trim()}」已上架 🛍️`);
      setPTitle(""); setPCost(""); setPPrice(""); setPStock("1");
      setTab("products");
    } else {
      if (!oTitle.trim()) { toast.error("请输入商品名称"); return; }
      addOrder({ title: oTitle.trim(), price: parseFloat(oPrice) || 0, cost: parseFloat(oCost) || 0, quantity: parseInt(oQty) || 1, date: todayStr(), status: "completed", createdAt: new Date().toISOString() });
      toast.success("订单已录入 🧾");
      setOTitle(""); setOPrice(""); setOCost(""); setOQty("1");
      setTab("orders");
    }
    setFabOpen(false);
  };

  const completed = orders.filter((o) => o.status === "completed");
  const totalIncome = completed.reduce((s, o) => s + o.price * o.quantity, 0);
  const totalProfit = completed.reduce((s, o) => s + (o.price - o.cost) * o.quantity, 0);
  const onSale = products.filter((p) => p.status === "on-sale").length;
  const activeShop = shops.find((s) => s.status === "active");

  const week = useMemo(() => lastNDays(7), []);
  const weekProfit = week.map((d) =>
    Math.round(completed.filter((o) => o.date === d).reduce((s, o) => s + (o.price - o.cost) * o.quantity, 0))
  );

  const sellProduct = (p: Product) => {
    addOrder({
      productId: p.id, title: p.title, price: p.price, cost: p.cost,
      quantity: 1, date: todayStr(), status: "completed", createdAt: new Date().toISOString(),
    });
    if (p.stock <= 1) updateProduct(p.id, { status: "sold", stock: 0 });
    else updateProduct(p.id, { stock: p.stock - 1 });
    toast.success(`已售出「${p.title}」，利润 +${money(p.price - p.cost)} 💰`);
  };

  // 解析 CSV
  const parseCSV = (text: string): string[][] => {
    const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim());
    return lines.map((line) => {
      const cells: string[] = [];
      let cur = "";
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuote = !inQuote; continue; }
        if (ch === "," && !inQuote) { cells.push(cur); cur = ""; continue; }
        cur += ch;
      }
      cells.push(cur);
      return cells;
    });
  };

  const csvInputRef = useRef<HTMLInputElement>(null);
  const importProducts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCSV(text);
    const [, ...dataRows] = rows;
    const newProducts: Product[] = dataRows.map((row) => ({
      id: uid(),
      title: row[0] || "",
      cost: parseFloat(row[1]) || 0,
      price: parseFloat(row[2]) || 0,
      stock: parseInt(row[3]) || 1,
      status: (row[4] as Product["status"]) || "on-sale",
      createdAt: new Date().toISOString(),
    }));
    saveAllProducts((prev) => [...newProducts, ...prev]);
    toast.success(`已导入 ${newProducts.length} 个商品 ✅`);
    e.target.value = "";
  };

  const importOrders = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCSV(text);
    const [, ...dataRows] = rows;
    const newOrders: Order[] = dataRows.map((row) => ({
      id: uid(),
      title: row[0] || "",
      price: parseFloat(row[1]) || 0,
      cost: parseFloat(row[2]) || 0,
      quantity: parseInt(row[3]) || 1,
      date: row[4] || todayStr(),
      status: (row[5] as Order["status"]) || "completed",
      createdAt: new Date().toISOString(),
    }));
    saveAllOrders((prev) => [...newOrders, ...prev]);
    toast.success(`已导入 ${newOrders.length} 笔订单 ✅`);
    e.target.value = "";
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "总览", icon: "📊" },
    { key: "products", label: "商品", icon: "🛍️" },
    { key: "orders", label: "订单", icon: "🧾" },
    { key: "coupons", label: "卡券", icon: "🎟️" },
    { key: "shops", label: "店铺", icon: "🏬" },
    { key: "templates", label: "模板", icon: "📋" },
    { key: "replies", label: "智能回复", icon: "🤖" },
    { key: "logs", label: "运行日志", icon: "📜" },
    { key: "import", label: "数据导入", icon: "📥" },
  ];

  return (
    <div className="space-y-6">
      {/* 店铺主页 */}
      <GlassCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Avatar size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{activeShop?.name ?? "未命名店铺"}</h2>
              <Tag color="green">{activeShop?.status === "active" ? "营业中" : "暂停"}</Tag>
            </div>
            <p className="mt-1 text-sm text-blue-200/60">{activeShop?.description ?? "经营中心"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-200/60">
              <span>⭐ 评分：{activeShop?.rating ?? 5.0}</span>
              <span>·</span>
              <span>👥 粉丝：{activeShop?.followerCount ?? 0}</span>
              <span>·</span>
              <span>在售 {onSale} 件</span>
              <span>·</span>
              <span>累计订单 {completed.length}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <PageHeader
        title="闲鱼经营系统"
        desc="店铺总览 · 商品 · 订单 · 卡券 · 模板 · 智能回复 · 日志"
        extra={
          <div className="flex gap-2">
            <Button variant="ghost" className="text-xs" onClick={syncNow} disabled={syncing}>
              {syncing ? "⏳ 同步中…" : "🔄 一键同步"}
            </Button>
            <a href="https://ed.weeeg.com/yudian/h5" target="_blank" rel="noreferrer">
              <Button variant="ghost" className="text-xs">↗ 打开一点系统</Button>
            </a>
          </div>
        }
      />

      {/* 核心指标 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard icon="💰" label="总收入" value={money(totalIncome)} accent="amber" />
        <StatCard icon="📈" label="总利润" value={money(totalProfit)} sub={`利润率 ${totalIncome ? Math.round((totalProfit / totalIncome) * 100) : 0}%`} accent="cyan" />
        <StatCard icon="🛍️" label="在售商品" value={String(onSale)} accent="green" />
        <StatCard icon="🧾" label="订单数" value={String(completed.length)} accent="blue" />
      </div>

      {/* Tab 导航 */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-blue-950/50 p-1 ring-1 ring-blue-400/10">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-sm transition-all ${tab === t.key ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow" : "text-blue-200/60 hover:text-white"}`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ========== 总览 ========== */}
      {tab === "overview" && (
        <div className="space-y-4">
          <GlassCard>
            <h3 className="mb-4 text-sm font-semibold text-white">近 7 日利润趋势（元）</h3>
            <MiniBarChart data={weekProfit} labels={week.map((d) => d.slice(8))} color="bg-blue-500" height={100} />
          </GlassCard>
          <div className="grid gap-4 md:grid-cols-3">
            <GlassCard>
              <h4 className="mb-3 text-sm font-semibold text-white">热销 TOP 3</h4>
              {(() => {
                const top = Object.entries(
                  completed.reduce<Record<string, number>>((m, o) => { m[o.title] = (m[o.title] || 0) + o.quantity; return m; }, {})
                ).sort((a, b) => b[1] - a[1]).slice(0, 3);
                return top.length ? top.map(([title, qty], i) => (
                  <div key={title} className="mb-2 flex items-center gap-2">
                    <span className="text-lg">{["🥇", "🥈", "🥉"][i]}</span>
                    <span className="flex-1 truncate text-sm text-blue-100/90">{title}</span>
                    <span className="text-xs text-blue-200/60">×{qty}</span>
                  </div>
                )) : <EmptyState icon="📦" text="暂无订单" />;
              })()}
            </GlassCard>
            <GlassCard>
              <h4 className="mb-3 text-sm font-semibold text-white">店铺动态</h4>
              <ul className="space-y-2 text-xs text-blue-200/60">
                <li>📈 本周利润：<span className="font-bold text-blue-100">{money(weekProfit.reduce((a, b) => a + b, 0))}</span></li>
                <li>💵 客单价：<span className="font-bold text-blue-100">{money(completed.length ? totalIncome / completed.length : 0)}</span></li>
                <li>🔁 复购率：<span className="font-bold text-blue-100">{completed.length > 1 ? Math.round((new Set(completed.map((o) => o.title)).size / completed.length) * 100) : 0}%</span></li>
                <li>📅 今日新订单：<span className="font-bold text-blue-100">{completed.filter((o) => o.date === todayStr()).length}</span></li>
              </ul>
            </GlassCard>
            <GlassCard>
              <h4 className="mb-3 text-sm font-semibold text-white">最近日志</h4>
              <ul className="space-y-1 text-xs">
                {logs.slice(0, 3).map((l) => (
                  <li key={l.id} className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span className="flex-1 text-blue-200/70 line-clamp-1">{l.message}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ========== 商品管理 ========== */}
      {tab === "products" && (
        <div className="space-y-4">
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-white">上架新商品</h3>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input placeholder="商品名称" value={pTitle} onChange={(e) => setPTitle(e.target.value)} className="flex-1" />
              <Input type="number" placeholder="成本 ¥" value={pCost} onChange={(e) => setPCost(e.target.value)} className="md:w-28" />
              <Input type="number" placeholder="售价 ¥" value={pPrice} onChange={(e) => setPPrice(e.target.value)} className="md:w-28" />
              <Input type="number" placeholder="库存" value={pStock} onChange={(e) => setPStock(e.target.value)} className="md:w-20" />
              <Button
                onClick={() => {
                  if (!pTitle.trim()) { toast.error("请输入商品名称"); return; }
                  addProduct({ title: pTitle.trim(), cost: parseFloat(pCost) || 0, price: parseFloat(pPrice) || 0, stock: parseInt(pStock) || 1, status: "on-sale", createdAt: new Date().toISOString() });
                  toast.success(`「${pTitle.trim()}」已上架 🛍️`);
                  setPTitle(""); setPCost(""); setPPrice(""); setPStock("1");
                }}
              >
                上架
              </Button>
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-white">商品列表（{products.length}）</h3>
            {products.length === 0 ? <EmptyState icon="🛍️" text="还没有商品" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-card">
                  <thead>
                    <tr className="border-b border-blue-400/10 text-left text-xs text-blue-200/50">
                      <th className="pb-2 pr-4 font-medium">商品</th>
                      <th className="hidden md:table-cell pb-2 pr-4 font-medium">售价</th>
                      <th className="hidden md:table-cell pb-2 pr-4 font-medium">利润</th>
                      <th className="hidden md:table-cell pb-2 pr-4 font-medium">库存</th>
                      <th className="hidden md:table-cell pb-2 pr-4 font-medium">曝光</th>
                      <th className="hidden md:table-cell pb-2 pr-4 font-medium">浏览</th>
                      <th className="hidden md:table-cell pb-2 pr-4 font-medium">想要</th>
                      <th className="hidden md:table-cell pb-2 pr-4 font-medium">自动发货</th>
                      <th className="hidden md:table-cell pb-2 font-medium">状态</th>
                      <th className="pb-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="group border-b border-blue-400/5 last:border-0">
                        <td className="py-2.5 pr-4 text-blue-50" data-label="商品">
                          <div className="max-w-[200px] md:max-w-xs">
                            <p className="line-clamp-2 leading-snug">{p.title}</p>
                            {p.sourceId && <p className="mt-0.5 text-[10px] text-blue-200/40">ID: {p.sourceId}</p>}
                            <div className="mt-1 flex items-center gap-2 md:hidden">
                              <span className="text-xs text-blue-200/80">{money(p.price)}</span>
                              <span className="text-xs text-emerald-400">+{money(p.price - p.cost)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell py-2.5 pr-4 text-blue-50" data-label="售价">{money(p.price)}</td>
                        <td className="hidden md:table-cell py-2.5 pr-4 text-emerald-400" data-label="利润">{money(p.price - p.cost)}</td>
                        <td className="hidden md:table-cell py-2.5 pr-4 text-blue-200/60" data-label="库存">{p.stock}</td>
                        <td className="hidden md:table-cell py-2.5 pr-4 text-blue-200/60" data-label="曝光">{p.exposure ?? "—"}</td>
                        <td className="hidden md:table-cell py-2.5 pr-4 text-blue-200/60" data-label="浏览">{p.pageViews ?? "—"}</td>
                        <td className="hidden md:table-cell py-2.5 pr-4 text-blue-200/60" data-label="想要">{p.wants ?? "—"}</td>
                        <td className="hidden md:table-cell py-2.5 pr-4" data-label="自动发货">
                          <button
                            onClick={() => { updateProduct(p.id, { autoDeliver: !p.autoDeliver }); toast.success(!p.autoDeliver ? "已开启自动发货" : "已关闭自动发货"); }}
                            className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-all ${p.autoDeliver ? "bg-cyan-500" : "bg-blue-950/60"}`}
                          >
                            <span className={`h-4 w-4 rounded-full bg-white transition-transform ${p.autoDeliver ? "translate-x-4" : ""}`} />
                          </button>
                        </td>
                        <td className="hidden md:table-cell py-2.5 pr-4" data-label="状态"><Tag color={PRODUCT_STATUS[p.status].color}>{PRODUCT_STATUS[p.status].label}</Tag></td>
                        <td className="py-2.5" data-label="操作">
                          <div className="flex items-center gap-2">
                            {p.status === "on-sale" && <button onClick={() => sellProduct(p)} className="touch-btn rounded-lg bg-cyan-600/20 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-600/30">售出</button>}
                            <button onClick={() => setEditProduct(p)} className="touch-btn rounded-lg bg-blue-500/15 px-2.5 py-1.5 text-xs text-blue-200 hover:text-white">编辑</button>
                            {p.status === "on-sale" && <button onClick={() => { updateProduct(p.id, { status: "off-shelf" }); toast.info("商品已下架"); }} className="touch-btn rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-xs text-blue-200/70 hover:text-blue-100">下架</button>}
                            {p.status === "off-shelf" && <button onClick={() => { updateProduct(p.id, { status: "on-sale" }); toast.success("商品已重新上架"); }} className="touch-btn rounded-lg bg-emerald-600/20 px-2.5 py-1.5 text-xs text-emerald-300">上架</button>}
                            <button onClick={() => setPending({ type: "product", id: p.id, label: p.title })} className="touch-btn rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300/70 hover:text-red-300">删除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* ========== 订单管理 ========== */}
      {tab === "orders" && (
        <div className="space-y-4">
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-white">手动录入订单</h3>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input placeholder="商品名称" value={oTitle} onChange={(e) => setOTitle(e.target.value)} className="flex-1" />
              <Input type="number" placeholder="成交价 ¥" value={oPrice} onChange={(e) => setOPrice(e.target.value)} className="md:w-28" />
              <Input type="number" placeholder="成本 ¥" value={oCost} onChange={(e) => setOCost(e.target.value)} className="md:w-28" />
              <Input type="number" placeholder="数量" value={oQty} onChange={(e) => setOQty(e.target.value)} className="md:w-20" />
              <Button
                onClick={() => {
                  if (!oTitle.trim()) { toast.error("请输入商品名称"); return; }
                  addOrder({ title: oTitle.trim(), price: parseFloat(oPrice) || 0, cost: parseFloat(oCost) || 0, quantity: parseInt(oQty) || 1, date: todayStr(), status: "completed", createdAt: new Date().toISOString() });
                  toast.success("订单已录入 🧾");
                  setOTitle(""); setOPrice(""); setOCost(""); setOQty("1");
                }}
              >
                录入
              </Button>
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-white">订单记录（{orders.length}）</h3>
            {orders.length === 0 ? <EmptyState icon="🧾" text="还没有订单" /> : (
              <div className="overflow-x-auto md:overflow-visible">
                <table className="w-full text-sm table-card">
                  <thead>
                    <tr className="border-b border-blue-400/10 text-left text-xs text-blue-200/50">
                      <th className="pb-2 pr-4 font-medium">日期</th>
                      <th className="pb-2 pr-4 font-medium">商品</th>
                      <th className="hidden md:table-cell pb-2 pr-4 font-medium">成交价</th>
                      <th className="hidden md:table-cell pb-2 pr-4 font-medium">数量</th>
                      <th className="pb-2 pr-4 font-medium">利润</th>
                      <th className="pb-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...orders].sort((a, b) => b.date.localeCompare(a.date)).map((o) => (
                      <tr key={o.id} className="border-b border-blue-400/5 last:border-0">
                        <td className="py-2.5 pr-4 text-blue-200/50 text-xs" data-label="日期">{o.date}</td>
                        <td className="py-2.5 pr-4 text-blue-50" data-label="商品">
                          <span className="line-clamp-1">{o.title}</span>
                          <span className="md:hidden text-[11px] text-blue-200/50">{money(o.price)} ×{o.quantity}</span>
                        </td>
                        <td className="hidden md:table-cell py-2.5 pr-4 text-blue-50" data-label="成交价">{money(o.price)}</td>
                        <td className="hidden md:table-cell py-2.5 pr-4 text-blue-200/60" data-label="数量">×{o.quantity}</td>
                        <td className="py-2.5 pr-4 text-emerald-400" data-label="利润">+{money((o.price - o.cost) * o.quantity)}</td>
                        <td className="py-2.5" data-label="操作">
                          <button onClick={() => setPending({ type: "order", id: o.id, label: o.title })} className="touch-btn rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300/70 hover:text-red-300">删除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* ========== 卡券管理 ========== */}
      {tab === "coupons" && (
        <div className="space-y-4">
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-white">创建卡券</h3>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input placeholder="优惠码，如 WELCOME10" value={cCode} onChange={(e) => setCCode(e.target.value)} className="md:w-44" />
              <Select value={cType} onChange={(e) => setCType(e.target.value as "fixed" | "percent")}>
                <option value="fixed">固定金额</option>
                <option value="percent">百分比折扣</option>
              </Select>
              <Input type="number" placeholder={cType === "fixed" ? "减免 ¥" : "折扣 %"} value={cValue} onChange={(e) => setCValue(e.target.value)} className="md:w-28" />
              <Input type="number" placeholder="满减门槛 ¥" value={cMinSpend} onChange={(e) => setCMinSpend(e.target.value)} className="md:w-28" />
              <Input type="date" placeholder="过期时间" value={cExpires} onChange={(e) => setCExpires(e.target.value)} className="md:w-40" />
              <Input type="number" placeholder="发行总量" value={cTotal} onChange={(e) => setCTotal(e.target.value)} className="md:w-24" />
              <Button
                onClick={() => {
                  if (!cCode.trim()) { toast.error("请输入优惠码"); return; }
                  addCoupon({ code: cCode.trim(), type: cType, value: parseFloat(cValue) || 0, minSpend: parseFloat(cMinSpend) || 0, status: "active", expiresAt: cExpires || "2026-12-31", used: 0, total: parseInt(cTotal) || 100, createdAt: new Date().toISOString() });
                  toast.success(`卡券「${cCode.trim()}」已创建 🎟️`);
                  setCCode(""); setCValue(""); setCMinSpend(""); setCExpires("");
                }}
              >
                创建
              </Button>
            </div>
          </GlassCard>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {coupons.map((c) => (
              <GlassCard key={c.id} hover className="relative overflow-hidden">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-blue-500/20 blur-2xl" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-blue-200/60 uppercase">优惠码</p>
                    <p className="mt-1 text-lg font-bold text-white">{c.code}</p>
                  </div>
                  <Tag color={c.status === "active" ? "green" : c.status === "expired" ? "red" : "zinc"}>
                    {c.status === "active" ? "进行中" : c.status === "expired" ? "已过期" : "已用完"}
                  </Tag>
                </div>
                <p className="mt-3 text-2xl font-bold text-cyan-300">
                  {c.type === "fixed" ? `减 ¥${c.value}` : `${c.value} 折`}
                </p>
                <p className="mt-1 text-xs text-blue-200/50">满 ¥{c.minSpend} 可用 · 过期 {c.expiresAt}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-950/60">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${Math.min(100, (c.used / c.total) * 100)}%` }} />
                </div>
                <p className="mt-1 text-xs text-blue-200/40">已领取 {c.used}/{c.total}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setPending({ type: "coupon", id: c.id, label: c.code })} className="touch-btn text-xs text-blue-200/40 hover:text-red-400">删除</button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* ========== 店铺管理 ========== */}
      {tab === "shops" && (
        <div className="space-y-4">
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-white">添加店铺</h3>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input placeholder="店铺名称" id="shop-name" className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const name = (e.target as HTMLInputElement).value.trim();
                    if (name) { addShop({ name, platform: "xianyu", status: "active", rating: 5.0, followerCount: 0, createdAt: new Date().toISOString() }); toast.success(`店铺「${name}」已添加`); (e.target as HTMLInputElement).value = ""; }
                  }
                }}
              />
              <Button
                onClick={() => {
                  const input = document.getElementById("shop-name") as HTMLInputElement;
                  const name = input.value.trim();
                  if (name) { addShop({ name, platform: "xianyu", status: "active", rating: 5.0, followerCount: 0, createdAt: new Date().toISOString() }); toast.success(`店铺「${name}」已添加`); input.value = ""; }
                  else toast.error("请输入店铺名称");
                }}
              >
                添加店铺
              </Button>
            </div>
          </GlassCard>
          <div className="grid gap-3 md:grid-cols-2">
            {shops.map((s) => (
              <GlassCard key={s.id} hover>
                <div className="flex items-center gap-3">
                  <Avatar size="md" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{s.name}</p>
                      <Tag color={s.status === "active" ? "green" : "zinc"}>{s.status === "active" ? "营业" : "暂停"}</Tag>
                    </div>
                    <p className="mt-1 text-xs text-blue-200/60">{s.description ?? "—"}</p>
                    <div className="mt-2 flex gap-3 text-xs text-blue-200/40">
                      <span>⭐ {s.rating}</span>
                      <span>👥 {s.followerCount}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-3">
                  <button onClick={() => { updateShop(s.id, { status: s.status === "active" ? "paused" : "active" }); toast.success(s.status === "active" ? "店铺已暂停" : "店铺已启用"); }} className="touch-btn text-xs text-blue-200/60 hover:text-blue-100">
                    {s.status === "active" ? "暂停" : "启用"}
                  </button>
                  <button onClick={() => setEditShop(s)} className="touch-btn text-xs text-cyan-400/80 hover:text-cyan-300">编辑资料</button>
                  <button onClick={() => setPending({ type: "shop", id: s.id, label: s.name })} className="touch-btn text-xs text-blue-200/40 hover:text-red-400">删除</button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* ========== 模板管理 ========== */}
      {tab === "templates" && (
        <GlassCard>
          <h3 className="mb-3 text-sm font-semibold text-white">消息模板</h3>
          <p className="mb-3 text-xs text-blue-200/60">不同模板用于智能回复（买家咨询关键词时自动发送）。</p>
          <div className="space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="rounded-xl border border-blue-400/10 bg-blue-500/[0.06] p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{t.name}</p>
                      {t.enabled ? <Tag color="green">已启用</Tag> : <Tag color="zinc">未启用</Tag>}
                    </div>
                    <p className="mt-1 text-xs text-blue-300/70">触发：<code className="rounded bg-blue-950/60 px-1.5 py-0.5">{t.trigger}</code> <span className="ml-1 text-blue-200/40">({t.matchMode})</span></p>
                    <p className="mt-2 text-sm text-blue-100/80">{t.content}</p>
                  </div>
                  <button onClick={() => { updateTemplate(t.id, { enabled: !t.enabled }); toast.success(t.enabled ? "模板已停用" : "模板已启用"); }} className="touch-btn text-xs text-cyan-400 hover:text-cyan-300">{t.enabled ? "停用" : "启用"}</button>
                  <button onClick={() => setPending({ type: "template", id: t.id, label: t.name })} className="touch-btn ml-3 text-xs text-blue-200/40 hover:text-red-400">✕</button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ========== 智能回复（设置） ========== */}
      {tab === "replies" && (
        <div className="space-y-4">
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-white">添加智能回复</h3>
            <div className="space-y-2">
              <div className="flex flex-col gap-2 md:flex-row">
                <Input placeholder="模板名称" value={tName} onChange={(e) => setTName(e.target.value)} className="md:w-44" />
                <Input placeholder="触发关键词（如：多少钱）" value={tTrigger} onChange={(e) => setTTrigger(e.target.value)} className="flex-1" />
              </div>
              <TextareaCustom placeholder="自动回复内容" value={tContent} onChange={(e) => setTContent(e.target.value)} />
              <Button
                onClick={() => {
                  if (!tName.trim() || !tTrigger.trim() || !tContent.trim()) { toast.error("请填写完整模板信息"); return; }
                  addTemplate({ name: tName.trim(), trigger: tTrigger.trim(), content: tContent.trim(), enabled: true, matchMode: "contains", createdAt: new Date().toISOString() });
                  toast.success("智能回复模板已添加 🤖");
                  setTName(""); setTTrigger(""); setTContent("");
                }}
              >
                添加模板
              </Button>
            </div>
          </GlassCard>
          <GlassCard>
            <p className="text-xs text-blue-200/60">
              💡 智能回复匹配规则：当买家消息包含触发关键词时，自动发送对应回复内容。
              <br />切换到「模板」标签查看所有模板。
            </p>
          </GlassCard>
        </div>
      )}

      {/* ========== 运行日志 ========== */}
      {tab === "logs" && (
        <GlassCard>
          <h3 className="mb-3 text-sm font-semibold text-white">运行日志（{logs.length}）</h3>
          {logs.length === 0 ? <EmptyState icon="📜" text="暂无日志" /> : (
            <ul className="space-y-2">
              {[...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((l) => {
                const colors = { "auto-send": "cyan", "auto-reply": "blue", "system": "green", "warning": "amber" } as const;
                return (
                  <li key={l.id} className="flex items-start gap-3 rounded-xl border border-blue-400/10 bg-blue-500/[0.05] p-3">
                    <Tag color={colors[l.type]}>{l.type}</Tag>
                    <div className="flex-1">
                      <p className="text-sm text-blue-100/90">{l.message}</p>
                      <p className="mt-1 text-xs text-blue-200/40">{new Date(l.timestamp).toLocaleString("zh-CN")}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      )}

      {/* ========== 数据导入 ========== */}
      {tab === "import" && (
        <div className="space-y-4">
          <GlassCard>
            <h3 className="mb-2 text-sm font-semibold text-white">⚡ 批量粘贴导入（推荐）</h3>
            <p className="mb-3 text-xs text-blue-200/60">
              在易店助手「商品管理」页面选中多行数据（Ctrl+C），粘贴到下方输入框，自动解析入库。
              <br />支持两种格式：<strong className="text-cyan-300">Tab/制表符分隔</strong>（直接复制表格）或 <strong className="text-cyan-300">CSV 格式</strong>。
            </p>
            <TextareaCustom
              rows={8}
              placeholder={`粘贴商品数据，每行一个商品。例：\n童老师牛津树精讲视频课合集	1.66	6811	831	79\nDK中文百科科普音频合集	1	0	1	0`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="font-mono text-xs"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-blue-200/60">
              <span>字段顺序（可只填前 4 个）：</span>
              <code className="rounded bg-blue-950/60 px-2 py-0.5 text-cyan-300">标题 | 售价 | 浏览 | 想要 | 曝光</code>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => {
                  if (!bulkText.trim()) { toast.error("请先粘贴数据"); return; }
                  const lines = bulkText.trim().split(/\r?\n/);
                  const newProducts: Product[] = lines.map((line) => {
                    const cells = line.split(/\t|,|，|\s{2,}/).map((c) => c.trim()).filter(Boolean);
                    return {
                      id: uid(),
                      title: cells[0] || "未命名商品",
                      cost: 0,
                      price: parseFloat(cells[1]) || 0,
                      stock: 999,
                      status: "on-sale",
                      pageViews: parseInt(cells[2]) || 0,
                      wants: parseInt(cells[3]) || 0,
                      exposure: parseInt(cells[4]) || 0,
                      autoDeliver: true,
                      createdAt: new Date().toISOString(),
                    };
                  });
                  saveAllProducts((prev) => [...newProducts, ...prev]);
                  toast.success(`已批量导入 ${newProducts.length} 个商品`);
                  setBulkText("");
                  setTab("products");
                }}
              >
                一键导入商品
              </Button>
              <Button variant="ghost" onClick={() => setBulkText("")}>清空</Button>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-2 text-sm font-semibold text-white">📥 CSV 文件导入</h3>
            <p className="mb-3 text-xs text-blue-200/60">
              从其他工具导出的 CSV 文件直接上传。
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-blue-400/15 bg-blue-950/30 p-4">
                <h4 className="text-sm font-semibold text-white">导入商品</h4>
                <p className="mt-1 text-xs text-blue-200/50">字段顺序：标题, 成本, 售价, 库存, 状态</p>
                <input ref={csvInputRef} type="file" accept=".csv" onChange={importProducts} className="mt-3 block w-full text-xs text-blue-200/60 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-500" />
              </div>
              <div className="rounded-xl border border-blue-400/15 bg-blue-950/30 p-4">
                <h4 className="text-sm font-semibold text-white">导入订单</h4>
                <p className="mt-1 text-xs text-blue-200/50">字段顺序：标题, 成交价, 成本, 数量, 日期, 状态</p>
                <input type="file" accept=".csv" onChange={importOrders} className="mt-3 block w-full text-xs text-blue-200/60 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:text-white hover:file:bg-cyan-500" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-2 text-sm font-semibold text-white">📋 CSV 模板下载</h3>
            <p className="mb-3 text-xs text-blue-200/60">复制以下内容到 .csv 文件：</p>
            <div className="space-y-2">
              <details className="rounded-xl border border-blue-400/10 bg-blue-950/30 p-3">
                <summary className="cursor-pointer text-sm text-blue-100">商品 CSV 模板</summary>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-blue-200">标题,成本,售价,库存,状态
考研真题电子版合集,5,19.9,999,on-sale
Notion 模板 · 个人知识库,0,29.9,999,on-sale
二手机械键盘 87 键,120,199,1,on-sale</pre>
              </details>
              <details className="rounded-xl border border-blue-400/10 bg-blue-950/30 p-3">
                <summary className="cursor-pointer text-sm text-blue-100">订单 CSV 模板</summary>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-blue-200">标题,成交价,成本,数量,日期,状态
考研真题电子版合集,19.9,5,1,2026-07-28,completed
Notion 模板 · 个人知识库,29.9,0,2,2026-07-28,completed</pre>
              </details>
            </div>
          </GlassCard>
        </div>
      )}

      {/* FAB：上架商品 / 录入订单 */}
      <FAB
        onClick={() => { setFabType(tab === "orders" ? "order" : "product"); setFabOpen(true); }}
        label={tab === "orders" ? "录入订单" : "上架商品"}
      />

      {/* FAB 快捷表单弹窗 */}
      <Modal
        open={fabOpen}
        onClose={() => setFabOpen(false)}
        title={fabType === "product" ? "🛍️ 上架新商品" : "🧾 录入订单"}
        footer={<><Button variant="ghost" onClick={() => setFabOpen(false)}>取消</Button><Button onClick={fabSubmit}>{fabType === "product" ? "上架" : "录入"}</Button></>}
      >
        <div className="mb-1 flex gap-1 rounded-xl bg-blue-950/40 p-1">
          {([["product", "🛍️ 商品"], ["order", "🧾 订单"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setFabType(v)} className={`flex-1 rounded-lg px-3 py-1.5 text-sm transition-all ${fabType === v ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" : "text-blue-200/60"}`}>{l}</button>
          ))}
        </div>
        {fabType === "product" ? (
          <>
            <Field label="商品名称"><Input placeholder="如：考研真题电子版合集" value={pTitle} onChange={(e) => setPTitle(e.target.value)} autoFocus /></Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="成本 ¥"><Input type="number" value={pCost} onChange={(e) => setPCost(e.target.value)} /></Field>
              <Field label="售价 ¥"><Input type="number" value={pPrice} onChange={(e) => setPPrice(e.target.value)} /></Field>
              <Field label="库存"><Input type="number" value={pStock} onChange={(e) => setPStock(e.target.value)} /></Field>
            </div>
          </>
        ) : (
          <>
            <Field label="商品名称"><Input placeholder="成交的商品" value={oTitle} onChange={(e) => setOTitle(e.target.value)} autoFocus /></Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="成交价 ¥"><Input type="number" value={oPrice} onChange={(e) => setOPrice(e.target.value)} /></Field>
              <Field label="成本 ¥"><Input type="number" value={oCost} onChange={(e) => setOCost(e.target.value)} /></Field>
              <Field label="数量"><Input type="number" value={oQty} onChange={(e) => setOQty(e.target.value)} /></Field>
            </div>
          </>
        )}
      </Modal>

      {/* 商品编辑弹窗 */}
      {editProduct && (
        <EditProductModal
          key={editProduct.id}
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSave={(patch) => { updateProduct(editProduct.id, patch); toast.success("商品信息已更新"); setEditProduct(null); }}
        />
      )}

      {/* 店铺编辑弹窗 */}
      {editShop && (
        <EditShopModal
          key={editShop.id}
          shop={editShop}
          onClose={() => setEditShop(null)}
          onSave={(patch) => { updateShop(editShop.id, patch); toast.success("店铺资料已更新"); setEditShop(null); }}
        />
      )}

      {/* 删除确认 */}
      <Confirm
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={doDelete}
        title="确认删除"
        message={`确定删除「${pending?.label}」吗？此操作不可恢复。`}
      />
    </div>
  );
}

/* ---------- 商品编辑弹窗 ---------- */
function EditProductModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (p: Partial<Product>) => void }) {
  const [title, setTitle] = useState(product.title);
  const [cost, setCost] = useState(String(product.cost));
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [exposure, setExposure] = useState(String(product.exposure ?? 0));
  const [pageViews, setPageViews] = useState(String(product.pageViews ?? 0));
  const [wants, setWants] = useState(String(product.wants ?? 0));
  return (
    <Modal open onClose={onClose} title="✏️ 编辑商品"
      footer={<><Button variant="ghost" onClick={onClose}>取消</Button><Button onClick={() => {
        if (!title.trim()) { toast.error("商品名称不能为空"); return; }
        onSave({
          title: title.trim(),
          cost: parseFloat(cost) || 0,
          price: parseFloat(price) || 0,
          stock: parseInt(stock) || 0,
          exposure: parseInt(exposure) || 0,
          pageViews: parseInt(pageViews) || 0,
          wants: parseInt(wants) || 0,
        });
      }}>保存修改</Button></>}>
      <Field label="商品名称"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="成本 ¥"><Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
        <Field label="售价 ¥"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="库存"><Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field label="曝光量"><Input type="number" value={exposure} onChange={(e) => setExposure(e.target.value)} /></Field>
        <Field label="浏览量"><Input type="number" value={pageViews} onChange={(e) => setPageViews(e.target.value)} /></Field>
        <Field label="想要数"><Input type="number" value={wants} onChange={(e) => setWants(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

/* ---------- 店铺编辑弹窗 ---------- */
function EditShopModal({ shop, onClose, onSave }: { shop: Shop; onClose: () => void; onSave: (p: Partial<Shop>) => void }) {
  const [name, setName] = useState(shop.name);
  const [description, setDescription] = useState(shop.description ?? "");
  const [rating, setRating] = useState(String(shop.rating));
  const [followerCount, setFollowerCount] = useState(String(shop.followerCount));
  return (
    <Modal open onClose={onClose} title="✏️ 编辑店铺资料"
      footer={<><Button variant="ghost" onClick={onClose}>取消</Button><Button onClick={() => {
        if (!name.trim()) { toast.error("店铺名称不能为空"); return; }
        onSave({
          name: name.trim(),
          description,
          rating: Math.min(5, Math.max(0, parseFloat(rating) || 5)),
          followerCount: parseInt(followerCount) || 0,
        });
      }}>保存修改</Button></>}>
      <Field label="店铺名称"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="店铺简介"><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="一句话介绍你的店" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="评分（0-5）"><Input type="number" step="0.1" min="0" max="5" value={rating} onChange={(e) => setRating(e.target.value)} /></Field>
        <Field label="粉丝数"><Input type="number" value={followerCount} onChange={(e) => setFollowerCount(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function TextareaCustom(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className={`w-full rounded-xl border border-blue-400/15 bg-blue-950/40 px-3 py-2 text-sm text-white placeholder-blue-200/40 transition-all ${props.className ?? ""}`}
    />
  );
}