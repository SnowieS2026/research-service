// Ingest geopolitics profiles and news into vector store
// Usage: npx tsx ingest-geopolitics.ts

import { pipeline } from './src/vector-store.js';
import * as path from 'path';
import * as fs from 'fs';

const GEOPOLITICS = 'C:\\Users\\bryan\\.openclaw\\workspace\\geopolitics\\countries';

async function main() {
  console.log('\n=== Geopolitics Vector Ingestion ===\n');

  const dirs = (fs.readdirSync(GEOPOLITICS) as string[]).filter(d =>
    fs.statSync(path.join(GEOPOLITICS, d)).isDirectory()
  );

  console.log(`Found ${dirs.length} countries\n`);

  let profiles = 0;
  let news = 0;

  for (const country of dirs.sort()) {
    const base = path.join(GEOPOLITICS, country);

    const profilePath = path.join(base, 'profile.md');
    if (fs.existsSync(profilePath)) {
      const content = fs.readFileSync(profilePath, 'utf8').slice(0, 15000);
      await pipeline.add([{
        id: `geopolitics:${country}:profile`,
        content,
        metadata: { type: 'geopolitical_profile', country, file: 'profile.md', ingestedAt: Date.now() },
      }]);
      profiles++;
      console.log(`  [profile] ${country}`);
    }

    const newsPath = path.join(base, 'news-30days.md');
    if (fs.existsSync(newsPath)) {
      const content = fs.readFileSync(newsPath, 'utf8').slice(0, 10000);
      await pipeline.add([{
        id: `geopolitics:${country}:news`,
        content,
        metadata: { type: 'geopolitical_news', country, file: 'news-30days.md', ingestedAt: Date.now() },
      }]);
      news++;
      console.log(`  [news]    ${country}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  const total = await pipeline.count();
  console.log(`\nIndexed: ${profiles} profiles + ${news} news reports`);
  console.log(`Pipeline collection total: ${total} documents\n`);
}

main().catch(console.error);
