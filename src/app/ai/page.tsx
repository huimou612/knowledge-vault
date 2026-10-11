"use client";

import { useState, useEffect } from "react";
import { GlassCard, PageHeader, Button, Input, Select, Tag, EmptyState } from "@/components/ui";
import { Markdown } from "@/lib/markdown";
import { generateDailyPlan, generateWeeklyReport, generateAdvice } from "@/lib/ai";
import { getAiConfig, saveAiConfig, callAi, AiConfig } from "@/lib/ai-api";
import { readAllCollections } from "@/lib/store";

type GenType = "daily" | "weekly" | "advice";

const CARDS: { key: GenType; icon: string; title: string; desc: string }[] = [
  {
    key: "daily", icon: "📅",
    title: "生成每日计划",
    desc: "根据今日待办、学习计划、自媒体进度和闲鱼经营状况，自动编排今日行动清单",
  },
  {
    key: "weekly", icon: "📊",
    title: "生成本周周报",
    desc: "汇总本周任务完成率、学习时长、发布作品、闲鱼收入利润，并给出下周建议",
  },
  {
    key: "advice", icon: "🌱",
    title: "成长建议",
    desc: "分析你的打卡连续性、学习投入、副业进展，给出针对性的下一步行动建议",
  },
];

export default function AIPage() {
  const [output, setOutput] = useState("");
  const [currentType, setCurrentType] = useState<GenType | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // API 配置
  const [config, setConfig] = useState<AiConfig>({ provider: "deepseek", apiKey: "", model: "deepseek-chat", enabled: false });

  useEffect(() => {
    setConfig(getAiConfig());
  }, []);

  const saveConfig = () => {
    saveAiConfig(config);
    setShowConfig(false);
  };

  const generate = async (type: GenType) => {
    setLoading(true);
    setCurrentType(type);
    setCopied(false);

    const cfg = getAiConfig();
    const localText = type === "daily" ? generateDailyPlan() : type === "weekly" ? generateWeeklyReport() : generateAdvice();

    if (cfg.enabled && cfg.apiKey) {
      // 用大模型生成
      try {
        const data = readAllCollections();
        const summary = [
          `任务数: ${data.tasks.length}`,
          `已完成: ${data.tasks.filter((t) => t.done).length}`,
          `学习记录: ${data.studyLogs.length}`,
          `单词数: ${data.words.length}`,
          `自媒体作品: ${data.mediaWorks.length}`,
          `闲鱼商品: ${data.products.length}`,
          `订单: ${data.orders.length}`,
          `知识笔记: ${data.notes.length}`,
        ].join(", ");

        const prompt = type === "daily"
          ? `请根据以下数据生成今日计划，包含任务优先级、学习安排、自媒体和闲鱼建议。数据：${summary}`
          : type === "weekly"
          ? `请根据以下数据生成本周复盘周报，包含数据分析、亮点和改进建议。数据：${summary}`
          : `请根据以下数据给出个人成长建议，包含学习方法、习惯养成、副业进展等方面。数据：${summary}`;

        const text = await callAi(prompt, cfg);
        setOutput(text);
      } catch (e: any) {
        setOutput(localText + "\n\n---\n\n⚠️ **AI API 调用失败**：" + e.message + "\n\n以上为本地规则引擎生成结果。");
      }
    } else {
      // 本地规则引擎
      await new Promise((r) => setTimeout(r, 600));
      setOutput(localText);
    }
    setLoading(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI 助手"
        desc="基于你的真实数据，生成每日计划、周报与成长建议"
        extra={
          <Button variant="ghost" onClick={() => setShowConfig(!showConfig)} className="text-xs">
            {config.enabled ? "⚡ AI 已连接" : "🔌 配置 API"}
          </Button>
        }
      />

      {/* API 配置面板 */}
      {showConfig && (
        <GlassCard>
          <h3 className="mb-3 text-sm font-semibold text-white">AI 大模型配置</h3>
          <p className="mb-3 text-xs text-blue-200/60">
            配置后 AI 助手将使用大模型生成内容（更智能）。不配置则使用本地规则引擎（数据不出本机）。
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 md:flex-row">
              <Select value={config.provider} onChange={(e) => setConfig({ ...config, provider: e.target.value as "deepseek" | "openai" })}>
                <option value="deepseek">DeepSeek</option>
                <option value="openai">OpenAI</option>
              </Select>
              <Input
                type="password"
                placeholder={config.provider === "deepseek" ? "DeepSeek API Key (sk-...)" : "OpenAI API Key (sk-...)"}
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="flex-1"
              />
              <Input
                placeholder="模型名（默认 deepseek-chat / gpt-3.5-turbo）"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="md:w-52"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-blue-200/60">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="rounded border-blue-400/30 bg-blue-950/40"
                />
                启用 AI API
              </label>
              <Button onClick={saveConfig}>保存配置</Button>
              <Button variant="ghost" onClick={() => { setShowConfig(false); setConfig({ provider: "deepseek", apiKey: "", model: "deepseek-chat", enabled: false }); }}>
                清除
              </Button>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-200/40">
            <p>💡 API Key 仅保存在浏览器本地（localStorage），不会上传到服务器。</p>
            <p>DeepSeek 注册: platform.deepseek.com / OpenAI: platform.openai.com</p>
          </div>
        </GlassCard>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {CARDS.map((c) => (
          <button
            key={c.key}
            onClick={() => generate(c.key)}
            className={`glass glass-hover rounded-2xl bg-gradient-to-br p-5 text-left transition-all ${
              currentType === c.key ? "ring-2 ring-cyan-400/50" : ""
            }`}
          >
            <span className="text-3xl">{c.icon}</span>
            <h3 className="mt-3 font-semibold text-white">{c.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-blue-200/60">{c.desc}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-cyan-400">点击生成 →</span>
              {config.enabled && <Tag color="cyan">API</Tag>}
            </div>
          </button>
        ))}
      </div>

      <GlassCard className="min-h-64">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="mt-4 text-sm text-blue-200/60">
              {config.enabled ? "AI 正在思考…" : "正在分析你的数据…"}
            </p>
            {config.enabled && <p className="mt-1 text-xs text-blue-200/40">调用 {config.provider} API</p>}
          </div>
        ) : output ? (
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-blue-400/10 pb-3">
              <h3 className="text-sm font-semibold text-white">
                {CARDS.find((c) => c.key === currentType)?.icon} 生成结果
                <span className="ml-2 text-[10px] text-blue-200/40">
                  ({config.enabled ? "AI API" : "本地规则引擎"})
                </span>
              </h3>
              <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={copy}>
                {copied ? "✓ 已复制" : "复制"}
              </Button>
            </div>
            <Markdown text={output} />
          </div>
        ) : (
          <EmptyState icon="✦" text="点击上方卡片，AI 将基于你的数据生成内容" />
        )}
      </GlassCard>
    </div>
  );
}
