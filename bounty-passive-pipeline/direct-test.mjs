// Direct test of the actual collector logic against live site
import { chromium } from '@playwright/test';
import { estimateAdvisories } from './dist/src/osint/collectors/VehicleValuation.js';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const plate = 'KY05YTJ';

  await page.goto('https://www.car-checking.com/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.waitForTimeout(2000);

  const regInput = page.locator('#subForm1');
  await regInput.fill(plate);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(5000);

  const bodyText = await page.locator('body').textContent() ?? '';
  const text = bodyText || '';

  // Simulate the exact collector logic for advisory extraction
  const advisoryLines = [];
  const motBlocks = text.split(/MOT #\d+/i);
  let recentBlock = '';
  for (let i = motBlocks.length - 1; i >= 0; i--) {
    if (motBlocks[i].trim().length > 20) {
      recentBlock = motBlocks[i];
      console.log(`Using block index ${i} (${motBlocks[i].trim().length} chars)`);
      break;
    }
  }

  console.log('\nRecent block preview:');
  console.log(recentBlock.substring(0, 500));

  const adviceMatches = recentBlock.match(/(?:Advice|Advisory) (.{10,200})/gi);
  console.log(`\nAdvice matches found: ${adviceMatches ? adviceMatches.length : 0}`);
  if (adviceMatches) {
    adviceMatches.forEach((m, i) => {
      const item = m.replace(/^(?:Advice|Advisory)\s+/i, '').trim();
      console.log(`  [${i}] "${item}"`);
      advisoryLines.push(item);
    });
  }

  console.log(`\nadvisoryLines collected: ${advisoryLines.length}`);
  advisoryLines.forEach((l, i) => console.log(`  [${i}]: "${l}"`));

  // Test estimateAdvisories directly
  console.log('\nCalling estimateAdvisories...');
  const costs = estimateAdvisories(advisoryLines, 6, 24, 2005, 1248, 'Diesel');
  console.log(`Results: ${costs.length} advisories`);
  costs.forEach((c, i) => {
    console.log(`  [${i}] ${c.item}: £${c.estimatedCostMin}-£${c.estimatedCostMax} (${c.severity})`);
  });

  await browser.close();
}

main().catch(console.error);
