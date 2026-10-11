"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard, StatCard, MiniBarChart, ProgressBar, Tag, EmptyState, Avatar, Button, Input, Select } from "@/components/ui";
import { toast } from "@/components/toast";
import { FAB, Modal, Field } from "@/components/interactive";
import { useCollection } from "@/lib/store";
import { Task, Checkin, StudyLog, Order, KnowledgeNote } from "@/lib/types";
import { seedTasks, seedCheckins, seedStudyLogs, seedOrders, seedNotes } from "@/lib/seed";
import { todayStr, lastNDays, calcStreak, minutesToText, money, formatDateCN, weekdayCN } from "@/lib/utils";

const QUICK_CATEGORIES = ["学习", "自媒体", "闲鱼", "生活", "其他"];

export default function Dashboard() {
  const router = useRouter();
  const { items: tasks, add: addTask, update: updateTask } = useCollection<Task>("tasks", seedTasks);
  const { items: checkins, add: addCheckin } = useCollection<Checkin>("checkins", seedCheckins);
  const { items: logs, add: addLog } = useCollection<StudyLog>("study_logs", seedStudyLogs);
  const { items: orders } = useCollection<Order>("orders", seedOrders);
  const { items: notes } = useCollection<KnowledgeNote>("notes", seedNotes);

  const today = todayStr();
  const week = useMemo(() => lastNDays(7), []);
  const weekSet = useMemo(() => new Set(week), [week]);

  const todayTasks = tasks.filter((t) => t.date === today);
  const doneToday = todayTasks.filter((t) => t.done).length;
  const rate = todayTasks.length ? Math.round((doneToday / todayTasks.length) * 100) : 0;

  const todayMinutes = logs.filter((l) => l.date === today).reduce((s, l) => s + l.minutes, 0);
  const weekMinutes = logs.filter((l) => weekSet.has(l.date)).reduce((s, l) => s + l.minutes, 0);

  const month = today.slice(0, 7);
  const monthOrders = orders.filter((o) => o.date.startsWith(month) && o.status === "completed");
  const monthIncome = monthOrders.reduce((s, o) => s + o.price * o.quantity, 0);
  const monthProfit = monthOrders.reduce((s, o) => s + (o.price - o.cost) * o.quantity, 0);

  const streak = calcStreak(checkins.map((c) => c.date));
  const checkedToday = checkins.some((c) => c.date === today);

  // 快捷添加弹窗
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickType, setQuickType] = useState<"task" | "study">("task");
  const [qTitle, setQTitle] = useState("");
  const [qCategory, setQCategory] = useState("学习");
  const [qMinutes, setQMinutes] = useState("30");

  const submitQuick = () => {
    if (quickType === "task") {
      if (!qTitle.trim()) { toast.error("请输入任务内容"); return; }
      addTask({ title: qTitle.trim(), category: qCategory, priority: "medium", date: today, done: false, createdAt: new Date().toISOString() });
      toast.success("任务已添加到今日");
    } else {
      const m = parseInt(qMinutes);
      if (!m || m <= 0) { toast.error("请输入有效时长"); return; }
      addLog({ date: today, subject: qCategory === "学习" ? "英语" : qCategory, minutes: m, note: qTitle, createdAt: new Date().toISOString() });
      toast.success(`已记录学习 ${m} 分钟`);
    }
    setQTitle("");
    setQuickOpen(false);
  };

  const doCheckin = () => {
    if (checkedToday) { toast.info("今天已经打过卡了"); return; }
    addCheckin({ date: today, createdAt: new Date().toISOString() });
    toast.success(`打卡成功！已连续 ${streak + 1} 天 🔥`);
  };

  const weekStudyData = week.map((d) => logs.filter((l) => l.date === d).reduce((s, l) => s + l.minutes, 0));
  const weekIncomeData = week.map((d) =>
    orders.filter((o) => o.date === d && o.status === "completed").reduce((s, o) => s + (o.price - o.cost) * o.quantity, 0)
  );
  const weekLabels = week.map((d) => d.slice(8));

  return (
    <div className="space-y-6">
      {/* 头部问候（带头像） */}
      <div className="fade-up flex items-center gap-4">
        <Avatar size="lg" />
        <div className="flex-1">
          <p className="text-xs text-blue-300/70">
            {formatDateCN(today)} · {weekdayCN(today)}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white md:text-4xl">
            欢迎回来，<span className="text-gradient">保持进化</span>
          </h1>
          <p className="mt-2 text-sm text-blue-200/60">你的第二大脑正在运转，今天也是积累复利的一天。</p>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard icon="✅" label="今日完成率" value={`${rate}%`} sub={`${doneToday}/${todayTasks.length} 个任务`} accent="blue" href="/tasks" />
        <StatCard icon="⏱" label="今日学习" value={minutesToText(todayMinutes)} sub={`本周共 ${minutesToText(weekMinutes)}`} accent="cyan" href="/learning" />
        <StatCard icon="💰" label="本月利润" value={money(monthProfit)} sub={`收入 ${money(monthIncome)}`} accent="amber" href="/xianyu" />
        <StatCard icon="🔥" label="连续打卡" value={`${streak} 天`} sub={checkedToday ? "今日已打卡" : "点击去打卡"} accent="green" onClick={doCheckin} />
      </div>

      {/* 快捷操作入口 */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { setQuickType("task"); setQuickOpen(true); }} className="flex-1 md:flex-none">＋ 添加任务</Button>
        <Button variant="ghost" onClick={() => { setQuickType("study"); setQuickOpen(true); }} className="flex-1 md:flex-none">⏱ 记录学习</Button>
        <Button variant="ghost" onClick={() => router.push("/knowledge")} className="flex-1 md:flex-none">🧠 写笔记</Button>
      </div>

      {/* 图表区 */}
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">近 7 日学习时长（分钟）</h3>
            <Link href="/learning" className="text-xs text-cyan-400 hover:text-cyan-300">详情 →</Link>
          </div>
          <MiniBarChart data={weekStudyData} labels={weekLabels} color="bg-cyan-500" height={110} />
        </GlassCard>
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">近 7 日闲鱼利润（元）</h3>
            <Link href="/xianyu" className="text-xs text-cyan-400 hover:text-cyan-300">详情 →</Link>
          </div>
          <MiniBarChart data={weekIncomeData.map((v) => Math.round(v))} labels={weekLabels} color="bg-blue-500" height={110} />
        </GlassCard>
      </div>

      {/* 今日任务 + 最新笔记 */}
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">今日任务</h3>
            <Link href="/tasks" className="text-xs text-cyan-400 hover:text-cyan-300">管理 →</Link>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <ProgressBar value={rate} className="flex-1" />
            <span className="text-xs text-blue-200/60">{rate}%</span>
          </div>
          {todayTasks.length === 0 ? (
            <EmptyState icon="📝" text="今天还没有任务，去添加一个吧" />
          ) : (
            <ul className="space-y-2">
              {todayTasks.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-blue-500/10">
                  <button
                    onClick={() => {
                      updateTask(t.id, { done: !t.done, doneAt: !t.done ? today : undefined });
                      toast.success(!t.done ? "任务已完成 ✓" : "已恢复为待办");
                    }}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition-all ${
                      t.done ? "border-cyan-400 bg-cyan-400 text-blue-950" : "border-blue-300/40 hover:border-cyan-300"
                    }`}
                  >
                    {t.done && "✓"}
                  </button>
                  <span className={`flex-1 text-sm ${t.done ? "text-blue-200/40 line-through" : "text-blue-50"}`}>{t.title}</span>
                  <Tag color={t.priority === "high" ? "red" : t.priority === "medium" ? "amber" : "zinc"}>{t.category}</Tag>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">最新知识笔记</h3>
            <Link href="/knowledge" className="text-xs text-cyan-400 hover:text-cyan-300">进入知识库 →</Link>
          </div>
          {notes.length === 0 ? (
            <EmptyState icon="🧠" text="知识库还是空的" />
          ) : (
            <ul className="space-y-2">
              {notes.slice(0, 4).map((n) => (
                <li key={n.id} onClick={() => router.push("/knowledge")} className="cursor-pointer rounded-xl border border-blue-400/10 bg-blue-500/[0.06] p-3 transition-all hover:bg-blue-500/[0.12] active:scale-[0.98]">
                  <p className="text-sm font-medium text-blue-50">{n.title}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Tag color="cyan">{n.category}</Tag>
                    {n.tags.slice(0, 2).map((t) => <Tag key={t} color="zinc">#{t}</Tag>)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      {/* FAB：快速添加任务 */}
      <FAB onClick={() => { setQuickType("task"); setQuickOpen(true); }} label="添加任务" />

      {/* 快捷添加弹窗 */}
      <Modal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        title={quickType === "task" ? "＋ 快速添加今日任务" : "⏱ 记录今日学习"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setQuickOpen(false)}>取消</Button>
            <Button onClick={submitQuick}>{quickType === "task" ? "添加任务" : "保存记录"}</Button>
          </>
        }
      >
        <div className="mb-1 flex gap-1 rounded-xl bg-blue-950/40 p-1">
          {([["task", "📋 任务"], ["study", "⏱ 学习记录"]] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setQuickType(v)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm transition-all ${quickType === v ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" : "text-blue-200/60"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <Field label={quickType === "task" ? "任务内容" : "学习内容（可选）"}>
          <Input
            placeholder={quickType === "task" ? "例如：背 30 个单词" : "例如：Next.js 教程"}
            value={qTitle}
            onChange={(e) => setQTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitQuick()}
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="分类">
            <Select value={qCategory} onChange={(e) => setQCategory(e.target.value)} className="w-full">
              {QUICK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          {quickType === "study" && (
            <Field label="时长（分钟）">
              <Input type="number" min="1" value={qMinutes} onChange={(e) => setQMinutes(e.target.value)} />
            </Field>
          )}
        </div>
      </Modal>
    </div>
  );
}