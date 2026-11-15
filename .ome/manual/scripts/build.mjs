/** Render the manual Markdown as printable HTML; output stays under print/. */
import fs from "node:fs";
import { dirname } from "node:path";
const mdPath = process.argv[2];
const outPath = process.argv[3];
const pagesPath = process.argv[4] || "";
const pages = pagesPath ? JSON.parse(fs.readFileSync(pagesPath, "utf8")) : null;
const lines = fs.readFileSync(mdPath, "utf8").split("\n");
const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const inline = s => esc(s).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
const title = lines[0].replace(/^#\s*/,"").trim();
let jStart = 1;
while (jStart < lines.length && !lines[jStart].trim()) jStart++;
let meta = "";
if (jStart < lines.length && lines[jStart].trim().startsWith("版本")) { meta = lines[jStart].trim(); jStart++; }
const h2s = lines.filter(l => l.startsWith("## ")).map(l => l.slice(3).trim());
let html = "";
html += '<div class="cover"><img class="logo" src="../../../Panoptic Super logo.png" alt="品牌标识">';
html += '<div class="cover-kicker">设计说明书</div><h1 class="cover-title">' + inline(title) + '</h1>';
html += '<div class="cover-sub">开源自用、按项目管理、图优先、可演进</div>';
html += '<div class="cover-meta">' + inline(meta) + '</div>';
html += '<div class="cover-foot">本文件描述当前设计，不构成实现完成度声明。</div></div>';
html += '<div class="toc-page"><h2 class="toc-title">目录</h2><ol class="toc">';
h2s.forEach((h, idx) => {
  const num = pages ? String(pages[idx] ?? 0).padStart(2,"0") : "00";
  html += '<li><span class="toc-num">' + String(idx+1).padStart(2,"0") + '</span><span class="toc-text">' + inline(h) + '</span><span class="toc-page-num">' + num + '</span></li>';
});
html += '</ol></div><div class="content">';
let j = jStart, para = [], table = [], inList = false;
const flushPara = () => { if (para.length) { html += '<p>' + inline(para.join("")) + '</p>'; para = []; } };
const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
const flushTable = () => {
  if (!table.length) return;
  const rows = table.filter(r => !/^\|[\s:|-]+\|$/.test(r.trim()));
  html += '<table>';
  rows.forEach((r, idx) => {
    const cells = r.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(c => c.trim());
    const tag = idx === 0 ? "th" : "td";
    html += '<tr>' + cells.map(c => '<' + tag + '>' + inline(c) + '</' + tag + '>').join("") + '</tr>';
  });
  html += '</table>'; table = [];
};
while (j < lines.length) {
  const raw = lines[j], t = raw.trim();
  if (!t) { flushPara(); flushTable(); closeList(); j++; continue; }
  if (t.startsWith("## ")) { flushPara(); flushTable(); closeList(); html += '</div><div class="section"><h2>' + inline(t.slice(3)) + '</h2>'; j++; continue; }
  if (t.startsWith("### ")) { flushPara(); flushTable(); closeList(); html += '<h3>' + inline(t.slice(4)) + '</h3>'; j++; continue; }
  if (t.startsWith("|")) { flushPara(); closeList(); table.push(t); j++; continue; }
  if (t.startsWith("- ")) { flushPara(); flushTable(); if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + inline(t.slice(2)) + '</li>'; j++; continue; }
  if (/^\d+\.\s/.test(t)) { flushPara(); flushTable(); if (!inList) { html += '<ul class="num">'; inList = true; } html += '<li>' + inline(t.replace(/^\d+\.\s/,"")) + '</li>'; j++; continue; }
  if (t.startsWith("<img")) { flushPara(); flushTable(); closeList(); const m = t.match(/src="([^"]+)"[^>]*alt="([^"]*)"/); if (m) { const src = m[1].replace(/^\.\//, "../"); html += '<figure><img src="' + src + '" alt="' + m[2] + '"><figcaption>' + m[2] + '</figcaption></figure>'; } else html += t; j++; continue; }
  flushTable(); closeList(); para.push(t); j++;
}
flushPara(); flushTable(); closeList(); html += '</div>';
const css = fs.readFileSync(process.argv[5] || new URL("./style.css", import.meta.url), "utf8");
fs.mkdirSync(dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>万象超级智能体设计说明书</title><style>' + css + '</style></head><body>' + html + '</body></html>', "utf8");
console.log("built", outPath, "sections", h2s.length);
