/**
 * debug-live-scope.mjs — inspect what BugcrowdParser sees on a live engagement page
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const URL = process.argv[2] || 'https://bugcrowd.com/engagements/okta';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  const html = await page.content();
  console.error(`HTML length: ${html.length}`);

  // Try the actual evaluate from BugcrowdParser
  const result = await page.evaluate(() => {
    try {
      // h2.bc-my-0
      const h2 = document.querySelector('h2.bc-my-0');
      const programName = h2 ? h2.textContent.trim() : null;

      // Rewards
      const rewardCards = document.querySelectorAll('.bc-p-3.bc-reward-card');
      const rewards = [];
      for (const card of rewardCards) {
        const label = card.querySelector('.bc-label');
        const amount = card.querySelector('.bc-amount');
        if (label && amount) {
          rewards.push({ priority: label.textContent.trim(), amount: amount.textContent.trim() });
        }
      }

      // bc-targets a[href]
      const targetLinks = document.querySelectorAll('.bc-targets a[href]');
      const scopeAssets = [];
      for (const a of targetLinks) {
        const href = a.getAttribute('href') || '';
        if (href.startsWith('http')) scopeAssets.push(href);
      }

      // Out of scope
      const outScopeEls = document.querySelectorAll('.bc-out-of-scope p');
      const exclusions = [];
      for (const p of outScopeEls) {
        const t = p.textContent.trim();
        if (t) exclusions.push(t);
      }

      // Section text fallback
      const targetsSection = document.querySelector('.bc-targets');
      const sectionText = targetsSection ? targetsSection.textContent.trim().substring(0, 500) : '';

      return { programName, rewards, scopeAssets, exclusions, sectionText, found: true };
    } catch(e) {
      return { error: e.message, found: false };
    }
  });

  console.log(JSON.stringify({ url: URL, ...result }, null, 2));
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
