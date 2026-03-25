const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const apiCalls = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('capital.com/api') || url.includes('capital.com/graphql') || url.includes('.capital.com')) {
      apiCalls.push({ url, method: req.method() });
    }
  });
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('capital.com/api') && res.request().method() === 'POST') {
      try {
        const text = await res.text();
        apiCalls.push({ url, method: 'RESP', body: text.slice(0, 200) });
      } catch {}
    }
  });
  
  // Navigate to capital.com and wait for API calls
  await page.goto('https://capital.com', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);
  
  // Also navigate to the API login page
  await page.goto('https://capital.com/api/v1', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const seen = new Set();
  const unique = [];
  for (const c of apiCalls) {
    if (!seen.has(c.url)) {
      seen.add(c.url);
      unique.push(c);
    }
  }
  
  console.log('API calls captured: ' + unique.length);
  for (const c of unique) {
    console.log(c.method + ' | ' + c.url + (c.body ? ' => ' + c.body : ''));
  }
  
  // Try GraphQL directly
  console.log('\n--- GraphQL probe ---');
  const gqlReq = await page.request.post('https://capital.com/graphql', {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    data: JSON.stringify({ query: '{ __schema { types { name } } }' }),
    timeout: 8000
  });
  console.log('GraphQL status: ' + gqlReq.status());
  const gqlText = await gqlReq.text();
  console.log('GraphQL response: ' + gqlText.slice(0, 300));
  
  // Try capital.com API endpoint with proper JSON
  const apiReq = await page.request.get('https://capital.com/api/v1/markets', {
    headers: { 'Accept': 'application/json' },
    timeout: 8000
  });
  console.log('\nAPI /markets status: ' + apiReq.status());
  const apiText = await apiReq.text();
  console.log('Response: ' + apiText.slice(0, 300));
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
