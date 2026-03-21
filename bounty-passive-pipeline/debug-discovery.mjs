/**
 * debug-discovery.mjs — test what the pipeline discovers
 */
import { pathToFileURL } from 'url';
import path from 'path';

const ROOT = 'C:\\Users\\bryan\\.openclaw\\workspace\\bounty-passive-pipeline';

const { MetadataBrowser } = await import(pathToFileURL(path.join(ROOT, 'dist/src/browser/MetadataBrowser.js')).href);
const { getAdapter } = await import(pathToFileURL(path.join(ROOT, 'dist/src/browser/parsers/PlatformAdapters.js')).href);
const { seedFromTargets } = await import(pathToFileURL(path.join(ROOT, 'dist/src/SeedingDiscovery.js')).href);

const TARGETS = [
  'https://bugcrowd.com/engagements/okta',
  'https://bugcrowd.com/engagements/zendesk',
];

async function main() {
  console.log('=== Testing scope extraction ===');
  const browser = new MetadataBrowser();
  await browser.init();

  try {
    const seeded = seedFromTargets(TARGETS);
    console.log(`seeded: ${seeded.length}`);

    for (const seed of seeded) {
      const page = await browser.navigate(seed.url);
      const parser = getAdapter('bugcrowd');
      const program = await parser.parse(page, seed.url);
      console.log(`\n${seed.url}`);
      console.log(`  name: ${program.program_name}`);
      console.log(`  scope: ${program.scope_assets.length} assets`);
      if (program.scope_assets.length > 0) {
        console.log(`  first scope: ${program.scope_assets[0]}`);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
