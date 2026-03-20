// Diagnostic: check MOT block positions in the raw text
// Run from project root
import { chromium } from '@playwright/test';

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
  console.log('Full bodyText length:', bodyText.length);

  // Find MOT block positions
  const motBlockPattern = /MOT #\d+/gi;
  const blocks = bodyText.split(/MOT #\d+/i);
  console.log('Number of MOT blocks:', blocks.length);
  blocks.forEach((b, i) => {
    console.log(`Block ${i} length: ${b.trim().length} chars, first 80 chars: "${b.trim().substring(0, 80)}"`);
  });

  // Find last non-empty block
  let recentBlock = '';
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (blocks[i].trim().length > 20) {
      recentBlock = blocks[i];
      console.log(`\nUsing block index ${i}, first 400 chars:`);
      console.log(recentBlock.substring(0, 400));
      break;
    }
  }

  // Clean and test
  const cleaned = recentBlock
    .replace(/\bMOT\s*#?\d*\b/gi, ' ')
    .replace(/\bMOT test\b/gi, ' ')
    .replace(/\b\d+\.\d+\.\d+\s*\([a-z]\)\s*\([i]+\)/gi, ' ')
    .replace(/\b\d+\.\d+\.\d+\s*\([a-z]\)/gi, ' ')
    .replace(/\b\d+\.\d\s*\([a-z]\s*\([i]+\)\)/gi, ' ')
    .replace(/\b(nearside|offside|both|front|rear|ns|os)\b/gi, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(?:mm|cm|mph|bhp|cc|rpm|mpg|km|l|kg)\b/gi, ' ')
    .replace(/\b\d{3}\/\d{2}[R\-]\d{2}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  console.log('\nCleaned recent block:');
  console.log(cleaned.substring(0, 400));

  // Test key keywords
  const testKw = ['tyre slightly damaged', 'perishing', 'brake cable damaged', 'brake pipe corroded', 'brake hose slight corrosion', 'headlamp lens slightly defective', 'surface corrosion', 'worn close to legal limit'];
  const lower = cleaned.toLowerCase();
  console.log('\nKeyword tests:');
  testKw.forEach(kw => console.log(`  "${kw}": ${lower.includes(kw) ? 'FOUND' : 'MISS'}`));

  await browser.close();
}

main().catch(console.error);
