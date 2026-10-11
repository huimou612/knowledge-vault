// 从 .next/server/app 构建产物生成可部署的静态站点
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".");
const SRC = path.join(ROOT, ".next", "server", "app");
const STATIC = path.join(ROOT, ".next", "static");
const OUT = path.join(ROOT, "deploy");

// 清理 deploy 目录（跳过 safe-delete，传入已空目录）
// deploy 已由外部清理，此处直接创建

// 复制 _next/static 资源
const nextDir = path.join(OUT, "_next", "static");
fs.mkdirSync(nextDir, { recursive: true });
copyRecursive(STATIC, nextDir);

// 处理页面 HTML（平铺在 .next/server/app/ 下）
const pages = ["index", "tasks", "learning", "media", "xianyu", "knowledge", "ai"];
let count = 0;

for (const p of pages) {
  const srcFile = path.join(SRC, p + ".html");
  if (!fs.existsSync(srcFile)) {
    console.warn("  ⚠️  跳过: " + srcFile);
    continue;
  }
  const dir = p === "index" ? "" : p;
  const pageDir = path.join(OUT, dir);
  fs.mkdirSync(pageDir, { recursive: true });
  fs.copyFileSync(srcFile, path.join(pageDir, "index.html"));
  console.log("  ✅  /" + dir + "/index.html");
  count++;
}

// favicon
const favicon = path.join(ROOT, "public", "favicon.ico");
if (fs.existsSync(favicon)) {
  fs.copyFileSync(favicon, path.join(OUT, "favicon.ico"));
  console.log("  ✅  favicon.ico");
}

// 写 404.html
const notFound = path.join(SRC, "_not-found.html");
if (fs.existsSync(notFound)) {
  fs.copyFileSync(notFound, path.join(OUT, "404.html"));
  console.log("  ✅  404.html");
}

console.log("\n🎉 全部完成！部署目录: " + OUT);
console.log("📁 共 " + countFiles(OUT) + " 个文件（" + count + " 个页面）");

function copyRecursive(src, dest) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function countFiles(dir) {
  let c = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) c += countFiles(path.join(dir, e.name));
    else c++;
  }
  return c;
}
