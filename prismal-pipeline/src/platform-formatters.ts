// Platform-specific content formatters for Prismal newsletter
// Each formatter takes the newsletter data and returns platform-optimized content

export interface NewsletterData {
  date: string;          // "Friday 27 March 2026"
  dateIso: string;       // "2026-03-27"
  issueNumber: number;   // 1
  headline: string;     // The big story headline
  hook: string;          // Opening paragraph
  bigStory: string;      // THE BIG STORY content
  techStories: { title: string; summary: string }[];
  financeStories: { title: string; summary: string }[];
  geopoliticsStories: { title: string; summary: string }[];
  whatToWatch: string[];
  byTheNumbers: string[];
  signalsFromTheEdge: { title: string; content: string }[];
  subscribeUrl: string;
}

export interface PlatformOutput {
  platform: string;
  platformName: string;
  content: string;
  characterCount: number;
  characterLimit: number;
  overLimit: boolean;
  hashtags: string[];
  copyText: string;
}

// ── Substack ─────────────────────────────────────────────────────────────────

export function formatSubstack(data: NewsletterData): PlatformOutput {
  const hashtagLine = "#Tech #Finance #Geopolitics #DailyNewsletter";
  const content = [
    `${data.headline}`,
    "",
    data.hook,
    "",
    "---",
    "",
    "## THE BIG STORY",
    "",
    data.bigStory.slice(0, 500) + (data.bigStory.length > 500 ? "..." : ""),
    "",
    "---",
    "",
    "## TECH",
    ...data.techStories.slice(0, 2).map(s => `**${s.title}**\n${s.summary}`),
    "",
    "## FINANCE",
    ...data.financeStories.slice(0, 2).map(s => `**${s.title}**\n${s.summary}`),
    "",
    "## GEOPOLITICS",
    ...data.geopoliticsStories.slice(0, 2).map(s => `**${s.title}**\n${s.summary}`),
    "",
    "---",
    "",
    "**What to Watch:**",
    data.whatToWatch.map(w => `• ${w}`).join("\n"),
    "",
    "**By the Numbers:**",
    data.byTheNumbers.slice(0, 5).map(n => `• ${n}`).join("\n"),
    "",
    `Subscribe free: ${data.subscribeUrl}`,
    "",
    hashtagLine,
  ].join("\n");

  return {
    platform: "substack",
    platformName: "Substack",
    content,
    characterCount: content.length,
    characterLimit: Infinity,
    overLimit: false,
    hashtags: ["Tech", "Finance", "Geopolitics", "DailyNewsletter"],
    copyText: content,
  };
}

// ── X / Twitter ─────────────────────────────────────────────────────────────

const X_LINK = "prismal.beehiiv.com";

export function formatX(data: NewsletterData): PlatformOutput {
  // X allows 280 chars. We need room for the link (22 chars including space).
  // So headline gets max ~255 chars.
  const maxHeadline = 256;
  let headline = data.headline;
  const linkText = `${X_LINK}`;
  const withLink = headline.length + 1 + linkText.length;

  if (withLink > 280) {
    const availHeadroom = 280 - (1 + linkText.length);
    headline = headline.slice(0, availHeadroom - 3) + "...";
  }

  const tweet = `${headline} ${linkText}`;
  const hashtags = "#Tech #Finance #Geopolitics";
  const fullTweet = tweet.includes("#") ? tweet : `${tweet} ${hashtags}`;

  return {
    platform: "x",
    platformName: "X (Twitter)",
    content: tweet,
    characterCount: tweet.length,
    characterLimit: 280,
    overLimit: tweet.length > 280,
    hashtags: ["Tech", "Finance", "Geopolitics"],
    copyText: fullTweet.length <= 280 ? fullTweet : tweet,
  };
}

// X Thread: for longer-form threading
export function formatXThread(data: NewsletterData): PlatformOutput {
  const threadLines: string[] = [];
  const maxPerTweet = 270; // leave room for Tweet separator

  // Helper: split a long string into tweet-sized chunks, each max 280 chars
  function splitTweet(text: string, prefix: string = ""): string[] {
    const maxLen = 280 - (prefix ? prefix.length + 2 : 0);
    if (text.length <= maxLen) return [prefix ? `${prefix}\n\n${text}` : text];
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
    let current = "";
    let part = 1;
    for (const sentence of sentences) {
      if ((current.length + sentence.length) > maxLen && current) {
        chunks.push(prefix ? `${prefix} (${part})\n\n${current.trim()}` : current.trim());
        part++;
        current = sentence;
        prefix = prefix; // keep same prefix for continuation
      } else {
        current += sentence;
      }
    }
    if (current.trim()) chunks.push(prefix ? `${prefix} (${part})\n\n${current.trim()}` : current.trim());
    return chunks;
  }

  // Thread header
  threadLines.push(`${data.date} -- Issue ${data.issueNumber} of Prismal\nThe most important stories in Tech, Finance, and Geopolitics.\n\n${data.subscribeUrl}`);

  // Tweet 2: The big story
  const bigChunks = splitTweet(data.bigStory.slice(0, 500), "THE BIG STORY");
  bigChunks.forEach(c => threadLines.push(c));

  // Tweet 3: Tech highlights
  const techSnippet = data.techStories.slice(0, 2).map(s => `• ${s.title}`).join("\n");
  threadLines.push(`TECH\n\n${techSnippet}`);

  // Tweet 4: Finance highlights
  const finSnippet = data.financeStories.slice(0, 2).map(s => `• ${s.title}`).join("\n");
  threadLines.push(`FINANCE\n\n${finSnippet}`);

  // Tweet 5: Geopolitics highlights
  const geoSnippet = data.geopoliticsStories.slice(0, 2).map(s => `• ${s.title}`).join("\n");
  threadLines.push(`GEOPOLITICS\n\n${geoSnippet}`);

  // Tweet 6: What to watch (may split into multiple)
  const watchText = data.whatToWatch.slice(0, 2).map(w => `→ ${w}`).join("\n");
  const watchChunks = splitTweet(watchText, "WHAT TO WATCH");
  watchChunks.forEach(c => threadLines.push(c));

  // Tweet 7: By the numbers
  const numbersText = data.byTheNumbers.slice(0, 4).map(n => `• ${n}`).join("\n");
  threadLines.push(`BY THE NUMBERS\n\n${numbersText}`);

  // Build thread text with separators
  const threadText = threadLines.join("\n\n---\n\n");
  const longestTweet = Math.max(...threadLines.map(t => t.length));

  return {
    platform: "x-thread",
    platformName: `X Thread (${threadLines.length} tweets)`,
    content: threadText,
    characterCount: threadText.length,
    characterLimit: maxPerTweet,
    overLimit: longestTweet > 280,
    hashtags: [],
    copyText: threadText,
  };
}

