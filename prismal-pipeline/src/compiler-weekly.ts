// Weekly Round-up Compiler -- Sunday output
// Full week review format

import type { ArticleForWriter } from "./writer.js";
import { PRISMAL } from "./branding.js";

export interface WeeklyReportInput {
  weekStart: string;   // ISO date of Monday
  weekEnd: string;     // ISO date of Sunday
  weekLabel: string;   // e.g. "Week of 23-29 March 2026"
  issueNumber: number;
  newsletterContent: string;
  sourceCount: number;
  runtimeMs: number;
  beatCounts: { tech: number; finance: number; geopolitics: number };
}

export interface WeeklyReport {
  metadata: Record<string, unknown>;
  html: string;
  markdown: string;
}

export function compileWeeklyReport(input: WeeklyReportInput): WeeklyReport {
  const { weekStart, weekEnd, weekLabel, issueNumber, newsletterContent, sourceCount, runtimeMs, beatCounts } = input;

  const metadata = {
    publication: "Prismal",
    type: "weekly",
    week_start: weekStart,
    week_end: weekEnd,
    issue: issueNumber,
    tier: "standard",
    sources: sourceCount,
    runtime: `${runtimeMs}ms`,
    generated: new Date().toISOString(),
    beats: beatCounts,
  };

  const markdown = `# PRISMAL -- WEEKLY ROUND-UP
### ${weekLabel}  --  Issue ${issueNumber}  --  Tech x Finance x Geopolitics

*Refracting signal from noise -- a weekly digest for the curious and the informed*

---

${newsletterContent}

---
*This week: ${beatCounts.tech} tech  --  ${beatCounts.finance} finance  --  ${beatCounts.geopolitics} geopolitics  --  ${sourceCount} total sources*
*Subscribe at ${PRISMAL.baseUrl}  --  Not financial advice  --  Past performance is not indicative of future results*`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, serif; max-width: 680px; margin: 0 auto; padding: 20px; color: #1a1a1a; line-height: 1.6;">

<div style="text-align: center; margin-bottom: 32px;">
  <div style="font-size: 11px; letter-spacing: 4px; color: #888; text-transform: uppercase; margin-bottom: 4px;">
    Prismal Weekly
  </div>
  <h1 style="font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -1px;">
    ⬡ PRISMAL
  </h1>
  <p style="color: #666; font-size: 13px; margin: 4px 0 0;">
    ${weekLabel}  --  Issue ${issueNumber}  --  Tech x Finance x Geopolitics
  </p>
</div>

<div style="font-size: 15px; line-height: 1.7; color: #2a2a2a;">
  ${weeklyMarkdownToHtml(newsletterContent)}
</div>

<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
  <p style="margin: 0 0 4px;">
    This week: <strong style="color:#555;">${beatCounts.tech} tech</strong>  -- 
    <strong style="color:#555;">${beatCounts.finance} finance</strong>  -- 
    <strong style="color:#555;">${beatCounts.geopolitics} geopolitics</strong>  -- 
    ${sourceCount} total sources
  </p>
  <p style="margin: 8px 0 0;">
    <a href="${PRISMAL.baseUrl}" style="color:#6C5CE7;">Subscribe at ${PRISMAL.baseUrl}</a>  -- 
    Not financial advice
  </p>
</div>

</body>
</html>`;

  return { metadata, html, markdown };
}

function weeklyMarkdownToHtml(md: string): string {
  let html = md;
  html = html.replace(/```[\s\S]*?```/g, m => `<pre style="background:#f4f4f4;padding:12px;overflow-x:auto;font-size:13px;">${m.slice(3,-3).trim()}</pre>`);
  html = html.replace(/^#### (.+)$/gm, '<h4 style="margin:20px 0 6px;font-size:14px;color:#333;">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="margin:24px 0 8px;font-size:16px;color:#222;border-bottom:2px solid #6C5CE7;padding-bottom:6px;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="margin:28px 0 10px;font-size:18px;color:#111;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="margin:0 0 16px;font-size:22px;color:#111;">$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#6C5CE7;">$1</a>');
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>');
  html = html.replace(/^\*\*(.+?)\*\*$/gm, '<li style="margin-bottom:6px;"><strong>$1</strong></li>');
  const blocks = html.split(/\n\n+/);
  html = blocks.map(b => {
    b = b.trim();
    if (!b) return '';
    if (b.startsWith('<h') || b.startsWith('<hr') || b.startsWith('<pre')) return b;
    if (b.startsWith('<li')) return `<ul style="margin:12px 0;padding-left:20px;">${b}</ul>`;
    return `<p style="margin:12px 0;">${b.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');
  return html;
}
