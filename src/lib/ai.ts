// ===== AI 助手：基于用户本地数据生成计划 / 周报 / 建议 =====
// 本地规则引擎，无需 API Key 即可使用。
// 如需接入大模型，可在此处替换为对 OpenAI / 其他 LLM API 的调用。

import { readAllCollections } from "./store";
import { todayStr, lastNDays, calcStreak, minutesToText, money } from "./utils";

const platformName: Record<string, string> = {
  xiaohongshu: "小红书",
  douyin: "抖音",
  gongzhonghao: "公众号",
};

export function generateDailyPlan(): string {
  const { tasks, plans, words, mediaWorks, products } = readAllCollections();
  const today = todayStr();
  const todayTasks = tasks.filter((t) => t.date === today && !t.done);
  const overdue = tasks.filter((t) => t.date < today && !t.done);
  const activePlans = plans.filter((p) => p.progress < 100);
  const unmastered = words.filter((w) => !w.mastered).length;
  const inProgress = mediaWorks.filter((m) => m.status === "drafting" || m.status === "ready");
  const onSale = products.filter((p) => p.status === "on-sale").length;

  const lines: string[] = [`# 📅 ${today} 每日计划`, ""];
  lines.push("## 🎯 今日待办");
  if (todayTasks.length === 0 && overdue.length === 0) {
    lines.push("- 今日暂无待办任务，建议去「任务管理」规划 3 件最重要的事。");
  } else {
    overdue.slice(0, 3).forEach((t) => lines.push(`- ⚠️ 【逾期】${t.title}（${t.category}）`));
    todayTasks
      .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
      .forEach((t) => lines.push(`- ${t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "⚪"} ${t.title}（${t.category}）`));
  }
  lines.push("", "## 📚 学习安排");
  activePlans.slice(0, 2).forEach((p) => lines.push(`- 推进「${p.title}」：当前进度 ${p.progress}%，今天至少投入 30 分钟`));
  if (unmastered > 0) lines.push(`- 复习单词本中 ${Math.min(unmastered, 20)} 个未掌握单词`);
  lines.push("", "## 📱 自媒体 & 闲鱼");
  inProgress.forEach((m) => lines.push(`- ${m.status === "ready" ? "发布" : "继续创作"}${platformName[m.platform]}作品《${m.title}》`));
  lines.push(`- 检查闲鱼在售商品（当前 ${onSale} 件在售），及时回复买家消息`);
  lines.push("", "> 💡 建议：把最难的任务放在上午精力最好的时段完成（吃掉那只青蛙）。");
  return lines.join("\n");
}

export function generateWeeklyReport(): string {
  const { tasks, checkins, studyLogs, mediaWorks, orders, notes, words } = readAllCollections();
  const week = lastNDays(7);
  const weekSet = new Set(week);

  const done = tasks.filter((t) => t.done && t.doneAt && weekSet.has(t.doneAt));
  const created = tasks.filter((t) => weekSet.has(t.date));
  const minutes = studyLogs.filter((l) => weekSet.has(l.date)).reduce((s, l) => s + l.minutes, 0);
  const bySubject: Record<string, number> = {};
  studyLogs.filter((l) => weekSet.has(l.date)).forEach((l) => (bySubject[l.subject] = (bySubject[l.subject] || 0) + l.minutes));
  const published = mediaWorks.filter((m) => m.status === "published" && m.publishDate && weekSet.has(m.publishDate));
  const weekOrders = orders.filter((o) => weekSet.has(o.date) && o.status === "completed");
  const income = weekOrders.reduce((s, o) => s + o.price * o.quantity, 0);
  const profit = weekOrders.reduce((s, o) => s + (o.price - o.cost) * o.quantity, 0);
  const newNotes = notes.filter((n) => weekSet.has(n.createdAt.slice(0, 10)));
  const newWords = words.filter((w) => weekSet.has(w.createdAt.slice(0, 10)));
  const streak = calcStreak(checkins.map((c) => c.date));

  const lines: string[] = [`# 📊 周报（${week[0]} ~ ${week[6]}）`, ""];
  lines.push("## ✅ 任务");
  lines.push(`- 完成任务 ${done.length} 个 / 计划 ${created.length} 个，完成率 ${created.length ? Math.round((done.length / created.length) * 100) : 0}%`);
  lines.push(`- 当前连续打卡 **${streak} 天**`);
  lines.push("", "## 📚 学习");
  lines.push(`- 总学习时长：**${minutesToText(minutes)}**`);
  Object.entries(bySubject).forEach(([s, m]) => lines.push(`  - ${s}：${minutesToText(m)}`));
  lines.push(`- 新学单词 ${newWords.length} 个`);
  lines.push("", "## 📱 自媒体");
  if (published.length === 0) lines.push("- 本周未发布作品，下周至少安排 1 篇。");
  published.forEach((m) => lines.push(`- ${platformName[m.platform]}《${m.title}》：阅读 ${m.views ?? 0} / 赞 ${m.likes ?? 0} / 藏 ${m.collects ?? 0}`));
  lines.push("", "## 💰 闲鱼收入");
  lines.push(`- 订单 ${weekOrders.length} 笔，收入 **${money(income)}**，利润 **${money(profit)}**`);
  lines.push("", "## 🧠 知识沉淀");
  lines.push(`- 新增笔记 ${newNotes.length} 篇`);
  newNotes.slice(0, 3).forEach((n) => lines.push(`  - 《${n.title}》`));
  lines.push("", "## 🚀 下周建议");
  if (done.length < created.length * 0.6) lines.push("- 任务完成率偏低：减少每日任务数量，聚焦 3 件要事。");
  if (minutes < 300) lines.push("- 学习时长不足 5 小时：固定每天一个不被打扰的学习时段。");
  if (published.length < 2) lines.push("- 提高发布频率：选题库中挑最容易的一篇先做。");
  lines.push("- 保持打卡，连续性比强度更重要。");
  return lines.join("\n");
}

