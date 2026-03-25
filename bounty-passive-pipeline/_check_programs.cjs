const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // === INTIGRITI ===
  console.log('=== INTIGRITI ===');
  const intCtx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json'
  });
  const intPage = await intCtx.newPage();
  
  await intPage.goto('https://app.intigriti.com/researcher/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await intPage.waitForTimeout(2000);
  
  // Look for program links
  const intPrograms = await intPage.evaluate(() => {
    // Look for company/program names in the page
    const text = document.body.innerText;
    const lines = text.split('\n').filter(l => l.trim().length > 2 && l.trim().length < 80);
    return lines.slice(0, 50);
  });
  console.log('Intigriti dashboard text sample:');
  intPrograms.forEach(l => console.log('  ' + l));
  
  // Try to find specific company links
  const companyLinks = await intPage.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/companies/"], a[href*="/programs/"]');
    const results = [];
    links.forEach(a => {
      if (a.href && !a.href.includes('overview') && !a.href.includes('invites')) {
        results.push(a.href + ' | ' + a.textContent.trim());
      }
    });
    return results.slice(0, 20);
  });
  console.log('\nCompany links:');
  companyLinks.forEach(l => console.log('  ' + l));
  
  // === BUGCROWD ===
  console.log('\n=== BUGCROWD ===');
  const bcCtx = await browser.newContext({
    storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/bugcrowd-state.json'
  });
  const bcPage = await bcCtx.newPage();
  
  // Try Bugcrowd API v4
  await bcPage.goto('https://bugcrowd.com/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await bcPage.waitForTimeout(3000);
  
  const bcPrograms = await bcPage.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/engagements/"]');
    const results = [];
    links.forEach(a => {
      const slug = a.href.replace('https://bugcrowd.com/engagements/', '');
      if (slug && !slug.includes('/') && slug.length > 2) {
        results.push(slug);
      }
    });
    return [...new Set(results)];
  });
  console.log('Bugcrowd engagements:', bcPrograms);
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
