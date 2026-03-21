/**
 * test-live-scope.mjs — verify BugcrowdParser extracts scope from live engagement pages
 * Run: node test-live-scope.mjs
 */
import { chromium } from 'playwright';
import path from 'path';
import { pathToFileURL } from 'url';

// Hardcoded since this lives in the project root
const ROOT = 'C:\\Users\\bryan\\.openclaw\\workspace\\bounty-passive-pipeline';

const URL = process.argv[2] || 'https://bugcrowd.com/engagements/okta';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const parserPath = pathToFileURL(path.join(ROOT, 'dist/src/browser/parsers/BugcrowdParser.js')).href;
  const { BugcrowdParser } = await import(parserPath);
  const parser = new BugcrowdParser();

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  const program = await parser.parse(page, URL);

  console.log(JSON.stringify({
    program_name: program.program_name,
    scope_count: program.scope_assets.length,
    scope_assets: program.scope_assets,
    exclusions: program.exclusions,
    reward_range: program.reward_range,
    reward_currency: program.reward_currency,
    description: (program.description || '').substring(0, 100)
  }, null, 2));

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