export function generateAdvice(): string {
  const { tasks, checkins, studyLogs, orders, mediaWorks, words, notes } = readAllCollections();
  const today = todayStr();
  const week = new Set(lastNDays(7));
  const streak = calcStreak(checkins.map((c) => c.date));
  const doneToday = tasks.filter((t) => t.date === today && t.done).length;
  const totalToday = tasks.filter((t) => t.date === today).length;
  const minutes = studyLogs.filter((l) => week.has(l.date)).reduce((s, l) => s + l.minutes, 0);
  const profit = orders.filter((o) => week.has(o.date)).reduce((s, o) => s + (o.price - o.cost) * o.quantity, 0);
  const published = mediaWorks.filter((m) => m.status === "published").length;
  const unmastered = words.filter((w) => !w.mastered).length;

  const tips: { icon: string; title: string; body: string }[] = [];

  tips.push(streak >= 7
    ? { icon: "🔥", title: "连续性极佳", body: `已连续打卡 ${streak} 天。可以把目标从「坚持」升级为「加量」，例如每天多学 15 分钟。` }
    : { icon: "⏰", title: "先建立连续性", body: `当前连续打卡 ${streak} 天。建议设置固定提醒，打卡门槛放低（完成 1 个任务即可），先求不断。` });

  tips.push(totalToday > 0 && doneToday / totalToday >= 0.8
    ? { icon: "✅", title: "执行力在线", body: "今日任务完成率很高，可以在复盘中记录「今天做对了什么」，把成功模式固化。" }
    : { icon: "🎯", title: "聚焦要事", body: "任务完成率有提升空间。每天只定 3 个关键任务，其余放入「可选」清单。" });

  tips.push(minutes >= 420
    ? { icon: "📚", title: "学习投入充足", body: `本周已学习 ${minutesToText(minutes)}。建议增加「输出」环节：把学到的内容写成知识库笔记或自媒体选题。` }
    : { icon: "📖", title: "学习时长待提升", body: `本周学习 ${minutesToText(minutes)}。试试「25 分钟番茄钟 + 5 分钟休息」，先从小块时间开始。` });

  if (unmastered > 10) tips.push({ icon: "🔤", title: "单词需要滚动复习", body: `单词本有 ${unmastered} 个未掌握单词。按艾宾浩斯曲线，今天复习比背新词更重要。` });

  tips.push(profit > 0
    ? { icon: "💰", title: "副业已跑通", body: `本周利润 ${money(profit)}。下一步：分析哪类商品转化最好，加大上新与标题优化。` }
    : { icon: "🛍️", title: "闲鱼冷启动建议", body: "本周暂无利润。优先上架 3-5 个虚拟资料类商品测试流量，标题埋入用户会搜索的关键词。" });

  tips.push(published >= 5
    ? { icon: "📱", title: "进入数据驱动阶段", body: `已发布 ${published} 篇作品。每周做一次数据复盘，找到阅读/点赞比最高的选题方向，批量复制。` }
    : { icon: "✍️", title: "先完成再完美", body: `目前发布 ${published} 篇作品。前 10 篇以「完成」为目标，不要纠结数据，积累手感最重要。` });

  if (notes.length < 5) tips.push({ icon: "🧠", title: "让知识流动起来", body: "知识库笔记还比较少。建议每学完一个主题就写一篇 200 字小结，用自己的话复述。" });

  return ["# 🌱 成长建议", "", ...tips.flatMap((t) => [`## ${t.icon} ${t.title}`, t.body, ""])].join("\n");
}