// ── TikTok ──────────────────────────────────────────────────────────────────

export function formatTikTok(data: NewsletterData): PlatformOutput {
  const maxCaption = 150;
  const hashtags = "#prismal #tech #finance #geopolitics #newsletter #dailyread";

  // TikTok caption: punchy hook + hook + link
  const caption = data.hook.slice(0, maxCaption - (hashtags.length + 3));
  const fullCaption = `${caption}...\n\n📬 Full newsletter + link in bio\n${hashtags}`;

  // Also a longer description version for the video text overlay
  const videoOverlayText = `${data.date} -- Issue ${data.issueNumber} -- Tech, Finance, Geopolitics`;

  return {
    platform: "tiktok",
    platformName: "TikTok",
    content: fullCaption,
    characterCount: fullCaption.length,
    characterLimit: 220,
    overLimit: fullCaption.length > 220,
    hashtags: ["prismal", "tech", "finance", "geopolitics", "newsletter", "dailyread"],
    copyText: fullCaption,
  };
}

// ── BeeHiiv (full HTML) ─────────────────────────────────────────────────────

export function formatBeeHiiv(data: NewsletterData): PlatformOutput {
  const byTheNumbersList = data.byTheNumbers.map(n => `<li>${n}</li>`).join("\n");
  const whatToWatchList = data.whatToWatch.map(w => `<li>${w}</li>`).join("\n");
  const techList = data.techStories.slice(0, 2).map(s => `<li><strong>${s.title}</strong> -- ${s.summary}</li>`).join("\n");
  const financeList = data.financeStories.slice(0, 2).map(s => `<li><strong>${s.title}</strong> -- ${s.summary}</li>`).join("\n");
  const geoList = data.geopoliticsStories.slice(0, 2).map(s => `<li><strong>${s.title}</strong> -- ${s.summary}</li>`).join("\n");
  const signalsList = data.signalsFromTheEdge.map(s => `<li><em>${s.title}</em>: ${s.content.slice(0, 200)}...</li>`).join("\n");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Prismal -- ${data.date}</title>
</head>
<body style="font-family: Georgia, serif; max-width: 680px; margin: 0 auto; padding: 20px; color: #1a1a1a; line-height: 1.6;">

<div style="text-align: center; margin-bottom: 32px;">
  <div style="font-size: 11px; letter-spacing: 4px; color: #888; text-transform: uppercase;">Prismal</div>
  <h1 style="font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 4px 0;">⬡ PRISMAL</h1>
  <p style="color: #666; font-size: 13px; margin: 4px 0 0;">${data.date} -- Issue ${data.issueNumber} -- Tech x Finance x Geopolitics</p>
</div>

<p style="font-size: 16px; font-weight: 600; border-left: 4px solid #6C5CE7; padding-left: 16px; margin: 24px 0;">${data.hook}</p>

<h2 style="font-size: 20px; margin: 24px 0 12px;">THE BIG STORY</h2>
<p>${data.bigStory}</p>

<h2 style="font-size: 16px;">💻 TECH</h2>
<ul>${techList}</ul>

<h2 style="font-size: 16px;">💸 FINANCE</h2>
<ul>${financeList}</ul>

<h2 style="font-size: 16px;">🏛️ GEOPOLITICS</h2>
<ul>${geoList}</ul>

<h2 style="font-size: 16px;">👀 WHAT TO WATCH</h2>
<ul>${whatToWatchList}</ul>

<h2 style="font-size: 16px;">📊 BY THE NUMBERS</h2>
<ul>${byTheNumbersList}</ul>

<h2 style="font-size: 16px;">🚨 SIGNALS FROM THE EDGE</h2>
<ul>${signalsList}</ul>

<hr style="border:none; border-top: 1px solid #eee; margin: 32px 0;">
<p style="font-size: 12px; color: #999;">
  <strong>⬡ PRISMAL</strong> -- Refracting signal from noise<br>
  <a href="${data.subscribeUrl}" style="color: #6C5CE7;">Subscribe at ${data.subscribeUrl}</a><br>
  Not financial advice -- Past performance is not indicative of future results
</p>

</body>
</html>`;

  return {
    platform: "beehiiv",
    platformName: "BeeHiiv",
    content: html,
    characterCount: html.length,
    characterLimit: Infinity,
    overLimit: false,
    hashtags: [],
    copyText: html,
  };
}
