"use client";

import { useState } from "react";
import { GlassCard, PageHeader, Button, Input, Select, Textarea, Tag, StatCard, EmptyState, Avatar } from "@/components/ui";
import { toast } from "@/components/toast";
import { FAB, Modal, ActionSheet, Confirm, Field, useLongPress, SheetAction } from "@/components/interactive";
import { useCollection } from "@/lib/store";
import { MediaWork, MediaPlatform, MediaStatus } from "@/lib/types";
import { seedMediaWorks } from "@/lib/seed";
import { todayStr } from "@/lib/utils";

const PLATFORMS: Record<MediaPlatform, { name: string; icon: string; color: string }> = {
  xiaohongshu: { name: "小红书", icon: "📕", color: "red" },
  douyin: { name: "抖音", icon: "🎵", color: "cyan" },
  gongzhonghao: { name: "公众号", icon: "💬", color: "green" },
};

const STATUS_FLOW: { key: MediaStatus; label: string; color: string }[] = [
  { key: "idea", label: "选题", color: "zinc" },
  { key: "drafting", label: "创作中", color: "amber" },
  { key: "ready", label: "待发布", color: "blue" },
  { key: "published", label: "已发布", color: "green" },
];

export default function MediaPage() {
  const { items: works, add, update, remove } = useCollection<MediaWork>("media_works", seedMediaWorks);
  const [platformFilter, setPlatformFilter] = useState<"all" | MediaPlatform>("all");

  // 新选题表单
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<MediaPlatform>("xiaohongshu");

  // 数据复盘编辑
  const [editingId, setEditingId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({ views: "", likes: "", comments: "", collects: "", review: "" });

  // 草稿编辑弹窗 / 长按面板 / 删除确认 / 选题录入弹窗
  const [draftWork, setDraftWork] = useState<MediaWork | null>(null);
  const [draftForm, setDraftForm] = useState({ title: "", platform: "xiaohongshu" as MediaPlatform, status: "idea" as MediaStatus, publishDate: "" });
  const [sheetWork, setSheetWork] = useState<MediaWork | null>(null);
  const [deleteWork, setDeleteWork] = useState<MediaWork | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const openDraft = (w: MediaWork) => {
    setDraftWork(w);
    setDraftForm({ title: w.title, platform: w.platform, status: w.status, publishDate: w.publishDate ?? "" });
  };

  const saveDraft = () => {
    if (!draftWork) return;
    if (!draftForm.title.trim()) { toast.error("标题不能为空"); return; }
    update(draftWork.id, { title: draftForm.title.trim(), platform: draftForm.platform, status: draftForm.status, publishDate: draftForm.publishDate || undefined });
    toast.success("草稿已更新");
    setDraftWork(null);
  };

  /** 发布操作接口：置为已发布 + 记录发布日期（后续可替换为真实平台 API） */
  const publishWork = (w: MediaWork) => {
    update(w.id, { status: "published", publishDate: todayStr() });
    toast.success(`「${w.title}」已标记发布 🚀`);
  };

  const advance = (w: MediaWork, next: MediaStatus) => {
    update(w.id, { status: next, ...(next === "published" ? { publishDate: todayStr() } : {}) });
    const label = STATUS_FLOW.find((s) => s.key === next)!.label;
    next === "published" ? toast.success(`「${w.title}」已发布 🚀`) : toast.success(`已流转到「${label}」`);
  };

  const filtered = works.filter((w) => platformFilter === "all" || w.platform === platformFilter);
  const published = works.filter((w) => w.status === "published");
  const totalViews = published.reduce((s, w) => s + (w.views ?? 0), 0);
  const totalLikes = published.reduce((s, w) => s + (w.likes ?? 0), 0);

  const nextStatus = (s: MediaStatus): MediaStatus | null => {
    const i = STATUS_FLOW.findIndex((f) => f.key === s);
    return i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1].key : null;
  };

  const openReview = (w: MediaWork) => {
    setEditingId(w.id);
    setMetrics({
      views: String(w.views ?? ""),
      likes: String(w.likes ?? ""),
      comments: String(w.comments ?? ""),
      collects: String(w.collects ?? ""),
      review: w.review ?? "",
    });
  };

  const saveReview = () => {
    if (!editingId) return;
    update(editingId, {
      views: parseInt(metrics.views) || 0,
      likes: parseInt(metrics.likes) || 0,
      comments: parseInt(metrics.comments) || 0,
      collects: parseInt(metrics.collects) || 0,
      review: metrics.review,
    });
    toast.success("数据复盘已保存 📊");
    setEditingId(null);
  };

  const submitIdea = () => {
    if (!title.trim()) { toast.error("请输入选题标题"); return; }
    add({ platform, title: title.trim(), status: "idea", createdAt: new Date().toISOString() });
    toast.success("新选题已加入选题库 💡");
    setTitle("");
    setAddOpen(false);
  };

  /* 长按操作面板动作 */
  const sheetActions: SheetAction[] = sheetWork
    ? [
        { label: "编辑草稿", icon: "✏️", onClick: () => openDraft(sheetWork) },
        ...(sheetWork.status !== "published"
          ? [{ label: "直接发布", icon: "🚀", onClick: () => publishWork(sheetWork) }]
          : [{ label: "数据复盘", icon: "📊", onClick: () => openReview(sheetWork) }]),
        ...(nextStatus(sheetWork.status) && sheetWork.status !== "published"
          ? [{ label: `流转到「${STATUS_FLOW.find((s) => s.key === nextStatus(sheetWork.status))!.label}」`, icon: "➡️", onClick: () => advance(sheetWork, nextStatus(sheetWork.status)!) }]
          : []),
        { label: "删除", icon: "🗑️", danger: true, onClick: () => setDeleteWork(sheetWork) },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* 创作者主页 */}
      <GlassCard className="overflow-hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Avatar size="lg" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">创作者主页</h2>
            <p className="mt-1 text-sm text-blue-200/60">统一管理小红书 · 抖音 · 公众号</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {Object.entries(PLATFORMS).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/15 bg-blue-500/[0.08] px-2.5 py-1 text-xs text-blue-100">
                  <Avatar size="sm" ring={false} />
                  <span>{v.icon} {v.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <PageHeader title="自媒体管理" desc="小红书 · 抖音 · 公众号 —— 选题、状态、发布、数据复盘" />

      {/* AI 创作工具箱 */}
      <GlassCard>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">AI 创作工具箱</h3>
          <span className="text-xs text-zinc-500">WorkBuddy Skill 流水线</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "content-research writer", stage: "选题研究", desc: "选题、素材、大纲、引用到成稿，一条流跑通", ok: false, icon: "🔍" },
            { name: "khazix-writer", stage: "长文写作", desc: "公众号长文、万字研究报告、AI热点分析", ok: true, icon: "📝" },
            { name: "Humanizer-zh（去AI味）", stage: "润色去AI味", desc: "去除文本中的AI写作痕迹，让内容更自然", ok: true, icon: "✨" },
            { name: "dbskill", stage: "内容诊断", desc: "内容诊断、商业表达、Hook、小红书标题", ok: false, icon: "🎯" },
            { name: "NotebookLM Studio", stage: "资料库写作", desc: "基于资料库写作，适合深度文章和课程稿", ok: true, icon: "📚" },
            { name: "guizang-PPT-Skill", stage: "配图封面", desc: "生成高质量网页PPT、演讲deck与多比例封面", ok: true, icon: "🎨" },
            { name: "baoyu-skills", stage: "视觉设计", desc: "PPT、演讲图、公众号头图、小红书封面", ok: false, icon: "🖼️" },
          ].map((s) => (
            <div key={s.name} className="rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-all hover:bg-white/[0.06]">
              <div className="flex items-start gap-2">
                <span className="text-lg">{s.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-100">{s.name}</p>
                  <p className="text-[10px] text-zinc-500">{s.stage}</p>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">{s.desc}</p>
              <div className="mt-2">
                {s.ok ? (
                  <Tag color="green">已安装</Tag>
                ) : (
                  <Tag color="zinc">未安装</Tag>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-zinc-500">
          使用方式：在 WorkBuddy 对话中输入 Skill 名称或触发词即可调用。未安装的 Skill 可前往技能市场搜索安装。
        </p>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard icon="💡" label="选题库" value={String(works.filter((w) => w.status === "idea").length)} accent="amber" />
        <StatCard icon="✍️" label="创作中" value={String(works.filter((w) => w.status === "drafting" || w.status === "ready").length)} accent="blue" />
        <StatCard icon="🚀" label="已发布" value={String(published.length)} accent="cyan" />
        <StatCard icon="👀" label="总阅读/播放" value={totalViews >= 10000 ? (totalViews / 10000).toFixed(1) + "w" : String(totalViews)} sub={`获赞 ${totalLikes}`} accent="green" />
      </div>

      {/* 新建选题 */}
      <GlassCard>
        <h3 className="mb-3 text-sm font-semibold text-white">记录新选题</h3>
        <div className="flex flex-col gap-2 md:flex-row">
          <Input placeholder="选题标题，如：30 天自律实验复盘" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && submitIdea()}
          />
          <div className="flex gap-2">
            <Select value={platform} onChange={(e) => setPlatform(e.target.value as MediaPlatform)}>
              {Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.name}</option>)}
            </Select>
            <Button onClick={submitIdea}>添加选题</Button>
          </div>
        </div>
      </GlassCard>

      {/* 平台筛选 */}
      <div className="flex gap-2 overflow-x-auto">
        <button
          onClick={() => setPlatformFilter("all")}
          className={`rounded-xl px-4 py-1.5 text-sm whitespace-nowrap transition-all ${platformFilter === "all" ? "bg-blue-600 text-white" : "glass text-zinc-400 hover:text-white"}`}
        >
          全部
        </button>
        {Object.entries(PLATFORMS).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setPlatformFilter(k as MediaPlatform)}
            className={`rounded-xl px-4 py-1.5 text-sm whitespace-nowrap transition-all ${platformFilter === k ? "bg-blue-600 text-white" : "glass text-zinc-400 hover:text-white"}`}
          >
            {v.icon} {v.name}
          </button>
        ))}
      </div>

      {/* 作品流水线（按状态分栏） */}
      <div className="grid gap-4 md:grid-cols-4">
        {STATUS_FLOW.map((stage) => {
          const list = filtered.filter((w) => w.status === stage.key);
          return (
            <GlassCard key={stage.key} className="min-h-32">
              <div className="mb-3 flex items-center justify-between">
                <Tag color={stage.color}>{stage.label}</Tag>
                <span className="text-xs text-zinc-500">{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.length === 0 && <p className="py-4 text-center text-xs text-zinc-600">暂无</p>}
                {list.map((w) => (
                  <WorkCard
                    key={w.id}
                    work={w}
                    onEdit={() => openDraft(w)}
                    onLongPress={() => setSheetWork(w)}
                    onDelete={() => setDeleteWork(w)}
                    onAdvance={(next) => advance(w, next)}
                    onPublish={() => publishWork(w)}
                    onReview={() => openReview(w)}
                  />
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* FAB 新增选题 */}
      <FAB onClick={() => setAddOpen(true)} label="新选题" />

      {/* 选题录入弹窗（FAB 触发） */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="💡 选题录入"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>取消</Button><Button onClick={submitIdea}>加入选题库</Button></>}
      >
        <Field label="选题标题">
          <Input placeholder="如：30 天自律实验复盘" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitIdea()} autoFocus />
        </Field>
        <Field label="发布平台">
          <Select value={platform} onChange={(e) => setPlatform(e.target.value as MediaPlatform)} className="w-full">
            {Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.name}</option>)}
          </Select>
        </Field>
      </Modal>

      {/* 编辑草稿弹窗 */}
      <Modal
        open={!!draftWork}
        onClose={() => setDraftWork(null)}
        title="✏️ 编辑草稿"
        footer={<><Button variant="ghost" onClick={() => setDraftWork(null)}>取消</Button><Button onClick={saveDraft}>保存修改</Button></>}
      >
        <Field label="标题">
          <Input value={draftForm.title} onChange={(e) => setDraftForm({ ...draftForm, title: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="平台">
            <Select value={draftForm.platform} onChange={(e) => setDraftForm({ ...draftForm, platform: e.target.value as MediaPlatform })} className="w-full">
              {Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.name}</option>)}
            </Select>
          </Field>
          <Field label="状态">
            <Select value={draftForm.status} onChange={(e) => setDraftForm({ ...draftForm, status: e.target.value as MediaStatus })} className="w-full">
              {STATUS_FLOW.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="发布日期（可选）">
          <Input type="date" value={draftForm.publishDate} onChange={(e) => setDraftForm({ ...draftForm, publishDate: e.target.value })} />
        </Field>
      </Modal>

      {/* 长按操作面板 */}
      <ActionSheet open={!!sheetWork} onClose={() => setSheetWork(null)} title={sheetWork?.title} actions={sheetActions} />

      {/* 删除确认 */}
      <Confirm
        open={!!deleteWork}
        onClose={() => setDeleteWork(null)}
        onConfirm={() => { if (deleteWork) { remove(deleteWork.id); toast.success("已删除"); } }}
        title="删除作品"
        message={`确定删除「${deleteWork?.title}」吗？此操作不可恢复。`}
      />

      {/* 数据复盘弹层 */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setEditingId(null)}>
          <GlassCard className="glass-strong w-full max-w-md" hover={false}>
            <div onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-4 text-base font-semibold text-white">📊 数据复盘</h3>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="阅读/播放" value={metrics.views} onChange={(e) => setMetrics({ ...metrics, views: e.target.value })} />
                <Input type="number" placeholder="点赞" value={metrics.likes} onChange={(e) => setMetrics({ ...metrics, likes: e.target.value })} />
                <Input type="number" placeholder="评论" value={metrics.comments} onChange={(e) => setMetrics({ ...metrics, comments: e.target.value })} />
                <Input type="number" placeholder="收藏" value={metrics.collects} onChange={(e) => setMetrics({ ...metrics, collects: e.target.value })} />
              </div>
              <Textarea rows={3} className="mt-2" placeholder="复盘：哪里做得好？下次怎么改进？" value={metrics.review} onChange={(e) => setMetrics({ ...metrics, review: e.target.value })} />
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditingId(null)}>取消</Button>
                <Button onClick={saveReview}>保存</Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

/* ---------- 看板作品卡片：点击编辑 / 长按弹操作 ---------- */
function WorkCard({
  work: w,
  onEdit,
  onLongPress,
  onDelete,
  onAdvance,
  onPublish,
  onReview,
}: {
  work: MediaWork;
  onEdit: () => void;
  onLongPress: () => void;
  onDelete: () => void;
  onAdvance: (next: MediaStatus) => void;
  onPublish: () => void;
  onReview: () => void;
}) {
  const press = useLongPress(onLongPress, onEdit);
  const p = PLATFORMS[w.platform];
  const i = STATUS_FLOW.findIndex((f) => f.key === w.status);
  const next = i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1].key : null;

  return (
    <div className="press-item group cursor-pointer rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-all hover:bg-white/[0.06] active:scale-[0.98]" {...press}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-100">{w.title}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onTouchEnd={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="touch-btn shrink-0 text-zinc-600 hover:text-red-400"
        >
          ✕
        </button>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Tag color={p.color}>{p.icon} {p.name}</Tag>
        {w.publishDate && <span className="text-[10px] text-zinc-500">{w.publishDate}</span>}
      </div>
      {w.status === "published" && (
        <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px] text-zinc-400">
          <span>👀 {w.views ?? 0}</span>
          <span>❤️ {w.likes ?? 0}</span>
          <span>💬 {w.comments ?? 0}</span>
          <span>⭐ {w.collects ?? 0}</span>
        </div>
      )}
      {w.review && <p className="mt-2 rounded-lg bg-white/5 p-2 text-[11px] text-zinc-400">复盘：{w.review}</p>}
      <div className="mt-2 flex gap-1.5" onTouchEnd={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <Button variant="ghost" className="flex-1 px-2 py-1 text-[11px]" onClick={() => { onEdit(); }}>✏️ 编辑</Button>
        {next && next !== "published" && (
          <Button variant="ghost" className="flex-1 px-2 py-1 text-[11px]" onClick={() => onAdvance(next)}>
            → {STATUS_FLOW.find((s) => s.key === next)!.label}
          </Button>
        )}
        {w.status === "ready" && (
          <Button className="flex-1 px-2 py-1 text-[11px]" onClick={onPublish}>🚀 发布</Button>
        )}
        {w.status === "published" && (
          <Button variant="ghost" className="flex-1 px-2 py-1 text-[11px]" onClick={onReview}>📊 复盘</Button>
        )}
      </div>
    </div>
  );
}
