// Quick Playwright probe to check MOT sources
import { chromium } from '@playwright/test';

const SITES = [
    { name: 'gov.uk MOT check', url: 'https://www.check-mot.service.gov.uk/' },
    { name: 'car-checking.com', url: 'https://www.car-checking.com/' },
    { name: 'cartell.ie UK check', url: 'https://www.cartell.ie' },
    { name: 'mot1.co.uk', url: 'https://www.mot1.co.uk' },
];

for (const site of SITES) {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        // Set realistic user agent
        await page.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' });
        
        const resp = await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        console.log(`${site.name}: ${resp.status()} | title: ${await page.title()}`);
        
        // Check if there's a registration form
        const forms = await page.locator('form').count();
        const inputs = await page.locator('input').count();
        console.log(`  Forms: ${forms}, Inputs: ${inputs}`);
        
        await browser.close();
    } catch (err) {
        if (browser) await browser.close().catch(() => {});
        console.log(`${site.name}: ERROR - ${err.message}`);
    }
}
