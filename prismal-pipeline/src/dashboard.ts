// Dashboard generator -- parses newsletter markdown, generates all platform outputs
import * as fs from "fs";
import * as path from "path";
import type { NewsletterData } from "./platform-formatters.js";
import {
  formatSubstack,
  formatX,
  formatXThread,
  formatTikTok,
  formatBeeHiiv,
  type PlatformOutput,
} from "./platform-formatters.js";

export { formatSubstack, formatX, formatXThread, formatTikTok, formatBeeHiiv };
export type { NewsletterData, PlatformOutput };

// ── Markdown Parser ─────────────────────────────────────────────────────────

export function parseNewsletter(md: string, issueNumber: number = 1): NewsletterData {
  const lines = md.split("\n");

  // Extract date from header
  const dateMatch = md.match(/###\s+([^·]+)·\s+Issue\s+(\d+)/);
  const date = dateMatch ? dateMatch[1].trim() : new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const dateIso = new Date().toISOString().slice(0, 10);

  // Extract headline (first paragraph after header)
  const hook = extractSection(md, /^# PRISMAL$/m, /^## /m)?.trim() || "";
  const bigStory = extractSection(md, /^## THE BIG STORY$/mi, /^## (TECH|FINANCE|GEOPOLITICS|WHAT TO WATCH|BY THE NUMBERS|SIGNALS)/mi) || "";

  // Parse each section
  const techStories = parseStoryList(md, /^## TECH$/mi, /^## (FINANCE|GEOPOLITICS|WHAT TO WATCH)/mi);
  const financeStories = parseStoryList(md, /^## FINANCE$/mi, /^## (GEOPOLITICS|WHAT TO WATCH|BY THE NUMBERS)/mi);
  const geopoliticsStories = parseStoryList(md, /^## GEOPOLITICS$/mi, /^## (WHAT TO WATCH|BY THE NUMBERS)/mi);
  const whatToWatch = parseBulletList(md, /^## WHAT TO WATCH$/mi, /^## /mi);
  const byTheNumbers = parseBulletList(md, /^## BY THE NUMBERS$/mi, /^## |^---$/mi);
  const signalsFromTheEdge = parseSignals(md);

  return {
    date,
    dateIso,
    issueNumber,
    headline: hook.slice(0, 120),
    hook: hook.slice(0, 300),
    bigStory,
    techStories,
    financeStories,
    geopoliticsStories,
    whatToWatch,
    byTheNumbers,
    signalsFromTheEdge,
    subscribeUrl: "https://prismal.beehiiv.com",
  };
}

function extractSection(md: string, startRx: RegExp, endRx: RegExp): string {
  const lines = md.split("\n");
  let inSection = false;
  const result: string[] = [];
  for (const line of lines) {
    if (startRx.test(line)) { inSection = true; continue; }
    if (inSection && endRx.test(line)) break;
    if (inSection) result.push(line);
  }
  return result.join("\n").replace(/^#+\s+/gm, "").trim();
}

function parseStoryList(md: string, startRx: RegExp, endRx: RegExp): { title: string; summary: string }[] {
  const section = extractSection(md, startRx, endRx);
  const stories: { title: string; summary: string }[] = [];
  const parts = section.split(/^###\s+/m).filter(Boolean);
  for (const part of parts) {
    const lines = part.split("\n").filter(l => l.trim());
    const title = lines[0]?.replace(/\*\*/g, "").trim() || "";
    const summary = lines.slice(1).join(" ").replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim().slice(0, 300);
    if (title) stories.push({ title, summary });
  }
  return stories;
}

function parseBulletList(md: string, startRx: RegExp, endRx: RegExp): string[] {
  const section = extractSection(md, startRx, endRx);
  return section
    .split("\n")
    .map(l => l.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").replace(/\*\*(.*?)\*\*/g, "$1").trim())
    .filter(l => l.length > 5);
}

function parseSignals(md: string): { title: string; content: string }[] {
  const section = extractSection(md, /^## SIGNALS FROM THE EDGE$/mi, /^---$/m);
  const signals: { title: string; content: string }[] = [];
  const parts = section.split(/\*\*([^*]+)\*\*/).filter(Boolean);
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i]?.trim() || "";
    const content = parts[i + 1]?.replace(/\*$/, "").trim() || "";
    if (title) signals.push({ title, content });
  }
  return signals;
}

// ── HTML Dashboard ────────────────────────────────────────────────────────────

export function buildDashboard(
  data: NewsletterData,
  outputs: PlatformOutput[],
  mdSource: string,
  beehiivHtml: string
): string {
  const dateStr = data.date.replace(/, /g, "-").replace(/ /g, "-");

  const platformCards = outputs.map(o => {
    const statusColor = o.overLimit ? "#e74c3c" : "#27ae60";
    const statusLabel = o.overLimit ? "OVER LIMIT" : "OK";
    const charDisplay = isFinite(o.characterLimit) ? `${o.characterCount}/${o.characterLimit}` : `${o.characterCount} chars`;

    let contentDisplay: string;
    if (o.platform === "beehiiv") {
      contentDisplay = `<button class="copy-btn" onclick="copyBeehiiv()">Copy HTML to clipboard</button>
      <textarea id="beehiiv-html" class="content-textarea" style="display:none">${escapeHtml(beehiivHtml)}</textarea>`;
    } else {
      contentDisplay = `<textarea class="content-textarea" rows="${Math.min(12, Math.ceil(o.content.length / 80))}" readonly>${escapeHtml(o.content)}</textarea>
      <button class="copy-btn" onclick="copyText(${JSON.stringify(o.platform)})">Copy to clipboard</button>`;
    }

    const hashtagHtml = o.hashtags.length > 0
      ? `<div class="hashtags">${o.hashtags.map(t => `<span class="hashtag">#${t}</span>`).join(" ")}</div>`
      : "";

    return `
    <div class="platform-card">
      <div class="platform-header">
        <div class="platform-name">${o.platformName}</div>
        <div class="char-count" style="color: ${statusColor}">${charDisplay} -- ${statusLabel}</div>
      </div>
      ${hashtagHtml}
      <div class="content-area">
        ${contentDisplay}
      </div>
    </div>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prismal -- ${data.date} -- Issue ${data.issueNumber} -- Distribution Dashboard</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e4e4e7; min-height: 100vh; padding: 24px; }
  a { color: #6C5CE7; }
  h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .subtitle { color: #71717a; font-size: 13px; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(520px, 1fr)); gap: 20px; }
  .platform-card { background: #1a1a24; border: 1px solid #2a2a3a; border-radius: 12px; padding: 20px; }
  .platform-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .platform-name { font-size: 15px; font-weight: 600; color: #f4f4f5; }
  .char-count { font-size: 12px; font-weight: 500; }
  .hashtags { margin-bottom: 12px; }
  .hashtag { display: inline-block; background: #2a2a3a; color: #a78bfa; font-size: 12px; padding: 3px 8px; border-radius: 4px; margin-right: 4px; margin-bottom: 4px; }
  .content-area { }
  .content-textarea { width: 100%; background: #111; border: 1px solid #2a2a3a; border-radius: 8px; padding: 12px; color: #d4d4d8; font-size: 13px; font-family: 'SF Mono', 'Fira Code', monospace; resize: vertical; line-height: 1.5; }
  .copy-btn { margin-top: 10px; background: #6C5CE7; color: white; border: none; border-radius: 6px; padding: 8px 16px; font-size: 13px; cursor: pointer; }
  .copy-btn:hover { background: #5a4ad1; }
  .newsletter-preview { background: #1a1a24; border: 1px solid #2a2a3a; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
  .newsletter-preview h2 { font-size: 16px; margin-bottom: 12px; color: #a78bfa; }
  .newsletter-preview p { font-size: 14px; line-height: 1.7; color: #a1a1aa; margin-bottom: 10px; }
  .newsletter-preview .section { margin: 16px 0; }
  .newsletter-preview .section-title { font-size: 13px; font-weight: 600; color: #6C5CE7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .newsletter-preview ul { padding-left: 20px; }
  .newsletter-preview li { font-size: 13px; color: #a1a1aa; margin-bottom: 4px; }
  .notification { position: fixed; bottom: 24px; right: 24px; background: #27ae60; color: white; padding: 12px 20px; border-radius: 8px; font-size: 14px; display: none; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #71717a; margin-right: 8px; }
</style>
</head>
<body>

<div class="newsletter-preview">
  <h2>Issue ${data.issueNumber} -- ${data.date} -- Source Newsletter</h2>
  <p><strong>Headline:</strong> ${escapeHtml(data.headline)}</p>
  <div class="section">
    <div class="section-title">Hook</div>
    <p>${escapeHtml(data.hook.slice(0, 300))}</p>
  </div>
  <div class="section">
    <div class="section-title">Big Story</div>
    <p>${escapeHtml(data.bigStory.slice(0, 400))}${data.bigStory.length > 400 ? "..." : ""}</p>
  </div>
  <div class="section">
    <div class="section-title">Platform Outputs Generated</div>
    <ul>
      ${outputs.map(o => `<li>${o.platformName}: ${o.content.length} chars ${o.overLimit ? "(OVER LIMIT -- needs trimming)" : ""}</li>`).join("")}
    </ul>
  </div>
</div>

<div class="grid">
${platformCards}
</div>

<div class="notification" id="notification">Copied!</div>

<script>
let clipboardBeehiiv = ${JSON.stringify(beehiivHtml)};

async function copyText(platform) {
  const outputs = ${JSON.stringify(outputs.map(o => ({ platform: o.platform, content: o.copyText })))};
  const output = outputs.find(o => o.platform === platform);
  if (!output) return;
  try {
    await navigator.clipboard.writeText(output.content);
    showNotification('Copied ' + platform + '!');
  } catch(e) {
    prompt('Copy this text:', output.content);
  }
}

async function copyBeehiiv() {
  const el = document.getElementById('beehiiv-html');
  if (!el) return;
  el.style.display = 'block';
  el.select();
  try {
    await navigator.clipboard.writeText(el.value);
    showNotification('BeeHiiv HTML copied!');
  } catch(e) {
    document.execCommand('copy');
    showNotification('BeeHiiv HTML copied!');
  }
  el.style.display = 'none';
}

function showNotification(msg) {
  const n = document.getElementById('notification');
  n.textContent = msg;
  n.style.display = 'block';
  setTimeout(() => { n.style.display = 'none'; }, 2000);
}
</script>

</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── CLI ──────────────────────────────────────────────────────────────────────

export function generateDashboard(
  mdPath: string,
  outputDir: string,
  issueNumber: number = 1
): { dashboardPath: string; outputs: PlatformOutput[]; beehiivHtml: string } {
  const md = fs.readFileSync(mdPath, "utf8");
  const data = parseNewsletter(md, issueNumber);
  const beehiivFormatted = formatBeeHiiv(data);
  const beehiivHtml = beehiivFormatted.content;

  const outputs: PlatformOutput[] = [
    formatSubstack(data),
    formatX(data),
    formatXThread(data),
    formatTikTok(data),
    beehiivFormatted,
  ];

  const dashboard = buildDashboard(data, outputs, md, beehiivHtml);
  const dateSlug = data.dateIso;
  const dashboardPath = path.join(outputDir, `dashboard-${dateSlug}.html`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(dashboardPath, dashboard, "utf8");

  // Save individual platform outputs as text files
  for (const output of outputs) {
    const ext = output.platform === "beehiiv" ? "html" : "txt";
    const outPath = path.join(outputDir, `${output.platform}-${dateSlug}.${ext}`);
    fs.writeFileSync(outPath, output.content, "utf8");
  }

  return { dashboardPath, outputs, beehiivHtml };
}
