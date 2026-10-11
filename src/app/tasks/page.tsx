"use client";

import { useMemo, useRef, useState } from "react";
import { GlassCard, PageHeader, Button, Input, Select, Tag, StatCard, EmptyState } from "@/components/ui";
import { toast } from "@/components/toast";
import { FAB, Modal, ActionSheet, Confirm, Field, useLongPress, SheetAction } from "@/components/interactive";
import { useCollection } from "@/lib/store";
import { Task, Checkin } from "@/lib/types";
import { seedTasks, seedCheckins } from "@/lib/seed";
import { todayStr, calcStreak } from "@/lib/utils";

const CATEGORIES = ["学习", "自媒体", "闲鱼", "生活", "其他"];
const PRIORITIES = [
  { value: "high", label: "高", color: "red" },
  { value: "medium", label: "中", color: "amber" },
  { value: "low", label: "低", color: "zinc" },
] as const;

type View = "timeline" | "list" | "calendar";
type Filter = "all" | "todo" | "done" | "overdue";

const emptyForm = { title: "", category: "学习", priority: "medium" as Task["priority"], date: "", time: "09:00" };

export default function TasksPage() {
  const { items: tasks, add, update, remove, saveAll } = useCollection<Task>("tasks", seedTasks);
  const { items: checkins, add: addCheckin } = useCollection<Checkin>("checkins", seedCheckins);

  const today = todayStr();
  const [view, setView] = useState<View>("timeline");
  const [filter, setFilter] = useState<Filter>("all");

  // 新增/编辑弹窗（editId 为 null 表示新增）
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm, date: today });

  // 长按操作面板 / 删除确认
  const [sheetTask, setSheetTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const checkedToday = checkins.some((c) => c.date === today);
  const streak = calcStreak(checkins.map((c) => c.date));
  const totalDone = tasks.filter((t) => t.done).length;
  const rate = tasks.length ? Math.round((totalDone / tasks.length) * 100) : 0;
  const overdueTasks = tasks.filter((t) => !t.done && t.date < today);

  const todayTasks = tasks
    .filter((t) => t.date === today)
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

  const monthMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [tasks]);

  const filtered = tasks.filter((t) =>
    filter === "todo" ? !t.done : filter === "done" ? t.done : filter === "overdue" ? !t.done && t.date < today : true
  );

  /* ---------- CRUD 操作（全部带 Toast） ---------- */
  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm, date: today });
    setFormOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditId(t.id);
    setForm({ title: t.title, category: t.category, priority: t.priority, date: t.date, time: t.time || "09:00" });
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!form.title.trim()) { toast.error("请输入任务内容"); return; }
    if (editId) {
      update(editId, { title: form.title.trim(), category: form.category, priority: form.priority, date: form.date, time: form.time });
      toast.success("任务已更新");
    } else {
      add({ title: form.title.trim(), category: form.category, priority: form.priority, date: form.date, time: form.time, done: false, createdAt: new Date().toISOString() });
      toast.success("任务已添加");
    }
    setFormOpen(false);
  };

  const toggleDone = (t: Task) => {
    update(t.id, { done: !t.done, doneAt: !t.done ? today : undefined });
    toast.success(!t.done ? `「${t.title}」已完成 ✓` : "已恢复为待办");
  };

  const confirmRemove = (t: Task) => setDeleteTask(t);

  const doRemove = () => {
    if (!deleteTask) return;
    remove(deleteTask.id);
    toast.success("任务已删除");
    setDeleteTask(null);
  };

  const postponeToToday = (t: Task) => {
    update(t.id, { date: today });
    toast.success("已顺延到今天");
  };

  const checkin = () => {
    if (checkedToday) { toast.info("今天已经打过卡了"); return; }
    addCheckin({ date: today, createdAt: new Date().toISOString() });
    toast.success(`打卡成功！已连续 ${streak + 1} 天 🔥`);
  };

  /* ---------- 拖拽排序（列表视图） ---------- */
  const dragId = useRef<string | null>(null);

  const onDrop = (targetId: string) => {
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === targetId) return;
    saveAll((prev) => {
      const arr = [...prev];
      const fi = arr.findIndex((t) => t.id === from);
      const ti = arr.findIndex((t) => t.id === targetId);
      if (fi < 0 || ti < 0) return prev;
      const [moved] = arr.splice(fi, 1);
      arr.splice(ti, 0, moved);
      return arr;
    });
    toast.success("排序已调整");
  };

  const moveBy = (t: Task, dir: -1 | 1) => {
    saveAll((prev) => {
      const arr = [...prev];
      const i = arr.findIndex((x) => x.id === t.id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return prev;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
    toast.success(dir === -1 ? "已上移" : "已下移");
  };

  /* ---------- 长按操作面板 ---------- */
  const sheetActions: SheetAction[] = sheetTask
    ? [
        { label: sheetTask.done ? "恢复为待办" : "标记完成", icon: sheetTask.done ? "↩️" : "✅", onClick: () => toggleDone(sheetTask) },
        { label: "编辑任务", icon: "✏️", onClick: () => openEdit(sheetTask) },
        ...(!sheetTask.done && sheetTask.date < today
          ? [{ label: "顺延到今天", icon: "📅", onClick: () => postponeToToday(sheetTask) }]
          : []),
        { label: "上移一位", icon: "⬆️", onClick: () => moveBy(sheetTask, -1) },
        { label: "下移一位", icon: "⬇️", onClick: () => moveBy(sheetTask, 1) },
        { label: "删除任务", icon: "🗑️", danger: true, onClick: () => confirmRemove(sheetTask) },
      ]
    : [];

  const hours = Array.from({ length: 18 }, (_, i) => `${String(i + 6).padStart(2, "0")}:00`);

  return (
    <div className="space-y-5">
      <PageHeader
        title="任务管理"
        desc="点击卡片编辑 · 长按弹出操作 · 拖拽调整顺序"
        avatar
        extra={
          <Button onClick={checkin} disabled={checkedToday}>
            {checkedToday ? "✓ 今日已打卡" : "🔥 每日打卡"}
          </Button>
        }
      />

      {/* 4 项核心指标（逾期/今日可点击直达） */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard icon="🔥" label="连续打卡" value={`${streak} 天`} sub={checkedToday ? "今日已打卡" : "点击打卡"} accent="pink" onClick={checkin} />
        <StatCard icon="📋" label="今日任务" value={String(todayTasks.length)} sub={`已完成 ${todayTasks.filter((t) => t.done).length} 个`} accent="cyan" onClick={() => { setView("timeline"); }} />
        <StatCard icon="📈" label="完成率" value={`${rate}%`} sub="全部任务" accent="green" onClick={() => { setView("list"); setFilter("done"); }} />
        <StatCard icon="🎯" label="逾期任务" value={String(overdueTasks.length)} sub="点击处理" accent="amber" onClick={() => { setView("list"); setFilter("overdue"); }} />
      </div>

      {/* 视图切换 + 筛选 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-2xl bg-blue-950/40 p-1 ring-1 ring-blue-400/10">
          {([["timeline", "⏰ 时间轴"], ["list", "📋 列表"], ["calendar", "📅 日历"]] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-xl px-3 py-1.5 text-sm transition-all ${view === v ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow" : "text-blue-200/60 hover:text-white"}`}
            >
              {l}
            </button>
          ))}
        </div>
        {view === "list" && (
          <div className="flex gap-1 rounded-xl bg-blue-950/40 p-1 ring-1 ring-blue-400/10">
            {([["all", "全部"], ["todo", "待办"], ["done", "已完成"], ["overdue", "逾期"]] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`rounded-lg px-3 py-1 text-xs transition-all ${filter === v ? "bg-blue-600 text-white" : "text-blue-200/60 hover:text-white"}`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 时间轴视图 */}
      {view === "timeline" && (
        <GlassCard>
          <h3 className="mb-4 text-sm font-semibold text-white">⏰ 今日日程 · {today}</h3>
          {todayTasks.length === 0 ? (
            <EmptyState icon="📋" text="今天还没有安排，点右下角 ＋ 添加" />
          ) : (
            <div className="space-y-1">
              {hours.map((hour) => {
                const slot = todayTasks.filter((t) => (t.time || "").startsWith(hour.slice(0, 2)));
                return (
                  <div key={hour} className="flex gap-3 min-h-[40px]">
                    <div className="w-14 shrink-0 pt-1 text-right text-xs font-medium text-blue-300/70">{hour}</div>
                    <div className="flex-1 border-l-2 border-blue-400/10 pl-4">
                      {slot.length === 0 ? (
                        <div className="py-1.5 text-xs text-blue-200/20">·</div>
                      ) : (
                        slot.map((t) => (
                          <TaskRow
                            key={t.id}
                            task={t}
                            showTime
                            onToggle={() => toggleDone(t)}
                            onEdit={() => openEdit(t)}
                            onLongPress={() => setSheetTask(t)}
                            onDelete={() => confirmRemove(t)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* 列表视图（支持拖拽排序） */}
      {view === "list" && (
        <GlassCard>
          <p className="mb-3 text-xs text-blue-200/40">💡 桌面端可拖拽排序 · 移动端长按卡片弹出操作菜单</p>
          {filtered.length === 0 ? (
            <EmptyState icon={filter === "overdue" ? "🎉" : "🗒"} text={filter === "overdue" ? "没有逾期任务，干得漂亮！" : "暂无任务"} />
          ) : (
            <ul className="space-y-2">
              {filtered.map((t) => (
                <li
                  key={t.id}
                  draggable
                  onDragStart={() => (dragId.current = t.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(t.id)}
                >
                  <TaskRow
                    task={t}
                    showDate
                    today={today}
                    onToggle={() => toggleDone(t)}
                    onEdit={() => openEdit(t)}
                    onLongPress={() => setSheetTask(t)}
                    onDelete={() => confirmRemove(t)}
                    onPostpone={!t.done && t.date < today ? () => postponeToToday(t) : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      )}

      {/* 日历视图 */}
      {view === "calendar" && (
        <GlassCard>
          <h3 className="mb-4 text-sm font-semibold text-white">📅 本月日程总览 <span className="ml-2 text-xs font-normal text-blue-200/40">点击日期添加任务</span></h3>
          <Calendar
            month={new Date().getMonth()}
            year={new Date().getFullYear()}
            monthMap={monthMap}
            today={today}
            onPickDay={(dateStr) => {
              setEditId(null);
              setForm({ ...emptyForm, date: dateStr });
              setFormOpen(true);
            }}
          />
        </GlassCard>
      )}

      {/* FAB 新增任务 */}
      <FAB onClick={openAdd} label="新增任务" />

      {/* 新增 / 编辑任务弹窗 */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editId ? "✏️ 编辑任务" : "＋ 新增任务"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>取消</Button>
            <Button onClick={submitForm}>{editId ? "保存修改" : "添加任务"}</Button>
          </>
        }
      >
        <Field label="任务内容">
          <Input
            placeholder="要做点什么？例如：背 30 个单词"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submitForm()}
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="日期">
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="时间">
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </Field>
          <Field label="分类">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="优先级">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })} className="w-full">
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}优先级</option>)}
            </Select>
          </Field>
        </div>
      </Modal>

      {/* 长按操作面板 */}
      <ActionSheet open={!!sheetTask} onClose={() => setSheetTask(null)} title={sheetTask?.title} actions={sheetActions} />

      {/* 删除确认 */}
      <Confirm
        open={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={doRemove}
        title="删除任务"
        message={`确定删除「${deleteTask?.title}」吗？此操作不可恢复。`}
      />
    </div>
  );
}

/* ---------- 任务行组件：点击编辑 / 长按弹操作 ---------- */
function TaskRow({
  task: t,
  showTime,
  showDate,
  today,
  onToggle,
  onEdit,
  onDelete,
  onLongPress,
  onPostpone,
}: {
  task: Task;
  showTime?: boolean;
  showDate?: boolean;
  today?: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLongPress: () => void;
  onPostpone?: () => void;
}) {
  const press = useLongPress(onLongPress, onEdit);
  const pri = PRIORITIES.find((p) => p.value === t.priority)!;
  const overdue = today ? !t.done && t.date < today : false;

  return (
    <div
      className={`press-item group mb-1.5 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all hover:border-blue-400/30 ${
        overdue ? "border-red-400/25 bg-red-500/[0.06]" : "border-blue-400/10"
      } ${t.done ? "bg-blue-950/30 opacity-60" : overdue ? "" : "bg-blue-500/[0.08]"}`}
      {...press}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        onTouchEnd={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs touch-btn ${
          t.done ? "border-emerald-400 bg-emerald-400 text-blue-950" : "border-blue-300/40 hover:border-cyan-400"
        }`}
      >
        {t.done && "✓"}
      </button>
      {showTime && <span className="w-12 shrink-0 text-xs font-medium text-cyan-300">{t.time}</span>}
      <div className="min-w-0 flex-1">
        <span className={`text-sm ${t.done ? "text-blue-200/40 line-through" : "text-blue-50"}`}>{t.title}</span>
        {overdue && <span className="ml-2 text-[11px] text-red-400">已逾期</span>}
        {showDate && <p className="mt-0.5 text-[11px] text-blue-200/40">{t.date}{t.time && ` · ${t.time}`}</p>}
      </div>
      <Tag color={pri.color}>{pri.label}</Tag>
      <Tag color="cyan">{t.category}</Tag>
      {onPostpone && (
        <button
          onClick={(e) => { e.stopPropagation(); onPostpone(); }}
          onTouchEnd={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="touch-btn shrink-0 rounded-lg bg-amber-500/15 px-2 py-1 text-[11px] text-amber-300"
        >
          顺延
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        onTouchEnd={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="touch-btn hidden shrink-0 text-xs text-blue-200/40 hover:text-cyan-300 md:group-hover:inline"
      >
        ✏️
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        onTouchEnd={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="touch-btn shrink-0 text-xs text-blue-200/30 hover:text-red-400"
      >
        ✕
      </button>
    </div>
  );
}

/* ---------- 日历组件（点击日期新增任务） ---------- */
function Calendar({
  month,
  year,
  monthMap,
  today,
  onPickDay,
}: {
  month: number;
  year: number;
  monthMap: Record<string, Task[]>;
  today: string;
  onPickDay: (date: string) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: number[][] = [];
  let day = 1 - firstDay;
  for (let w = 0; w < 6; w++) {
    const week: number[] = [];
    for (let d = 0; d < 7; d++) {
      if (day > 0 && day <= daysInMonth) week.push(day);
      else week.push(0);
      day++;
    }
    weeks.push(week);
  }
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const wkNames = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-blue-200/80">{year} 年 {monthNames[month]}</div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-blue-200/50">
        {wkNames.map((w) => <div key={w} className="py-1">{w}</div>)}
      </div>
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((d, di) => {
              if (d === 0) return <div key={di} className="aspect-square" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const dayTasks = monthMap[dateStr] ?? [];
              const isToday = dateStr === today;
              const allDone = dayTasks.length > 0 && dayTasks.every((t) => t.done);
              return (
                <button
                  key={di}
                  onClick={() => onPickDay(dateStr)}
                  className={`relative aspect-square rounded-lg border p-1 text-left transition-all active:scale-95 ${
                    isToday ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.3)]" : "border-blue-400/10 bg-blue-950/30 hover:bg-blue-500/10"
                  }`}
                >
                  <div className={`text-xs font-bold ${isToday ? "text-cyan-300" : "text-blue-100/90"}`}>{d}</div>
                  {dayTasks.length > 0 && (
                    <div className="absolute bottom-1 right-1 flex gap-0.5">
                      {dayTasks.slice(0, 3).map((_, i) => (
                        <span
                          key={i}
                          className={`h-1 w-1 rounded-full ${allDone ? "bg-emerald-400" : isToday ? "bg-cyan-400" : "bg-blue-400"}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
