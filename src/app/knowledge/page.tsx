"use client";

import { useMemo, useState } from "react";
import { GlassCard, PageHeader, Button, Input, Tag, EmptyState, Avatar } from "@/components/ui";
import { Markdown } from "@/lib/markdown";
import { useCollection } from "@/lib/store";
import { KnowledgeNote } from "@/lib/types";
import { seedNotes } from "@/lib/seed";

export default function KnowledgePage() {
  const { items: notes, add, update, remove } = useCollection<KnowledgeNote>("notes", seedNotes);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", content: "", category: "", tags: "" });

  const categories = useMemo(() => Array.from(new Set(notes.map((n) => n.category))), [notes]);

  const filtered = notes.filter((n) => {
    const matchSearch =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = categoryFilter === "all" || n.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  const startNew = () => {
    setDraft({ title: "", content: "", category: categoryFilter === "all" ? "未分类" : categoryFilter, tags: "" });
    setSelectedId(null);
    setEditing(true);
  };

  const startEdit = (n: KnowledgeNote) => {
    setDraft({ title: n.title, content: n.content, category: n.category, tags: n.tags.join(", ") });
    setEditing(true);
  };

  const save = () => {
    if (!draft.title.trim()) return;
    const tags = draft.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
    if (selected) {
      update(selected.id, { title: draft.title, content: draft.content, category: draft.category || "未分类", tags, updatedAt: new Date().toISOString() });
    } else {
      const created = add({
        title: draft.title.trim(),
        content: draft.content,
        category: draft.category || "未分类",
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setSelectedId(created.id);
    }
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* 知识库创作者标识 */}
      <GlassCard>
        <div className="flex items-center gap-4">
          <Avatar size="lg" />
          <div>
            <h2 className="text-lg font-bold text-white">知识资产</h2>
            <p className="mt-1 text-sm text-blue-200/60">Markdown 笔记 · 分类 · 标签 · 搜索 · 实时预览</p>
          </div>
        </div>
      </GlassCard>

      <PageHeader
        title="知识库"
        desc="Markdown 笔记 · 分类 · 标签 · 搜索 —— 构建你的知识资产"
        extra={<Button onClick={startNew}>＋ 新建笔记</Button>}
      />

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        {/* 左侧：列表 */}
        <div className="space-y-3">
          <GlassCard className="p-3">
            <Input placeholder="🔍 搜索标题 / 内容 / 标签" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`rounded-lg px-2.5 py-1 text-xs transition-all ${categoryFilter === "all" ? "bg-blue-600 text-white" : "bg-blue-950/50 text-blue-200/60 hover:text-white border border-blue-400/10"}`}
              >
                全部
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`rounded-lg px-2.5 py-1 text-xs transition-all ${categoryFilter === c ? "bg-blue-600 text-white" : "bg-blue-950/50 text-blue-200/60 hover:text-white border border-blue-400/10"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </GlassCard>

          <div className="space-y-2">
            {filtered.length === 0 && <GlassCard><EmptyState icon="🧠" text="没有找到笔记" /></GlassCard>}
            {filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => { setSelectedId(n.id); setEditing(false); }}
                className={`glass glass-hover w-full rounded-2xl p-3 text-left transition-all ${
                  selectedId === n.id ? "border-blue-400/40 bg-blue-500/15" : ""
                }`}
              >
                <p className="text-sm font-medium text-white">{n.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Tag color="cyan">{n.category}</Tag>
                  {n.tags.slice(0, 3).map((t) => <Tag key={t} color="zinc">#{t}</Tag>)}
                </div>
                <p className="mt-1 text-[10px] text-blue-200/40">更新于 {n.updatedAt.slice(0, 10)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧：分屏编辑 + 查看 */}
        <GlassCard className="min-h-96">
          {editing ? (
            <div className="space-y-3">
              <Input placeholder="笔记标题" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input placeholder="分类，如：方法论" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="flex-1" />
                <Input placeholder="标签（逗号分隔）" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} className="flex-1" />
              </div>
              {/* 分屏：左编辑 + 右实时预览 */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="flex flex-col">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] text-blue-200/40 uppercase tracking-wider">编辑</span>
                    <span className="text-[10px] text-blue-200/30">{draft.content.length} 字</span>
                  </div>
                  <textarea
                    rows={20}
                    placeholder="支持 Markdown 语法：# 标题、**加粗**、- 列表、> 引用、`代码`"
                    value={draft.content}
                    onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                    className="flex-1 resize-none rounded-xl border border-blue-400/15 bg-blue-950/40 px-4 py-3 font-mono text-sm text-blue-50 placeholder-blue-200/40 leading-relaxed"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] text-blue-200/40 uppercase tracking-wider">预览</span>
                  </div>
                  <div className="flex-1 overflow-y-auto rounded-xl border border-blue-400/10 bg-blue-950/20 px-4 py-3">
                    {draft.content ? (
                      <Markdown text={draft.content} />
                    ) : (
                      <p className="text-sm text-blue-200/40 italic">在左侧编辑区输入，这里实时预览</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditing(false)}>取消</Button>
                <Button onClick={save}>保存笔记</Button>
              </div>
            </div>
          ) : selected ? (
            <div>
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-blue-400/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{selected.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Tag color="cyan">{selected.category}</Tag>
                    {selected.tags.map((t) => <Tag key={t} color="zinc">#{t}</Tag>)}
                    <span className="text-[10px] text-blue-200/40">更新于 {selected.updatedAt.slice(0, 10)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => startEdit(selected)}>编辑</Button>
                  <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => { remove(selected.id); setSelectedId(null); }}>删除</Button>
                </div>
              </div>
              <Markdown text={selected.content || "*暂无内容*"} />
            </div>
          ) : (
            <EmptyState icon="📖" text="选择左侧笔记查看，或新建一篇笔记" />
          )}
        </GlassCard>
      </div>
    </div>
  );
}
