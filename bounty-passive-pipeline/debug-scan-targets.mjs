/**
 * debug-scan-targets.mjs — check if scope_assets are being collected
 */
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';

const ROOT = 'C:\\Users\\bryan\\.openclaw\\workspace\\bounty-passive-pipeline';
const PROGRAM_URL = 'https://bugcrowd.com/engagements/okta';

async function main() {
  const { MetadataBrowser } = await import(pathToFileURL(path.join(ROOT, 'dist/src/browser/MetadataBrowser.js')).href);
  const { getAdapter } = await import(pathToFileURL(path.join(ROOT, 'dist/src/browser/parsers/PlatformAdapters.js')).href);

  const browser = new MetadataBrowser();
  await browser.init();

  const page = await browser.navigate(PROGRAM_URL);
  const parser = getAdapter('bugcrowd');
  const program = await parser.parse(page, PROGRAM_URL);

  console.log('scope_assets:', JSON.stringify(program.scope_assets, null, 2));
  console.log('scope_count:', program.scope_assets.length);
  console.log('program_name:', program.program_name);

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
