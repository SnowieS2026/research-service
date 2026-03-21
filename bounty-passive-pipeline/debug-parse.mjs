/**
 * debug-parse.mjs — Debug scope extraction for a single program.
 */
import { chromium } from 'playwright';
import { BugcrowdParser } from './dist/src/browser/parsers/BugcrowdParser.js';

const parser = new BugcrowdParser();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const url = 'https://bugcrowd.com/engagements/zendesk';
console.log('Loading:', url);

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

const result = await parser.parse(page, url);

console.log('Program:', result.program_name);
console.log('Scope assets:', result.scope_assets.length);
for (const a of result.scope_assets) console.log(' -', a);
console.log('Rewards:', result.reward_range);

await browser.close();
