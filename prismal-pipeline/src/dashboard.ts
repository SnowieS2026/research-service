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
  // Extract date from header
  const dateMatch = md.match(/###\s+([^·]+)·\s+Issue\s+(\d+)/);
  const date = dateMatch ? dateMatch[1].trim() : new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const dateIso = new Date().toISOString().slice(0, 10);

  // Extract all sections
  function extract(rawMd: string, startRx: RegExp, endRx: RegExp): string {
    const rawLines = rawMd.split("\n");
    let inSection = false;
    const result: string[] = [];
    for (const line of rawLines) {
      if (startRx.test(line)) { inSection = true; continue; }
      if (inSection && endRx.test(line)) break;
      if (inSection) result.push(line);
    }
    return result.join("\n").replace(/^#+\s+/gm, "").trim();
  }

  function parseStories(rawMd: string, startRx: RegExp, endRx: RegExp): { title: string; summary: string }[] {
    const section = extract(rawMd, startRx, endRx);
    const stories: { title: string; summary: string }[] = [];
    const parts = section.split(/^###\s+/m).filter(Boolean);
    for (const part of parts) {
      const partLines = part.split("\n").filter(l => l.trim());
      const title = partLines[0]?.replace(/\*\*/g, "").trim() || "";
      const summary = partLines.slice(1).join(" ").replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim().slice(0, 2000);
      if (title) stories.push({ title, summary });
    }
    return stories;
  }

  function parseBullets(rawMd: string, startRx: RegExp, endRx: RegExp): string[] {
    const section = extract(rawMd, startRx, endRx);
    return section
      .split("\n")
      .map(l => l.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").replace(/\*\*(.*?)\*\*/g, "$1").trim())
      .filter(l => l.length > 5);
  }

  function parseSignals(rawMd: string): { title: string; content: string }[] {
    // Don't use extract() -- it strips ### markers. Work on raw lines from the
    // raw markdown so we can detect title lines vs content lines.
    const rawLines = rawMd.split("\n");
    let inSignals = false;
    const signals: { title: string; content: string }[] = [];
    let currentTitle = "";
    const contentLines: string[] = [];

    for (const line of rawLines) {
      if (/^## SIGNALS FROM THE EDGE$/mi.test(line)) { inSignals = true; continue; }
      if (inSignals && /^---/.test(line)) break; // end of section
      if (!inSignals) continue;

      const trimmed = line.trim();

      // A title line: non-blank, starts without markdown list chars or common prefixes
      // In the raw md, titles are ### lines
      if (trimmed.startsWith("### ")) {
        // Save previous signal if we have one
        if (currentTitle && contentLines.length > 0) {
          signals.push({
            title: currentTitle.replace(/^#{1,6}\s+/, "").replace(/\*\*/g, "").trim(),
            content: contentLines.join(" ").replace(/\*\*/g, "").replace(/\*/g, "").trim(),
          });
        }
        currentTitle = trimmed;
        contentLines.length = 0;
      } else if (trimmed && !trimmed.startsWith("#")) {
        // Content line
        contentLines.push(trimmed);
      } else if (trimmed === "") {
        // Blank line -- could be separating title from content or between signals
        // Just skip it; contentLines handles multi-line paragraphs
      }
    }

    // Save last signal
    if (currentTitle && contentLines.length > 0) {
      signals.push({
        title: currentTitle.replace(/^#{1,6}\s+/, "").replace(/\*\*/g, "").trim(),
        content: contentLines.join(" ").replace(/\*\*/g, "").replace(/\*/g, "").trim(),
      });
    }

    return signals;
  }

  function extractHook(rawMd: string): string {
    const rawLines = rawMd.split("\n");
    let inHook = false;
    const result: string[] = [];
    for (const line of rawLines) {
      if (/^#{1,3}\s+[^#]/.test(line) && !line.startsWith("# PRISMAL")) { inHook = true; continue; }
      if (inHook && line.startsWith("#")) break;
      if (inHook && line.trim()) result.push(line.trim());
      if (inHook && result.length >= 2) break;
    }
    return result.join(" ").replace(/\*\*/g, "").slice(0, 300);
  }

  // Headline: from THE BIG STORY ### heading, or first sentence of hook
  const bigStorySection = extract(md, /^## THE BIG STORY$/mi, /^## (TECH|FINANCE|GEOPOLITICS)/mi);
  const bigStoryHeadline = (bigStorySection.match(/^###\s+(.+)/m)?.[1] || "").replace(/\*\*/g, "").trim();
  const hook = extractHook(md);
  const hookFirstSentence = (hook.match(/^[^.!?]+[.!?]/) || [hook])[0].trim();
  const headline = bigStoryHeadline || hookFirstSentence.replace(/^#+\s*/, "").slice(0, 120);
  const bigStory = bigStorySection.replace(/^###\s+.+\n?/, "").trim() || hook;

  const techStories = parseStories(md, /^## TECH$/mi, /^## (FINANCE|GEOPOLITICS|WHAT TO WATCH)/mi);
  const financeStories = parseStories(md, /^## FINANCE$/mi, /^## (GEOPOLITICS|WHAT TO WATCH|BY THE NUMBERS)/mi);
  const geopoliticsStories = parseStories(md, /^## GEOPOLITICS$/mi, /^## (WHAT TO WATCH|BY THE NUMBERS)/mi);
  const whatToWatch = parseBullets(md, /^## WHAT TO WATCH$/mi, /^## /mi);
  const byTheNumbers = parseBullets(md, /^## BY THE NUMBERS$/mi, /^## |^---$/mi);
  const signalsFromTheEdge = parseSignals(md);

  return {
    date,
    dateIso,
    issueNumber,
    headline,
    hook,
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

// ── HTML Dashboard ────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Convert basic markdown to styled HTML for display
function mdToHtml(text: string): string {
  // Split into blocks on double newlines
  const blocks = text.split(/\n\n+/);
  const htmlBlocks: string[] = [];
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    // Horizontal rule
    if (trimmed === "---") { htmlBlocks.push("<hr style='border:none;border-top:1px solid #333;margin:16px 0;'>"); continue; }
    // ATX-style headers (#### to #)
    const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const sizes = [0, "28px", "22px", "18px", "16px"];
      const size = sizes[level] || "16px";
      htmlBlocks.push(`<h${level} style='font-size:${size};font-weight:700;color:#e4e4e7;margin:0 0 10px;'>${content}</h${level}>`);
      continue;
    }
    // Bullet list items
    const lines = trimmed.split("\n");
    if (lines.every(l => l.match(/^[-*]\s/))) {
      const items = lines.map(l => `<li style='margin-bottom:6px;'>${inlineFormat(l.replace(/^[-*]\s/, ""))}</li>`).join("");
      htmlBlocks.push(`<ul style='padding-left:20px;margin:0 0 10px;'>${items}</ul>`);
      continue;
    }
    // Numbered list
    if (lines.every(l => l.match(/^\d+\.\s/))) {
      const items = lines.map(l => `<li style='margin-bottom:6px;'>${inlineFormat(l.replace(/^\d+\.\s/, ""))}</li>`).join("");
      htmlBlocks.push(`<ol style='padding-left:20px;margin:0 0 10px;'>${items}</ol>`);
      continue;
    }
    // Paragraph
    htmlBlocks.push(`<p style='margin:0 0 10px;line-height:1.7;'>${inlineFormat(trimmed)}</p>`);
  }
  return htmlBlocks.join("");
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong style='color:#f4f4f5;'>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code style='background:#111;padding:2px 6px;border-radius:4px;'>$1</code>")
    .replace(/\n/g, "<br>");
}

export function buildDashboard(
  data: NewsletterData,
  outputs: PlatformOutput[],
  beehiivHtml: string
): string {
  const substackOutput = outputs.find(o => o.platform === "substack")!;
  const xOutput = outputs.find(o => o.platform === "x")!;
  const xThreadOutput = outputs.find(o => o.platform === "x-thread")!;
  const tiktokOutput = outputs.find(o => o.platform === "tiktok")!;
  const beehiivOutput = outputs.find(o => o.platform === "beehiiv")!;

  function renderTextarea(platform: string, label: string, charCount: number, limit: number, overLimit: boolean) {
    const output = outputs.find(o => o.platform === platform)!;
    const statusColor = overLimit ? "#e74c3c" : "#27ae60";
    const statusLabel = overLimit ? "OVER LIMIT" : "OK";
    const displayCount = isFinite(limit) ? `${charCount}/${limit}` : `${charCount} chars`;
    return `
    <div class="platform-section">
      <div class="platform-section-header">
        <div class="platform-section-title">${label}</div>
        <div class="platform-section-meta">
          <span class="platform-char-count" style="color: ${statusColor}">${displayCount}</span>
          <span style="color: ${statusColor}; font-size: 11px; font-weight: 600;">${statusLabel}</span>
          <button class="copy-btn" onclick="copyText('${platform}')">Copy</button>
        </div>
      </div>
      <div class="platform-content-display" id="display-${platform}">${mdToHtml(output.content)}</div>
      <textarea id="clipboard-${platform}" class="clip-textarea">${escapeHtml(output.copyText)}</textarea>
    </div>`;
  }

  function renderXThread() {
    const output = xThreadOutput;
    const tweets = output.content.split(/\n\n---\n\n/).filter(t => t.trim());
    const statusColor = output.overLimit ? "#e74c3c" : "#27ae60";
    const tweetCards = tweets.map((tweet, i) => {
      const threadRx = /^(.+?)\n\n\(([\d]+)\)/s;
      const match = tweet.match(threadRx);
      let prefix = "", body = tweet;
      if (match) { prefix = match[1]; body = match[2]; }
      return `
      <div class="thread-tweet">
        <div class="thread-prefix">${escapeHtml(prefix)} <span class="thread-num">(${i + 1}/${tweets.length})</span></div>
        <div class="thread-body">${escapeHtml(body)}</div>
      </div>`;
    }).join("");

    return `
    <div class="platform-section">
      <div class="platform-section-header">
        <div class="platform-section-title">X Thread</div>
        <div class="platform-section-meta">
          <span class="platform-char-count" style="color: ${statusColor}">${tweets.length} tweets</span>
          <span style="color: ${statusColor}; font-size: 11px; font-weight: 600;">${output.overLimit ? "OVER LIMIT" : "OK"}</span>
          <button class="copy-btn" onclick="copyText('x-thread')">Copy All</button>
        </div>
      </div>
      <div class="thread-container">${tweetCards}</div>
      <textarea id="clipboard-x-thread" class="clip-textarea">${escapeHtml(output.copyText)}</textarea>
    </div>`;
  }

  function renderBeeHiiv() {
    const statusColor = beehiivOutput.overLimit ? "#e74c3c" : "#27ae60";
    return `
    <div class="platform-section">
      <div class="platform-section-header">
        <div class="platform-section-title">BeeHiiv HTML</div>
        <div class="platform-section-meta">
          <span class="platform-char-count" style="color: ${statusColor}">${beehiivOutput.content.length} chars</span>
          <span style="color: ${statusColor}; font-size: 11px; font-weight: 600;">${beehiivOutput.overLimit ? "OVER LIMIT" : "OK"}</span>
          <button class="copy-btn" onclick="copyBeehiiv()">Copy HTML</button>
        </div>
      </div>
      <div class="beehiiv-preview-label">Preview</div>
      <iframe class="beehiiv-iframe" srcdoc="${escapeHtml(beehiivHtml)}" sandbox="allow-same-origin"></iframe>
      <textarea id="clipboard-beehiiv" class="clip-textarea">${escapeHtml(beehiivOutput.copyText)}</textarea>
    </div>`;
  }

  const platformSections = [
    renderTextarea("substack", "Substack", substackOutput.characterCount, Infinity, substackOutput.overLimit),
    renderTextarea("x", "X (Twitter)", xOutput.characterCount, 280, xOutput.overLimit),
    renderXThread(),
    renderTextarea("tiktok", "TikTok", tiktokOutput.characterCount, 220, tiktokOutput.overLimit),
    renderBeeHiiv(),
  ].join("\n");

  const clipboardData = JSON.stringify(
    Object.fromEntries(outputs.map(o => [o.platform, o.copyText]))
  );

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

  /* Newsletter source preview */
  .newsletter-source { background: #1a1a24; border: 1px solid #2a2a3a; border-radius: 12px; padding: 24px; margin-bottom: 28px; }
  .newsletter-source h2 { font-size: 16px; margin-bottom: 12px; color: #a78bfa; }
  .newsletter-source p { font-size: 14px; line-height: 1.7; color: #a1a1aa; margin-bottom: 8px; }
  .newsletter-source .src-label { font-size: 11px; font-weight: 600; color: #6C5CE7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; margin-top: 14px; }
  .newsletter-source .src-value { color: #d4d4d8; }
  .newsletter-source .src-value.title { font-size: 15px; font-weight: 600; color: #f4f4f5; }

  /* Per-platform sections */
  .platform-section { background: #1a1a24; border: 1px solid #2a2a3a; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
  .platform-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #2a2a3a; }
  .platform-section-title { font-size: 15px; font-weight: 700; color: #f4f4f5; }
  .platform-section-meta { display: flex; align-items: center; gap: 10px; }
  .platform-char-count { font-size: 12px; font-weight: 500; }
  .copy-btn { background: #6C5CE7; color: white; border: none; border-radius: 6px; padding: 7px 14px; font-size: 12px; cursor: pointer; }
  .copy-btn:hover { background: #5a4ad1; }

  /* Text platform display (rendered markdown) */
  .platform-content-display { background: #111; border: 1px solid #2a2a3a; border-radius: 8px; padding: 16px; line-height: 1.7; }
  .platform-content-display h1 { font-size: 22px; font-weight: 700; color: #f4f4f5; margin-bottom: 10px; }
  .platform-content-display h2 { font-size: 18px; font-weight: 700; color: #a78bfa; margin: 14px 0 8px; }
  .platform-content-display h3 { font-size: 15px; font-weight: 700; color: #c4b5fd; margin: 10px 0 6px; }
  .platform-content-display p { font-size: 14px; color: #d4d4d8; margin-bottom: 10px; }
  .platform-content-display ul { padding-left: 20px; margin: 0 0 10px; }
  .platform-content-display li { font-size: 14px; color: #d4d4d8; margin-bottom: 4px; }
  .platform-content-display hr { border: none; border-top: 1px solid #333; margin: 14px 0; }
  .platform-content-display strong { color: #f4f4f5; }
  .platform-content-display em { color: #a1a1aa; font-style: italic; }

  /* X single tweet display */
  .x-tweet-display { background: #111; border: 1px solid #2a2a3a; border-radius: 8px; padding: 16px; }
  .x-tweet-display .tweet-text { font-size: 15px; line-height: 1.6; color: #f4f4f5; margin-bottom: 12px; }
  .x-tweet-display .tweet-link { font-size: 13px; color: #6C5CE7; margin-bottom: 8px; }
  .x-tweet-display .tweet-meta { font-size: 12px; color: #71717a; }
  .x-tweet-display .tweet-tags { margin-top: 8px; }
  .x-tweet-display .tweet-tag { display: inline-block; background: #2a2a3a; color: #a78bfa; font-size: 11px; padding: 2px 7px; border-radius: 4px; margin-right: 4px; }

  /* Thread display */
  .thread-container { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
  .thread-tweet { background: #111; border: 1px solid #2a2a3a; border-radius: 8px; padding: 12px 14px; }
  .thread-prefix { font-size: 11px; font-weight: 700; color: #6C5CE7; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .thread-num { color: #71717a; font-weight: 400; }
  .thread-body { font-size: 13px; line-height: 1.6; color: #d4d4d8; white-space: pre-wrap; }

  /* BeeHiiv */
  .beehiiv-preview-label { font-size: 11px; font-weight: 600; color: #6C5CE7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .beehiiv-iframe { width: 100%; height: 600px; border: 1px solid #2a2a3a; border-radius: 8px; background: white; margin-bottom: 12px; }

  /* Hidden textareas for clipboard */
  .clip-textarea { position: absolute; left: -9999px; top: -9999px; opacity: 0; }

  .notification { position: fixed; bottom: 24px; right: 24px; background: #27ae60; color: white; padding: 12px 20px; border-radius: 8px; font-size: 14px; display: none; z-index: 999; }
</style>
</head>
<body>

<div class="newsletter-source">
  <h2>Source Newsletter</h2>
  <div class="src-label">Issue ${data.issueNumber} &nbsp;&middot;&nbsp; ${data.date}</div>
  <div class="src-label" style="margin-top:12px;">Headline</div>
  <div class="src-value title">${escapeHtml(data.headline)}</div>
  <div class="src-label" style="margin-top:10px;">Hook</div>
  <div class="src-value">${escapeHtml(data.hook.slice(0, 200))}${data.hook.length > 200 ? "..." : ""}</div>
  <div class="src-label" style="margin-top:10px;">Big Story</div>
  <div class="src-value">${escapeHtml(data.bigStory.slice(0, 200))}${data.bigStory.length > 200 ? "..." : ""}</div>
</div>

<div class="newsletter-source" style="background:#111;border-color:#333;margin-bottom:20px;">
  <div style="font-size:12px;color:#71717a;">
    Character counts: Substack ${substackOutput.content.length} &middot;
    X ${xOutput.content.length}/280 &middot;
    X Thread ${xThreadOutput.content.length} &middot;
    TikTok ${tiktokOutput.content.length}/220 &middot;
    BeeHiiv ${beehiivOutput.content.length}
  </div>
</div>

${platformSections}

<div class="notification" id="notification">Copied!</div>

<script>
const clipboardData = ${clipboardData};

async function copyText(platform) {
  const text = clipboardData[platform];
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showNotification(platform + " copied!");
  } catch(e) {
    const ta = document.getElementById("clipboard-" + platform);
    if (ta) { ta.style.position = "fixed"; ta.style.left = "0"; ta.style.top = "0"; ta.style.opacity = "1"; ta.select(); document.execCommand("copy"); ta.style.opacity = "0"; ta.style.position = "absolute"; }
    showNotification(platform + " copied!");
  }
}

async function copyBeehiiv() {
  await copyText("beehiiv");
}

function showNotification(msg) {
  const n = document.getElementById("notification");
  n.textContent = msg;
  n.style.display = "block";
  setTimeout(() => { n.style.display = "none"; }, 2000);
}
</script>

</body>
</html>`;
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

  const dashboard = buildDashboard(data, outputs, beehiivHtml);
  const dateSlug = data.dateIso;
  const dashboardPath = path.join(outputDir, `dashboard-${dateSlug}.html`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(dashboardPath, dashboard, "utf8");

  for (const output of outputs) {
    const ext = output.platform === "beehiiv" ? "html" : "txt";
    const outPath = path.join(outputDir, `${output.platform}-${dateSlug}.${ext}`);
    fs.writeFileSync(outPath, output.content, "utf8");
  }

  return { dashboardPath, outputs, beehiivHtml };
}
