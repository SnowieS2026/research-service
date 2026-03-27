// Post the daily report to BeeHiiv as draft
import * as fs from "fs";
import * as path from "path";
import { createPost, markdownToHtml } from "./src/beehiiv.js";

const reportPath = path.join(__dirname, "reports", "daily", "2026-03-27.md");
const markdown = fs.readFileSync(reportPath, "utf8");
const html = markdownToHtml(markdown);

async function main() {
  console.log("Posting to BeeHiiv as draft...");
  const post = await createPost({
    title: "Prismal — Friday 27 March 2026",
    content: html,
    contentFormat: "html",
    publish: false, // draft mode
  });
  console.log("Done! Post ID:", post.id);
  console.log("Status:", post.status);
  if (post.web_url) console.log("URL:", post.web_url);
}

main().catch(console.error);
