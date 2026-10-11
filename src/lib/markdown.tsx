// ===== 极简 Markdown 渲染器（标题/加粗/斜体/列表/引用/代码/链接） =====
import React from "react";

function inline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let rest = text;
  let k = 0;
  const patterns: { re: RegExp; render: (m: RegExpMatchArray) => React.ReactNode }[] = [
    { re: /`([^`]+)`/, render: (m) => <code key={k++} className="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em] text-cyan-300">{m[1]}</code> },
    { re: /\*\*([^*]+)\*\*/, render: (m) => <strong key={k++} className="font-semibold text-white">{m[1]}</strong> },
    { re: /\*([^*]+)\*/, render: (m) => <em key={k++} className="text-zinc-300">{m[1]}</em> },
    { re: /\[([^\]]+)\]\(([^)]+)\)/, render: (m) => <a key={k++} href={m[2]} target="_blank" className="text-violet-400 underline underline-offset-2">{m[1]}</a> },
  ];
  while (rest.length > 0) {
    let earliest: { idx: number; m: RegExpMatchArray; render: (m: RegExpMatchArray) => React.ReactNode } | null = null;
    for (const p of patterns) {
      const m = rest.match(p.re);
      if (m && m.index !== undefined && (!earliest || m.index < earliest.idx)) {
        earliest = { idx: m.index, m, render: p.render };
      }
    }
    if (!earliest) {
      nodes.push(rest);
      break;
    }
    if (earliest.idx > 0) nodes.push(rest.slice(0, earliest.idx));
    nodes.push(earliest.render(earliest.m));
    rest = rest.slice(earliest.idx + earliest.m[0].length);
  }
  return nodes;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];

  const flushList = (key: number) => {
    if (list.length) {
      out.push(
        <ul key={"ul" + key} className="my-2 list-disc space-y-1 pl-5 text-zinc-300">
          {list.map((li, i) => <li key={i}>{inline(li)}</li>)}
        </ul>
      );
      list = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        out.push(
          <pre key={"pre" + i} className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-cyan-200">
            <code>{codeBuf.join("\n")}</code>
          </pre>
        );
        codeBuf = [];
        inCode = false;
      } else {
        flushList(i);
        inCode = true;
      }
      return;
    }
    if (inCode) { codeBuf.push(line); return; }

    if (/^###\s/.test(line)) { flushList(i); out.push(<h3 key={i} className="mt-4 mb-1 text-base font-semibold text-white">{inline(line.replace(/^###\s/, ""))}</h3>); }
    else if (/^##\s/.test(line)) { flushList(i); out.push(<h2 key={i} className="mt-4 mb-1 text-lg font-semibold text-white">{inline(line.replace(/^##\s/, ""))}</h2>); }
    else if (/^#\s/.test(line)) { flushList(i); out.push(<h1 key={i} className="mt-4 mb-2 text-xl font-bold text-white">{inline(line.replace(/^#\s/, ""))}</h1>); }
    else if (/^>\s?/.test(line)) { flushList(i); out.push(<blockquote key={i} className="my-2 border-l-2 border-violet-500/60 pl-3 text-zinc-400 italic">{inline(line.replace(/^>\s?/, ""))}</blockquote>); }
    else if (/^[-*]\s/.test(line)) { list.push(line.replace(/^[-*]\s/, "")); }
    else if (/^\d+\.\s/.test(line)) { flushList(i); out.push(<p key={i} className="my-1 pl-2 text-zinc-300">{inline(line)}</p>); }
    else if (line.trim() === "") { flushList(i); out.push(<div key={i} className="h-2" />); }
    else { flushList(i); out.push(<p key={i} className="my-1 leading-relaxed text-zinc-300">{inline(line)}</p>); }
  });
  flushList(99999);

  return <div className="text-sm">{out}</div>;
}
