// Generate paste-ready HTML from the markdown report -- with SEO meta tags
const path = require("path");
const fs = require("fs");
const { markdownToHtml } = require("./beehiiv.js");

const mdPath = path.join(__dirname, "..", "reports", "daily", "2026-03-27.md");
const md = fs.readFileSync(mdPath, "utf8");
const html = markdownToHtml(md);

// Extract SEO block from markdown footer (<!-- ... -->)
const seoMatch = md.match(/<!--\s*([\s\S]*?)-->\s*$/);
let seoTitle = "Prismal -- Daily Newsletter";
let seoDescription = "Sharp analysis on tech, finance, and geopolitics -- for readers who want the real picture, faster.";
let seoKeywords = "daily newsletter, tech news, finance news, geopolitics, market analysis";

if (seoMatch) {
  const block = seoMatch[1];
  const titleMatch = block.match(/title:\s*(.+)/);
  const descMatch = block.match(/description:\s*(.+)/);
  const kwMatch = block.match(/keywords:\s*(.+)/);
  if (titleMatch) seoTitle = titleMatch[1].trim();
  if (descMatch) seoDescription = descMatch[1].trim().slice(0, 200);
  if (kwMatch) seoKeywords = kwMatch[1].trim();
}

// If no SEO block in markdown, extract from content
if (!seoMatch) {
  const titleMatch = html.match(/<h3[^>]*>([^<]+)<\/h3>/);
  if (titleMatch) seoTitle = titleMatch[1].trim() + " -- Prismal";
  const paraMatch = html.match(/<p>([^<]{80,200})<\/p>/);
  if (paraMatch) seoDescription = paraMatch[1].trim();
}

const dateStr = "2026-03-27";
const canonicalUrl = "https://prismal.beehiiv.com";

const seoTags = `\
  <!-- SEO Meta Tags -->
  <title>${seoTitle}</title>
  <meta name="description" content="${seoDescription}">
  <meta name="keywords" content="${seoKeywords}">
  <meta name="author" content="Prismal">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${seoTitle}">
  <meta property="og:description" content="${seoDescription}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="Prismal">
  <meta property="article:published_time" content="${dateStr}">
  <meta property="article:section" content="Tech x Finance x Geopolitics">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${seoTitle}">
  <meta name="twitter:description" content="${seoDescription}">
  <meta name="twitter:site" content="@prismal">
`;

// Insert after charset meta
const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${seoTags}
</head>
<body style="font-family: Georgia, serif; max-width: 680px; margin: 0 auto; padding: 20px; color: #1a1a1a; line-height: 1.6;">
${html}
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, "..", "publish-manually.html"), fullHtml, "utf8");
console.log("Written: publish-manually.html with SEO tags");
console.log("Title:", seoTitle);
console.log("Description:", seoDescription.slice(0, 80) + "...");
console.log("Keywords:", seoKeywords);