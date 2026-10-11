// ===== 大模型 API 调用（DeepSeek / OpenAI 兼容接口） =====
// 默认使用本地规则引擎，配置 API Key 后自动升级为 AI 生成

const STORAGE_KEY = "kv_ai_config";

export interface AiConfig {
  provider: "deepseek" | "openai";
  apiKey: string;
  model: string;
  enabled: boolean;
}

export function getAiConfig(): AiConfig {
  if (typeof window === "undefined") return { provider: "deepseek", apiKey: "", model: "deepseek-chat", enabled: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { provider: "deepseek", apiKey: "", model: "deepseek-chat", enabled: false };
}

export function saveAiConfig(config: AiConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearAiConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

/** 调用大模型 API */
export async function callAi(prompt: string, config?: AiConfig): Promise<string> {
  const cfg = config ?? getAiConfig();
  if (!cfg.enabled || !cfg.apiKey) {
    throw new Error("AI API 未配置");
  }

  const baseUrl = cfg.provider === "deepseek"
    ? "https://api.deepseek.com/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  const model = cfg.provider === "deepseek" ? (cfg.model || "deepseek-chat") : (cfg.model || "gpt-3.5-turbo");

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "你是一个个人成长助手，基于用户的真实数据生成每日计划、周报和成长建议。" +
            "回答简洁、有条理，使用中文。可以适当地用 emoji 增加可读性。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API 错误 (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "AI 返回为空";
}
