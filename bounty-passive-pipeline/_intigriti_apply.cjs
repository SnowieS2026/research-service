const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json' });
  const page = await ctx.newPage();
  
  // Get CSRF token from cookies
  const cookies = await ctx.cookies();
  const csrfToken = cookies.find(c => c.name === '__Host-Intigriti.CsrfToken.Researcher');
  const session = cookies.find(c => c.name === '__Host-Intigriti.Session');
  console.log('CSRF: ' + (csrfToken ? csrfToken.value.slice(0,20) + '...' : 'none'));
  console.log('Session: ' + (session ? session.value.slice(0,20) + '...' : 'none'));
  
  // Try to apply to Grafana OSS BBP
  console.log('\n=== Applying to grafanaossbbp ===');
  try {
    const r = await page.request.post('https://app.intigriti.com/api/core/researcher/applications', {
      data: JSON.stringify({ programHandle: 'grafanaossbbp' }),
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken ? csrfToken.value : '',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://app.intigriti.com/researcher/programs',
      }
    });
    console.log('Status: ' + r.status());
    const t = await r.text();
    console.log('Response: ' + t.slice(0, 300));
  } catch (e) {
    console.log('Error: ' + e.message.slice(0, 100));
  }
  
  // Try applying to intel
  console.log('\n=== Applying to intel ===');
  try {
    const r = await page.request.post('https://app.intigriti.com/api/core/researcher/applications', {
      data: JSON.stringify({ programHandle: 'intel' }),
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken ? csrfToken.value : '',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://app.intigriti.com/researcher/programs',
      }
    });
    console.log('Status: ' + r.status());
    const t = await r.text();
    console.log('Response: ' + t.slice(0, 300));
  } catch (e) {
    console.log('Error: ' + e.message.slice(0, 100));
  }
  
  // Try applying to dropbox
  console.log('\n=== Applying to dropbox ===');
  try {
    const r = await page.request.post('https://app.intigriti.com/api/core/researcher/applications', {
      data: JSON.stringify({ programHandle: 'dropbox' }),
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken ? csrfToken.value : '',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://app.intigriti.com/researcher/programs',
      }
    });
    console.log('Status: ' + r.status());
    const t = await r.text();
    console.log('Response: ' + t.slice(0, 300));
  } catch (e) {
    console.log('Error: ' + e.message.slice(0, 100));
  }
  
  // Check what applications already exist
  console.log('\n=== Current Applications ===');
  try {
    const r = await page.request.get('https://app.intigriti.com/api/core/researcher/applications', {
      headers: { 'Accept': 'application/json' }
    });
    console.log('Status: ' + r.status());
    const t = await r.text();
    console.log('Response: ' + t.slice(0, 500));
  } catch (e) {
    console.log('Error: ' + e.message.slice(0, 100));
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
