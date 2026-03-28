"use strict";
// Platform-specific content formatters for Prismal newsletter
// Each formatter takes the newsletter data and returns platform-optimized content
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSubstack = formatSubstack;
exports.formatX = formatX;
exports.formatXThread = formatXThread;
exports.formatTikTok = formatTikTok;
exports.formatBeeHiiv = formatBeeHiiv;
// ── Substack ─────────────────────────────────────────────────────────────────
function formatSubstack(data) {
    const techItems = data.techStories.map(s => "### " + s.title + "\n\n" + s.summary).join("\n\n");
    const financeItems = data.financeStories.map(s => "### " + s.title + "\n\n" + s.summary).join("\n\n");
    const geoItems = data.geopoliticsStories.map(s => "### " + s.title + "\n\n" + s.summary).join("\n\n");
    const watchItems = data.whatToWatch.map(w => "• " + w).join("\n");
    const numbersItems = data.byTheNumbers.map(n => "• " + n).join("\n");
    const signalItems = data.signalsFromTheEdge.map(s => "**" + s.title + "** -- " + s.content).join("\n\n");
    const content = [
        "# " + data.headline,
        "",
        "*" + data.date + " -- Issue " + data.issueNumber + "*",
        "",
        data.hook,
        "",
        "---",
        "",
        "## THE BIG STORY",
        "",
        data.bigStory,
        "",
        "---",
        "",
        "## TECH",
        "",
        techItems,
        "",
        "## FINANCE",
        "",
        financeItems,
        "",
        "## GEOPOLITICS",
        "",
        geoItems,
        "",
        "---",
        "",
        "## WHAT TO WATCH",
        "",
        watchItems,
        "",
        "## BY THE NUMBERS",
        "",
        numbersItems,
        "",
        "---",
        "",
        "## SIGNALS FROM THE EDGE",
        "",
        signalItems,
        "",
        "---",
        "",
        "**[Subscribe free -- get Prismal in your inbox](" + data.subscribeUrl + ")**",
        "",
        "Tech -- Finance -- Geopolitics -- Daily Newsletter",
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
function formatX(data) {
    // X: 260 chars max.
    // Budget: link ~22 + CTA "Subscribe free" ~14 + hashtags ~26 + newlines ~4 = ~66 fixed
    // Remaining for opener: 260 - 66 = 194 chars max
    const maxOpener = 194;
    let opener = data.hook.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\n/g, " ").trim();
    // Find the first real sentence end (skip decimals like "3.4 million")
    let sentenceEnd = opener.length;
    {
        const rx = /[.!?]\s+/g;
        let m;
        while ((m = rx.exec(opener)) !== null) {
            const pos = m.index;
            const isDecimal = /^\d$/.test(opener[pos - 1]);
            if (!isDecimal) {
                sentenceEnd = pos + 1;
                break;
            }
        }
    }
    let firstSentence = opener.slice(0, sentenceEnd).trim();
    if (firstSentence.length > maxOpener) {
        firstSentence = firstSentence.slice(0, maxOpener - 3);
        const lastSpace = firstSentence.lastIndexOf(" ");
        if (lastSpace > maxOpener * 0.6) {
            firstSentence = firstSentence.slice(0, lastSpace);
        }
        firstSentence = firstSentence.trim() + "...";
    }
    const tweet = firstSentence + "\n\n" + X_LINK + "\n\nSubscribe free | #Tech #Finance #Geopolitics";
    return {
        platform: "x",
        platformName: "X (Twitter)",
        content: tweet,
        characterCount: tweet.length,
        characterLimit: 260,
        overLimit: tweet.length > 260,
        hashtags: ["Tech", "Finance", "Geopolitics"],
        copyText: tweet,
    };
}
// ── X Thread ────────────────────────────────────────────────────────────────
function formatXThread(data) {
    const threadLines = [];
    const MAX_CHARS = 260;
    function splitText(text, prefix = "") {
        const normalized = text.replace(/\s+/g, " ").trim();
        const prefixLen = prefix ? prefix.length + 4 : 0;
        const maxLen = MAX_CHARS - prefixLen;
        if (normalized.length <= maxLen) {
            return prefix ? [prefix + "\n\n" + normalized] : [normalized];
        }
        // Split by sentences: punctuation followed by whitespace or end of string
        const sentenceRx = /[^.!?]*[.!?]+(?:\s|$)|[^.!?]+$/g;
        const sentences = normalized.match(sentenceRx) || [normalized];
        const chunks = [];
        let current = "";
        let part = 1;
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (!trimmed)
                continue;
            if (current && (current.length + trimmed.length + 1) > maxLen) {
                const chunkText = prefix
                    ? prefix + " (" + part + "/" + sentences.length + ")\n\n" + current.trim()
                    : current.trim();
                chunks.push(chunkText);
                part++;
                current = trimmed;
            }
            else {
                current += current ? " " + trimmed : trimmed;
            }
        }
        if (current.trim()) {
            const chunkText = prefix
                ? prefix + " (" + part + "/" + sentences.length + ")\n\n" + current.trim()
                : current.trim();
            chunks.push(chunkText);
        }
        return chunks;
    }
    // WHAT TO WATCH items can be 200-270 chars. Pre-truncate each to 220 chars
    // so they always fit in a tweet after the "WHAT TO WATCH (N/3)\n\n" prefix.
    const watchMax = MAX_CHARS - 25;
    function fitWatch(text) {
        if (text.length <= watchMax)
            return text;
        const truncated = text.slice(0, watchMax - 3);
        const lastSpace = truncated.lastIndexOf(" ");
        return (lastSpace > watchMax * 0.6 ? truncated.slice(0, lastSpace) : truncated) + "...";
    }
    // Thread header
    threadLines.push(data.date + " -- Issue " + data.issueNumber + " of Prismal\n" +
        "The most important stories in Tech, Finance, and Geopolitics.\n\n" +
        data.subscribeUrl);
    // Big story (may split) -- always split by word at ~230 chars because big story
    // content can run hundreds of characters without sentence punctuation.
    // Target each chunk at ~230 chars so even with a ~23-char "BIG STORY (N/N)\n\n" prefix
    // the total stays within 260.
    const bigWords = data.bigStory.replace(/\s+/g, " ").trim().split(" ");
    const bigChunks = [];
    let current = "";
    for (const word of bigWords) {
        if ((current + " " + word).trim().length > 230 && current) {
            bigChunks.push(current.trim());
            current = word;
        }
        else {
            current = (current + " " + word).trim();
        }
    }
    if (current.trim())
        bigChunks.push(current.trim());
    bigChunks.forEach((chunk, i) => {
        threadLines.push("THE BIG STORY (" + (i + 1) + "/" + bigChunks.length + ")\n\n" + chunk);
    });
    // Tech, Finance, Geopolitics highlights
    const techText = data.techStories.slice(0, 2).map(s => "\u2022 " + s.title).join("\n");
    splitText(techText, "TECH").forEach(c => threadLines.push(c));
    const finText = data.financeStories.slice(0, 2).map(s => "\u2022 " + s.title).join("\n");
    splitText(finText, "FINANCE").forEach(c => threadLines.push(c));
    const geoText = data.geopoliticsStories.slice(0, 2).map(s => "\u2022 " + s.title).join("\n");
    splitText(geoText, "GEOPOLITICS").forEach(c => threadLines.push(c));
    // What to watch (items pre-truncated)
    const watchText = data.whatToWatch.slice(0, 3).map(w => fitWatch(w)).join("\n");
    splitText(watchText, "WHAT TO WATCH").forEach(c => threadLines.push(c));
    // By the numbers
    const numbersText = data.byTheNumbers.slice(0, 4).map(n => "\u2022 " + n).join("\n");
    splitText(numbersText, "BY THE NUMBERS").forEach(c => threadLines.push(c));
    const SEP = "\n\n---\n\n";
    const threadText = threadLines.join(SEP);
    const longestTweet = Math.max(...threadLines.map(t => t.length));
    return {
        platform: "x-thread",
        platformName: "X Thread (" + threadLines.length + " tweets)",
        content: threadText,
        characterCount: threadText.length,
        characterLimit: MAX_CHARS,
        overLimit: longestTweet > MAX_CHARS,
        hashtags: [],
        copyText: threadText,
    };
}
// ── TikTok ─────────────────────────────────────────────────────────────────
function formatTikTok(data) {
    const maxCaption = 150;
    const hashtags = "#prismal #tech #finance #geopolitics #newsletter #dailyread";
    const caption = data.hook.slice(0, maxCaption - (hashtags.length + 3));
    const fullCaption = caption + "...\n\nFull newsletter + link in bio\n" + hashtags;
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
function formatBeeHiiv(data) {
    const byTheNumbersList = data.byTheNumbers.map(n => "<li style=\"margin-bottom: 6px;\">" + n + "</li>").join("\n");
    const whatToWatchList = data.whatToWatch.map(w => "<li style=\"margin-bottom: 6px;\">" + w + "</li>").join("\n");
    const techList = data.techStories.slice(0, 2).map(s => "<li style=\"margin-bottom: 10px;\"><strong>" + s.title + "</strong><br>" + s.summary + "</li>").join("\n");
    const financeList = data.financeStories.slice(0, 2).map(s => "<li style=\"margin-bottom: 10px;\"><strong>" + s.title + "</strong><br>" + s.summary + "</li>").join("\n");
    const geoList = data.geopoliticsStories.slice(0, 2).map(s => "<li style=\"margin-bottom: 10px;\"><strong>" + s.title + "</strong><br>" + s.summary + "</li>").join("\n");
    const signalsList = data.signalsFromTheEdge.map(s => "<li style=\"margin-bottom: 10px; font-style: italic;\"><strong>" + s.title + ":</strong> " + s.content.slice(0, 200) + (s.content.length > 200 ? "..." : "") + "</li>").join("\n");
    const html = "<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>Prismal -- " + data.date + " -- Issue " + data.issueNumber + "</title>\n</head>\n<body style=\"font-family: Georgia, serif; max-width: 680px; margin: 0 auto; padding: 24px 20px; color: #1a1a1a; line-height: 1.7; background: #ffffff;\">\n\n<div style=\"text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #1a1a1a;\">\n  <div style=\"font-size: 11px; letter-spacing: 4px; color: #888; text-transform: uppercase; margin-bottom: 4px;\">\n    Prismal\n  </div>\n  <h1 style=\"font-size: 36px; font-weight: 700; color: #1a1a1a; margin: 0; letter-spacing: -1px;\">\n    &#x2B21; PRISMAL\n  </h1>\n  <p style=\"color: #666; font-size: 13px; margin: 6px 0 0; letter-spacing: 0.5px;\">\n    " + data.date + " &nbsp;&middot;&nbsp; Issue " + data.issueNumber + " &nbsp;&middot;&nbsp; Tech x Finance x Geopolitics\n  </p>\n</div>\n\n<p style=\"font-size: 17px; font-weight: 600; color: #111; border-left: 4px solid #6C5CE7; padding-left: 18px; margin: 0 0 28px; line-height: 1.5;\">\n  " + data.hook + "\n</p>\n\n<div style=\"margin: 0 0 32px;\">\n  <h2 style=\"font-size: 11px; letter-spacing: 3px; color: #6C5CE7; text-transform: uppercase; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #eee;\">\n    The Big Story\n  </h2>\n  <p style=\"font-size: 15px; line-height: 1.75; color: #2a2a2a; margin: 0;\">\n    " + data.bigStory + "\n  </p>\n</div>\n\n<table style=\"width: 100%; border-collapse: collapse; margin: 0 0 32px;\">\n  <tr>\n    <td style=\"vertical-align: top; width: 33%; padding-right: 16px;\">\n      <h3 style=\"font-size: 11px; letter-spacing: 2px; color: #e74c3c; text-transform: uppercase; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 2px solid #e74c3c;\">\n        Tech\n      </h3>\n      <ul style=\"padding-left: 16px; margin: 0;\">" + (techList || "<li>No significant tech stories today.</li>") + "</ul>\n    </td>\n    <td style=\"vertical-align: top; width: 33%; padding: 0 16px; border-left: 1px solid #eee;\">\n      <h3 style=\"font-size: 11px; letter-spacing: 2px; color: #27ae60; text-transform: uppercase; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 2px solid #27ae60;\">\n        Finance\n      </h3>\n      <ul style=\"padding-left: 16px; margin: 0;\">" + (financeList || "<li>No significant finance stories today.</li>") + "</ul>\n    </td>\n    <td style=\"vertical-align: top; width: 33%; padding-left: 16px; border-left: 1px solid #eee;\">\n      <h3 style=\"font-size: 11px; letter-spacing: 2px; color: #2980b9; text-transform: uppercase; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 2px solid #2980b9;\">\n        Geopolitics\n      </h3>\n      <ul style=\"padding-left: 16px; margin: 0;\">" + (geoList || "<li>No significant geopolitics stories today.</li>") + "</ul>\n    </td>\n  </tr>\n</table>\n\n<div style=\"margin: 0 0 28px;\">\n  <h2 style=\"font-size: 11px; letter-spacing: 3px; color: #6C5CE7; text-transform: uppercase; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #eee;\">\n    What to Watch\n  </h2>\n  <ul style=\"padding-left: 20px; margin: 0;\">" + whatToWatchList + "</ul>\n</div>\n\n<div style=\"margin: 0 0 28px;\">\n  <h2 style=\"font-size: 11px; letter-spacing: 3px; color: #6C5CE7; text-transform: uppercase; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #eee;\">\n    By the Numbers\n  </h2>\n  <ul style=\"padding-left: 20px; margin: 0; columns: 2; column-gap: 24px;\">" + byTheNumbersList + "</ul>\n</div>\n\n" + (signalsList ? "\n<div style=\"margin: 0 0 28px; background: #f9f9ff; border-left: 4px solid #6C5CE7; padding: 16px 20px; border-radius: 0 8px 8px 0;\">\n  <h2 style=\"font-size: 11px; letter-spacing: 3px; color: #6C5CE7; text-transform: uppercase; margin: 0 0 12px;\">\n    Signals from the Edge\n  </h2>\n  <ul style=\"padding-left: 20px; margin: 0;\">" + signalsList + "</ul>\n</div>\n" : "") + "\n\n<hr style=\"border: none; border-top: 1px solid #eee; margin: 32px 0 20px;\">\n<div style=\"text-align: center;\">\n  <p style=\"font-size: 12px; color: #888; margin: 0 0 8px;\">\n    <strong style=\"color: #555;\">&#x2B21; PRISMAL</strong> -- Refracting signal from noise\n  </p>\n  <p style=\"margin: 0 0 6px;\">\n    <a href=\"" + data.subscribeUrl + "\" style=\"color: #6C5CE7; font-size: 13px; text-decoration: none; font-weight: 600;\">\n      Subscribe free at " + data.subscribeUrl + "\n    </a>\n  </p>\n  <p style=\"font-size: 11px; color: #aaa; margin: 0;\">\n    Not financial advice &nbsp;&middot;&nbsp; Past performance is not indicative of future results\n  </p>\n</div>\n\n</body>\n</html>";
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
