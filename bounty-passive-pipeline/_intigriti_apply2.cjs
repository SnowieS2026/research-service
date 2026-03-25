const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json' });
  const page = await ctx.newPage();
  
  // Visit a page first to get CSRF token from headers
  await page.goto('https://app.intigriti.com/researcher/programs', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // Extract CSRF from page meta tag
  const csrfFromPage = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.content : null;
  });
  
  // Also try from headers
  const cookies = await ctx.cookies();
  const csrfCookie = cookies.find(c => c.name === '__Host-Intigriti.CsrfToken.Researcher');
  console.log('CSRF from meta: ' + (csrfFromPage ? csrfFromPage.slice(0, 20) + '...' : 'none'));
  console.log('CSRF from cookie: ' + (csrfCookie ? csrfCookie.value.slice(0, 20) + '...' : 'none'));
  
  // Programs to apply to
  const programs = ['grafanaossbbp', 'intel', 'dropbox', 'digitalocean', 'monzopublicbugbountyprogram'];
  
  for (const prog of programs) {
    // Visit program page to get fresh token
    await page.goto('https://app.intigriti.com/researcher/programs/' + prog, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1000);
    
    const token = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="csrf-token"]');
      return meta ? meta.content : null;
    });
    
    if (!token) {
      console.log('\nNo CSRF for ' + prog + ' - checking if page loaded...');
      const url = page.url();
      console.log('URL: ' + url);
      continue;
    }
    
    console.log('\n=== Applying to ' + prog + ' ===');
    try {
      const r = await page.request.post('https://app.intigriti.com/api/core/researcher/applications', {
        data: JSON.stringify({ programHandle: prog }),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://app.intigriti.com/researcher/programs/' + prog,
        }
      });
      const t = await r.text();
      console.log('Status: ' + r.status() + ' | ' + t.slice(0, 200));
    } catch (e) {
      console.log('Error: ' + e.message.slice(0, 80));
    }
    
    await page.waitForTimeout(500);
  }
  
  // Check final applications
  console.log('\n=== Final Applications List ===');
  try {
    const r = await page.request.get('https://app.intigriti.com/api/core/researcher/applications', {
      headers: { 'Accept': 'application/json' }
    });
    const t = await r.text();
    console.log('Status: ' + r.status() + ' | ' + t.slice(0, 500));
  } catch (e) {
    console.log('Error: ' + e.message.slice(0, 80));
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
