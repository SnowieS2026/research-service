const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json' });
  const page = await ctx.newPage();
  
  // Go to capital.com and find the service-point sync code
  const apiCalls = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('service-point') || url.includes('capital.com/api')) {
      apiCalls.push({ url, method: req.method(), postData: req.postData() });
    }
  });
  
  // Navigate to capital.com  
  await page.goto('https://capital.com', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('API calls with service-point:');
  for (const c of apiCalls) {
    if (c.url.includes('service-point')) {
      console.log('\nURL: ' + c.url);
      console.log('Method: ' + c.method);
      console.log('PostData: ' + (c.postData || 'none'));
    }
  }
  
  // Try to extract the full payload from sync
  const syncCall = apiCalls.find(c => c.url.includes('service-point'));
  if (syncCall) {
    console.log('\nFull sync payload:');
    console.log(JSON.stringify(syncCall, null, 2));
  } else {
    console.log('No service-point calls found');
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
