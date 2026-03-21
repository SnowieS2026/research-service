import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import path from 'path';
const ROOT = process.cwd();
const FIXTURE = path.join(ROOT, 'fixtures', 'html', 'intigriti-real.html');
async function main() {
    const html = readFileSync(FIXTURE, 'utf8');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(html);
    await page.waitForTimeout(2000);
    console.log('=== INTIGRITI PAGE STRUCTURE ===\n');
    // Program name
    const titleEl = await page.locator('h1, [class*="title"], [class*="program"]').first().textContent().catch(() => null);
    console.log('Program title (h1/.title/.program):', titleEl);
    // Reward range
    const rewardEl = await page.locator('[class*="reward"], [class*="bounty"], [class*="payout"], [class*="range"]').first().textContent().catch(() => null);
    console.log('Reward elements:', rewardEl);
    // Scope — look for in-scope section
    const inScopeEl = await page.locator('[class*="in-scope"], [class*="scope"]:not([class*="out"]), input[readonly]').allTextContents().catch(() => []);
    console.log('In-scope elements:', inScopeEl.slice(0, 5));
    // Table cells (asset listings are often in tables)
    const tableCells = await page.locator('td').allTextContents().catch(() => []);
    console.log('Table cells (first 10):', tableCells.slice(0, 10));
    // Any element with asset/URL-like text
    const links = await page.locator('a[href*="."]').allTextContents().catch(() => []);
    console.log('Links with dots in href (first 10):', links.slice(0, 10));
    // aria-label or data-testid attributes
    const dataTests = await page.locator('[data-testid]').all().catch(() => []);
    console.log('data-testid count:', dataTests.length);
    if (dataTests.length > 0) {
        const firstFew = await Promise.all(dataTests.slice(0, 5).map((el) => el.getAttribute('data-testid')));
        console.log('data-testid values:', firstFew);
    }
    // class names that appear to be platform/component names
    const classNames = await page.evaluate(() => {
        const els = document.querySelectorAll('[class]');
        const classes = new Set();
        els.forEach(el => el.classList.forEach(c => classes.add(c)));
        return [...classes].filter(c => c.length < 50).slice(0, 50);
    });
    console.log('CSS classes (sample):', classNames);
    await browser.close();
}
main().catch(err => { console.error(err); process.exit(1); });
