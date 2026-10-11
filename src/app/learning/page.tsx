"use client";

import { useMemo, useState } from "react";
import { GlassCard, PageHeader, Button, Input, Select, Textarea, Tag, StatCard, ProgressBar, EmptyState } from "@/components/ui";
import { toast } from "@/components/toast";
import { Modal, Confirm, Field } from "@/components/interactive";
import { useCollection } from "@/lib/store";
import { StudyLog, Word, StudyPlan, KnowledgeNote } from "@/lib/types";
import { seedStudyLogs, seedWords, seedPlans, seedNotes } from "@/lib/seed";
import { todayStr, lastNDays, minutesToText } from "@/lib/utils";

type Tab = "logs" | "words" | "plans" | "notes";
const SUBJECTS = ["英语", "编程", "运营", "阅读", "其他"];

export default function LearningPage() {
  const [tab, setTab] = useState<Tab>("logs");
  const { items: logs, add: addLog, update: updateLog, remove: removeLog } = useCollection<StudyLog>("study_logs", seedStudyLogs);
  const { items: words, add: addWord, update: updateWord, remove: removeWord } = useCollection<Word>("words", seedWords);
  const { items: plans, add: addPlan, update: updatePlan, remove: removePlan } = useCollection<StudyPlan>("plans", seedPlans);
  const { items: notes, add: addNote, update: updateNote, remove: removeNote } = useCollection<KnowledgeNote>("notes", seedNotes);

  // ===== 编辑弹窗状态（按类型区分） =====
  const [editLog, setEditLog] = useState<StudyLog | null>(null);
  const [editWord, setEditWord] = useState<Word | null>(null);
  const [editPlan, setEditPlan] = useState<StudyPlan | null>(null);
  const [editNote, setEditNote] = useState<KnowledgeNote | null>(null);
  const [pending, setPending] = useState<{ type: string; id: string; label: string } | null>(null);

  const doDelete = () => {
    if (!pending) return;
    if (pending.type === "log") removeLog(pending.id);
    if (pending.type === "word") removeWord(pending.id);
    if (pending.type === "plan") removePlan(pending.id);
    if (pending.type === "note") removeNote(pending.id);
    toast.success("已删除");
    setPending(null);
  };

  // 学习记录表单
  const [logMinutes, setLogMinutes] = useState("30");
  const [logSubject, setLogSubject] = useState("英语");
  const [logNote, setLogNote] = useState("");

  // 单词表单 + 词典查询
  const [wordText, setWordText] = useState("");
  const [wordMeaning, setWordMeaning] = useState("");
  const [wordPhonetic, setWordPhonetic] = useState("");
  const [wordExample, setWordExample] = useState("");
  const [wordSearch, setWordSearch] = useState("");
  const [dictLoading, setDictLoading] = useState(false);
  const [dictError, setDictError] = useState("");

  const lookupDict = async () => {
    if (!wordText.trim()) return;
    setDictLoading(true);
    setDictError("");
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(wordText.trim())}`);
      if (!res.ok) {
        if (res.status === 404) { setDictError("未找到该单词"); setDictLoading(false); return; }
        throw new Error("查询失败");
      }
      const data = await res.json();
      const entry = data[0];
      setWordPhonetic(entry.phonetic || (entry.phonetics?.find((p: any) => p.text)?.text ?? ""));
      const defs = entry.meanings?.slice(0, 2).map((m: any) =>
        `${m.partOfSpeech} · ${m.definitions[0]?.definition}`
      ).join("；") || "";
      setWordMeaning(defs);
      const ex = entry.meanings?.find((m: any) => m.definitions[0]?.example)?.definitions[0]?.example || "";
      setWordExample(ex);
    } catch (e: any) {
      setDictError(e.message || "网络错误");
    }
    setDictLoading(false);
  };

  // 计划表单
  const [planTitle, setPlanTitle] = useState("");
  const [planTarget, setPlanTarget] = useState("");
  const [planDeadline, setPlanDeadline] = useState(todayStr());

  // 笔记表单
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const week = useMemo(() => new Set(lastNDays(7)), []);
  const weekMinutes = logs.filter((l) => week.has(l.date)).reduce((s, l) => s + l.minutes, 0);
  const totalMinutes = logs.reduce((s, l) => s + l.minutes, 0);
  const mastered = words.filter((w) => w.mastered).length;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "logs", label: "学习记录", icon: "⏱" },
    { key: "words", label: "单词管理", icon: "🔤" },
    { key: "plans", label: "学习计划", icon: "🎯" },
    { key: "notes", label: "学习笔记", icon: "📝" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="学习中心" desc="英语学习 · 单词管理 · 学习计划 · 学习笔记" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard icon="⏱" label="本周学习" value={minutesToText(weekMinutes)} accent="cyan" />
        <StatCard icon="📚" label="累计学习" value={minutesToText(totalMinutes)} accent="blue" />
        <StatCard icon="🔤" label="单词量" value={String(words.length)} sub={`已掌握 ${mastered}`} accent="amber" />
        <StatCard icon="🎯" label="进行中计划" value={String(plans.filter((p) => p.progress < 100).length)} accent="pink" />
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white/5 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-sm transition-all ${
              tab === t.key ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow" : "text-blue-200/60 hover:text-white"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ===== 学习记录 ===== */}
      {tab === "logs" && (
        <div className="space-y-4">
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-white">记录今日学习</h3>
            <div className="flex flex-col gap-2 md:flex-row">
              <Select value={logSubject} onChange={(e) => setLogSubject(e.target.value)}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </Select>
              <Input type="number" min="1" value={logMinutes} onChange={(e) => setLogMinutes(e.target.value)} placeholder="时长（分钟）" className="md:w-32" />
              <Input placeholder="学了什么？（可选）" value={logNote} onChange={(e) => setLogNote(e.target.value)} className="flex-1" />
              <Button
                onClick={() => {
                  const m = parseInt(logMinutes);
                  if (!m || m <= 0) { toast.error("请输入有效的学习时长"); return; }
                  addLog({ date: todayStr(), subject: logSubject, minutes: m, note: logNote, createdAt: new Date().toISOString() });
                  setLogNote("");
                  toast.success(`已记录 ${logSubject} ${m} 分钟`);
                }}
              >
                记录
              </Button>
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-white">最近记录</h3>
            {logs.length === 0 ? <EmptyState icon="⏱" text="还没有学习记录" /> : (
              <ul className="space-y-2">
                {logs.slice(0, 10).map((l) => (
                  <li key={l.id} className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
                    <Tag color="blue">{l.subject}</Tag>
                    <span className="text-sm text-blue-100/90">{minutesToText(l.minutes)}</span>
                    <span className="flex-1 truncate text-xs text-blue-200/50">{l.note}</span>
                    <span className="text-xs text-blue-200/50">{l.date}</span>
                    <button onClick={() => setEditLog(l)} className="touch-btn text-xs text-blue-200/40 hover:text-cyan-300">✏️</button>
                    <button onClick={() => setPending({ type: "log", id: l.id, label: `${l.subject} ${minutesToText(l.minutes)}` })} className="touch-btn text-blue-200/40 hover:text-red-400">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      )}

      {/* ===== 单词管理 ===== */}
      {tab === "words" && (
        <div className="space-y-4">
          <GlassCard>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <span>添加单词</span>
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-cyan-300">🔗 词典 API</span>
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 md:flex-row">
                <Input placeholder="单词" value={wordText} onChange={(e) => { setWordText(e.target.value); setDictError(""); }} className="md:w-48"
                  onKeyDown={(e) => { if (e.key === "Enter") lookupDict(); }}
                />
                <Button variant="ghost" className="px-3" onClick={lookupDict} disabled={dictLoading}>
                  {dictLoading ? "查询中…" : "🔍 查词典"}
                </Button>
                <Input placeholder="中文释义（自动填充）" value={wordMeaning} onChange={(e) => setWordMeaning(e.target.value)} className="flex-1" />
                <Button
                  onClick={() => {
                    if (!wordText.trim() || !wordMeaning.trim()) { toast.error("单词和释义不能为空"); return; }
                    addWord({ word: wordText.trim(), phonetic: wordPhonetic, meaning: wordMeaning.trim(), example: wordExample, mastered: false, createdAt: new Date().toISOString() });
                    toast.success(`单词「${wordText.trim()}」已加入单词本`);
                    setWordText(""); setWordMeaning(""); setWordPhonetic(""); setWordExample("");
                  }}
                >
                  添加
                </Button>
              </div>
              {dictError && <p className="text-xs text-red-400">{dictError}</p>}
              {wordPhonetic && <p className="text-xs text-blue-200/60">音标: {wordPhonetic}</p>}
              <Input placeholder="例句（自动填充）" value={wordExample} onChange={(e) => setWordExample(e.target.value)} />
            </div>
          </GlassCard>
          <GlassCard>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">单词本（{words.length}）</h3>
              <Input placeholder="搜索单词…" value={wordSearch} onChange={(e) => setWordSearch(e.target.value)} className="max-w-48" />
            </div>
            {words.length === 0 ? <EmptyState icon="🔤" text="单词本还是空的" /> : (
              <ul className="space-y-2">
                {words
                  .filter((w) => w.word.toLowerCase().includes(wordSearch.toLowerCase()) || w.meaning.includes(wordSearch))
                  .map((w) => (
                    <li key={w.id} className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
                      <button
                        onClick={() => { updateWord(w.id, { mastered: !w.mastered }); toast.success(!w.mastered ? `已掌握「${w.word}」🎉` : "已移回学习中"); }}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
                          w.mastered ? "border-emerald-500 bg-emerald-500 text-white" : "border-blue-300/40 hover:border-emerald-400"
                        }`}
                      >
                        {w.mastered && "✓"}
                      </button>
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${w.mastered ? "text-blue-200/50 line-through" : "text-white"}`}>{w.word}</span>
                        {w.phonetic && <span className="ml-2 text-xs text-blue-200/50">{w.phonetic}</span>}
                        <p className="text-xs text-blue-200/60">{w.meaning}</p>
                        {w.example && <p className="mt-0.5 text-xs text-blue-200/50 italic">{w.example}</p>}
                      </div>
                      {w.mastered && <Tag color="green">已掌握</Tag>}
                      <button onClick={() => setEditWord(w)} className="touch-btn text-xs text-blue-200/40 hover:text-cyan-300">✏️</button>
                      <button onClick={() => setPending({ type: "word", id: w.id, label: w.word })} className="touch-btn text-blue-200/40 hover:text-red-400">✕</button>
                    </li>
                  ))}
              </ul>
            )}
          </GlassCard>
        </div>
      )}

      {/* ===== 学习计划 ===== */}
      {tab === "plans" && (
        <div className="space-y-4">
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-white">新建学习计划</h3>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input placeholder="计划名称，如：英语词汇量破 8000" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} className="flex-1" />
              <Input placeholder="目标描述" value={planTarget} onChange={(e) => setPlanTarget(e.target.value)} className="flex-1" />
              <Input type="date" value={planDeadline} onChange={(e) => setPlanDeadline(e.target.value)} className="md:w-40" />
              <Button
                onClick={() => {
                  if (!planTitle.trim()) { toast.error("请输入计划名称"); return; }
                  addPlan({ title: planTitle.trim(), subject: "英语", target: planTarget, deadline: planDeadline, progress: 0, createdAt: new Date().toISOString() });
                  setPlanTitle(""); setPlanTarget("");
                  toast.success("学习计划已创建 🎯");
                }}
              >
                创建
              </Button>
            </div>
          </GlassCard>
          <div className="grid gap-4 md:grid-cols-2">
            {plans.length === 0 ? (
              <GlassCard className="md:col-span-2"><EmptyState icon="🎯" text="还没有学习计划" /></GlassCard>
            ) : (
              plans.map((p) => (
                <GlassCard key={p.id} hover>
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{p.title}</h4>
                      <p className="mt-1 text-xs text-blue-200/60">{p.target}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditPlan(p)} className="touch-btn text-xs text-blue-200/40 hover:text-cyan-300">✏️</button>
                      <button onClick={() => setPending({ type: "plan", id: p.id, label: p.title })} className="touch-btn text-blue-200/40 hover:text-red-400">✕</button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar value={p.progress} className="flex-1" />
                    <span className="text-xs text-blue-200/60">{p.progress}%</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-blue-200/50">截止 {p.deadline}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => { updatePlan(p.id, { progress: Math.max(0, p.progress - 10) }); toast.info(`进度 ${Math.max(0, p.progress - 10)}%`); }}>-10%</Button>
                      <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => { const np = Math.min(100, p.progress + 10); updatePlan(p.id, { progress: np }); np >= 100 ? toast.success("🎉 计划完成！") : toast.info(`进度 ${np}%`); }}>+10%</Button>
                    </div>
                  </div>
                  {p.progress >= 100 && <Tag color="green">🎉 已完成</Tag>}
                </GlassCard>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== 学习笔记 ===== */}
      {tab === "notes" && (
        <div className="space-y-4">
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-white">快速记录</h3>
            <div className="space-y-2">
              <Input placeholder="笔记标题" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
              <Textarea rows={3} placeholder="学到的东西，用自己的话写下来…" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} />
              <Button
                onClick={() => {
                  if (!noteTitle.trim()) { toast.error("请输入笔记标题"); return; }
                  toast.success("笔记已保存到知识库 🧠");
                  addNote({
                    title: noteTitle.trim(),
                    content: noteContent,
                    category: "学习笔记",
                    tags: ["学习"],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  });
                  setNoteTitle(""); setNoteContent("");
                }}
              >
                保存到知识库
              </Button>
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="mb-3 text-sm font-semibold text-white">学习笔记（{notes.filter((n) => n.category === "学习笔记").length}）</h3>
            {notes.filter((n) => n.category === "学习笔记").length === 0 ? (
              <EmptyState icon="📝" text="还没有学习笔记，写下的东西才真正属于你" />
            ) : (
              <ul className="space-y-2">
                {notes.filter((n) => n.category === "学习笔记").map((n) => (
                  <li key={n.id} className="group rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <div className="flex gap-2">
                        <button onClick={() => setEditNote(n)} className="touch-btn text-xs text-blue-200/40 hover:text-cyan-300">✏️</button>
                        <button onClick={() => setPending({ type: "note", id: n.id, label: n.title })} className="touch-btn text-blue-200/40 hover:text-red-400">✕</button>
                      </div>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-blue-200/60">{n.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      )}

      {/* ===== 编辑弹窗（记录 / 单词 / 计划 / 笔记） ===== */}
      {editLog && (
        <EditLogModal
          key={editLog.id}
          log={editLog}
          onClose={() => setEditLog(null)}
          onSave={(patch) => { updateLog(editLog.id, patch); toast.success("学习记录已更新"); setEditLog(null); }}
        />
      )}
      {editWord && (
        <EditWordModal
          key={editWord.id}
          word={editWord}
          onClose={() => setEditWord(null)}
          onSave={(patch) => { updateWord(editWord.id, patch); toast.success("单词已更新"); setEditWord(null); }}
        />
      )}
      {editPlan && (
        <EditPlanModal
          key={editPlan.id}
          plan={editPlan}
          onClose={() => setEditPlan(null)}
          onSave={(patch) => { updatePlan(editPlan.id, patch); toast.success("计划已更新"); setEditPlan(null); }}
        />
      )}
      {editNote && (
        <EditNoteModal
          key={editNote.id}
          note={editNote}
          onClose={() => setEditNote(null)}
          onSave={(patch) => { updateNote(editNote.id, { ...patch, updatedAt: new Date().toISOString() }); toast.success("笔记已更新"); setEditNote(null); }}
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

/* ===== 编辑弹窗子组件 ===== */
function EditLogModal({ log, onClose, onSave }: { log: StudyLog; onClose: () => void; onSave: (p: Partial<StudyLog>) => void }) {
  const [subject, setSubject] = useState(log.subject);
  const [minutes, setMinutes] = useState(String(log.minutes));
  const [note, setNote] = useState(log.note ?? "");
  const [date, setDate] = useState(log.date);
  return (
    <Modal open onClose={onClose} title="✏️ 编辑学习记录"
      footer={<><Button variant="ghost" onClick={onClose}>取消</Button><Button onClick={() => {
        const m = parseInt(minutes);
        if (!m || m <= 0) { toast.error("时长无效"); return; }
        onSave({ subject, minutes: m, note, date });
      }}>保存</Button></>}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="科目">
          <Select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full">
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="时长（分钟）"><Input type="number" min="1" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></Field>
      </div>
      <Field label="日期"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="备注"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="学了什么？" /></Field>
    </Modal>
  );
}

function EditWordModal({ word, onClose, onSave }: { word: Word; onClose: () => void; onSave: (p: Partial<Word>) => void }) {
  const [w, setW] = useState(word.word);
  const [phonetic, setPhonetic] = useState(word.phonetic ?? "");
  const [meaning, setMeaning] = useState(word.meaning);
  const [example, setExample] = useState(word.example ?? "");
  return (
    <Modal open onClose={onClose} title="✏️ 编辑单词"
      footer={<><Button variant="ghost" onClick={onClose}>取消</Button><Button onClick={() => {
        if (!w.trim() || !meaning.trim()) { toast.error("单词和释义不能为空"); return; }
        onSave({ word: w.trim(), phonetic, meaning: meaning.trim(), example });
      }}>保存</Button></>}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="单词"><Input value={w} onChange={(e) => setW(e.target.value)} /></Field>
        <Field label="音标"><Input value={phonetic} onChange={(e) => setPhonetic(e.target.value)} /></Field>
      </div>
      <Field label="释义"><Input value={meaning} onChange={(e) => setMeaning(e.target.value)} /></Field>
      <Field label="例句"><Textarea rows={2} value={example} onChange={(e) => setExample(e.target.value)} /></Field>
    </Modal>
  );
}

function EditPlanModal({ plan, onClose, onSave }: { plan: StudyPlan; onClose: () => void; onSave: (p: Partial<StudyPlan>) => void }) {
  const [title, setTitle] = useState(plan.title);
  const [target, setTarget] = useState(plan.target);
  const [deadline, setDeadline] = useState(plan.deadline);
  const [progress, setProgress] = useState(String(plan.progress));
  return (
    <Modal open onClose={onClose} title="✏️ 编辑学习计划"
      footer={<><Button variant="ghost" onClick={onClose}>取消</Button><Button onClick={() => {
        if (!title.trim()) { toast.error("计划名称不能为空"); return; }
        onSave({ title: title.trim(), target, deadline, progress: Math.min(100, Math.max(0, parseInt(progress) || 0)) });
      }}>保存</Button></>}>
      <Field label="计划名称"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="目标描述"><Input value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="截止日期"><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field>
        <Field label="进度（0-100）"><Input type="number" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function EditNoteModal({ note, onClose, onSave }: { note: KnowledgeNote; onClose: () => void; onSave: (p: Partial<KnowledgeNote>) => void }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  return (
    <Modal open onClose={onClose} title="✏️ 编辑笔记"
      footer={<><Button variant="ghost" onClick={onClose}>取消</Button><Button onClick={() => {
        if (!title.trim()) { toast.error("标题不能为空"); return; }
        onSave({ title: title.trim(), content });
      }}>保存</Button></>}>
      <Field label="标题"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="内容"><Textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} /></Field>
    </Modal>
  );
}
