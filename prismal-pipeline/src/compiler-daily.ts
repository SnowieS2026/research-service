// Daily Report Compiler -- Mon-Fri output
// Wraps writer output in Prismal HTML email template + metadata

import type { ArticleForWriter } from "./writer.js";
import { PRISMAL } from "./branding.js";

export interface DailyReportInput {
  dateLabel: string;        // e.g. "Friday 27 March 2026"
  issueNumber: number;
  newsletterContent: string;  // Already written by writer agent
  sourceCount: number;
  runtimeMs: number;
}

export interface DailyReport {
  metadata: Record<string, unknown>;
  html: string;
  markdown: string;
}

export function compileDailyReport(input: DailyReportInput): DailyReport {
  const { dateLabel, issueNumber, newsletterContent, sourceCount, runtimeMs } = input;

  const metadata = {
    publication: "Prismal",
    date: new Date().toISOString().slice(0, 10),
    issue: issueNumber,
    tier: "standard",
    sources: sourceCount,
    runtime: `${runtimeMs}ms`,
    generated: new Date().toISOString(),
  };

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // Strip writer's PRISMAL header block (everything from # PRISMAL to the blank line after the date/beat line)
  // Be careful: the regex [^\n]* matches the entire date line, but we stop at the first blank line after
  // Strip writer's PRISMAL header block: lines starting with # or ### until first blank line
  const allLines = newsletterContent.split("\n");
  let contentStart = 0;
  for (let i = 0; i < allLines.length; i++) {
    const trimmed = allLines[i].trim();
    if (trimmed === "") {
      contentStart = i + 1; // start AFTER this blank line
      break;
    }
    if (i === allLines.length - 1) {
      contentStart = i + 1;
    }
  }

  // Get content after header, then strip writer's footer if present
  let content = allLines.slice(contentStart).join("\n");
  content = content
    .replace(/\*Subscribe at[^*]+\*/g, "")
    .replace(/^[\s-]*---\s*$/gm, "")
    .trim();

  const cleanContent = content;

  const markdown = `# PRISMAL
### ${dateStr}  --  Issue ${issueNumber}  --  Tech x Finance x Geopolitics

${cleanContent}

---
*Subscribe at ${PRISMAL.baseUrl}  --  Not financial advice  --  Past performance is not indicative of future results*`;

  // BeeHiiv HTML email template
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Prismal -- ${dateLabel}</title>
</head>
<body style="font-family: Georgia, serif; max-width: 680px; margin: 0 auto; padding: 20px; color: #1a1a1a; line-height: 1.6;">

<!-- Header -->
<div style="text-align: center; margin-bottom: 32px;">
  <div style="font-size: 11px; letter-spacing: 4px; color: #888; text-transform: uppercase; margin-bottom: 4px;">
    Prismal
  </div>
  <h1 style="font-size: 32px; font-weight: 700; color: #1a1a1a; margin: 0; letter-spacing: -1px;">
    ⬡ PRISMAL
  </h1>
  <p style="color: #666; font-size: 13px; margin: 4px 0 0;">
    ${dateLabel}  --  Issue ${issueNumber}  --  Tech x Finance x Geopolitics
  </p>
</div>

<!-- Content -->
<div style="font-size: 15px; line-height: 1.7; color: #2a2a2a;">
  ${markdownToHtml(newsletterContent)}
</div>

<!-- Footer -->
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
  <p style="margin: 0 0 4px;">
    <strong style="color: #555;">Prismal</strong> -- Refracting signal from noise
  </p>
  <p style="margin: 0 0 4px;">
    <a href="${PRISMAL.baseUrl}" style="color: #6C5CE7;">Subscribe at ${PRISMAL.baseUrl}</a>
  </p>
  <p style="margin: 8px 0 0; font-size: 11px;">
    Not financial advice  --  Past performance is not indicative of future results  --  ${sourceCount} sources analysed
  </p>
</div>

</body>
</html>`;

  return { metadata, html, markdown };
}

// Minimal Markdown→HTML for BeeHiiv
function markdownToHtml(md: string): string {
  let html = md;

  // Code blocks
  html = html.replace(/```[\s\S]*?```/g, (m) => `<pre style="background:#f4f4f4;padding:12px;overflow-x:auto;font-size:13px;">${m.slice(3,-3).trim()}</pre>`);

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4 style="margin:20px 0 6px;font-size:14px;color:#333;">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="margin:24px 0 8px;font-size:16px;color:#222;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="margin:28px 0 10px;font-size:18px;color:#111;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="margin:0 0 16px;font-size:22px;color:#111;">$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#6C5CE7;">$1</a>');

  // HR
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>');

  // Paragraphs
  const blocks = html.split(/\n\n+/);
  html = blocks
    .map(b => {
      b = b.trim();
      if (!b) return '';
      if (b.startsWith('<h') || b.startsWith('<hr') || b.startsWith('<pre')) return b;
      if (b.startsWith('- ')) {
        return `<ul style="margin:12px 0;padding-left:20px;">${
          b.split('\n').map(l => `<li style="margin-bottom:6px;">${l.replace(/^- /, '')}</li>`).join('')
        }</ul>`;
      }
      return `<p style="margin:12px 0;">${b.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  return html;
}
