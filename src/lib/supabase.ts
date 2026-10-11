// ===== Supabase 客户端 =====
// 在 .env.local 中填入以下两个变量即可启用云端数据库：
//   NEXT_PUBLIC_SUPABASE_URL=你的项目URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon key
// 未配置时应用自动使用 localStorage，功能完全一致。
// 数据库表结构见 supabase/schema.sql，在 Supabase SQL 编辑器中执行即可。

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createClient(url, key);
  return client;
}

export const isCloudEnabled = () => getSupabase() !== null;
