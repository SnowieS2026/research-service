/**
 * inspect-scope-live.mjs — Broad search for scope/reward structure on live Bugcrowd page
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

  // Try to find scope via text content search
  const result = await page.evaluate(() => {
    const results = {};

    // Program name
    const h2 = document.querySelector('h2.bc-my-0');
    results.programName = h2 ? h2.textContent.trim() : null;

    // Look for any element with "In Scope" text
    const inScopeHeader = Array.from(document.querySelectorAll('*')).find(el =>
      el.children.length === 0 && el.textContent.trim() === 'In Scope'
    );
    results.inScopeHeader = inScopeHeader ? inScopeHeader.textContent : null;
    if (inScopeHeader) {
      // get parent and next sibling
      results.inScopeParent = inScopeHeader.parentElement?.className;
      results.inScopeNext = inScopeHeader.nextElementSibling?.className;
      results.inScopeNextHTML = (inScopeHeader.nextElementSibling?.outerHTML || '').substring(0, 500);
    }

    // Reward cards — search more broadly
    const rewardCards = document.querySelectorAll('[class*="reward"]');
    results.rewardCards = Array.from(rewardCards).slice(0,3).map(el => ({
      class: el.className,
      text: el.textContent.trim().substring(0,100)
    }));

    // Look for P1, P2 in text
    const p1Matches = document.querySelectorAll('*');
    const p1 = Array.from(p1Matches).filter(el => el.children.length === 0 && el.textContent.includes('P1'));
    results.p1Text = p1.slice(0,3).map(el => el.textContent.trim());

    // Any links in the main content
    const contentLinks = document.querySelectorAll('#content a[href]');
    results.contentLinks = Array.from(contentLinks).slice(0,10).map(a => ({
      href: a.getAttribute('href'),
      text: a.textContent.trim().substring(0,50)
    }));

    // Any element with "scope" in class
    const scopeEls = document.querySelectorAll('[class*="scope"]');
    results.scopeClasses = Array.from(scopeEls).map(el => el.className).slice(0,5);

    // Try getting body text and finding URLs
    const bodyText = document.body.textContent || '';
    const urlRegex = /https?:\/\/[^\s<>"']+/g;
    const urls = bodyText.match(urlRegex) || [];
    results.foundUrls = [...new Set(urls)].filter(u => u.includes('okta.com') || u.includes('firebase')).slice(0, 10);

    // h2 headings
    const h2s = document.querySelectorAll('h2');
    results.h2s = Array.from(h2s).map(h => h.textContent.trim()).filter(Boolean).slice(0, 10);

    // Target/container elements
    const targetContainers = document.querySelectorAll('[class*="target"]');
    results.targetClasses = Array.from(targetContainers).map(el => el.className).slice(0, 5);

    return results;
  });

  console.log(JSON.stringify({ url: URL, ...result }, null, 2));
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
