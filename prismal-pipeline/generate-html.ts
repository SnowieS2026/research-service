// Generate paste-ready HTML from the markdown report
import * as fs from "fs";
import { markdownToHtml } from "./src/compiler-daily.js";

const md = fs.readFileSync("reports/daily/2026-03-27.md", "utf8");
const html = markdownToHtml(md);

// Wrap in full HTML document
const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Prismal — Friday 27 March 2026</title>
</head>
<body style="font-family: Georgia, serif; max-width: 680px; margin: 0 auto; padding: 20px; color: #1a1a1a; line-height: 1.6;">
${html}
</body>
</html>`;

fs.writeFileSync("publish-manually.html", fullHtml, "utf8");
console.log("Written: publish-manually.html");
