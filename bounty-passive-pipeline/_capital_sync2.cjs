const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const responses = [];
  page.on('response', async res => {
    if (res.url().includes('service-point')) {
      try {
        const text = await res.text();
        responses.push({ url: res.url(), status: res.status(), body: text.slice(0, 300) });
      } catch {}
    }
  });
  
  await page.goto('https://capital.com', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('Sync responses:');
  responses.forEach(r => {
    console.log('\nStatus: ' + r.status);
    console.log('URL: ' + r.url);
    console.log('Body: ' + r.body);
  });
  
  // Now try to decode all the base64 payloads we've seen
  const payloads = [
    'W3siZXZlbnROYW1lIjoiZG9tUmVhZHkiLCJ0aW1lc3RhbXAiOjE3NzQ0NjExNjI1MzMsInRpbWV6b25lIjowLCJ0eXBlIjoiZG9tLXJlYWR5IiwidXJsIjoiaHR0cHM6Ly9jYXBpdGFsLmNvbS9lbi1nYiIsInVzZXJBZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIEhlYWRsZXNzQ2hyb21lLzE0NS4wLjc2MzIuNiBTYWZhcmkvNTM3LjM2IiwiZGV2aWNlSWQiOiIyY2M1N2I4Zi1lOTVhLTRhMmItYTgwNS1kN2U3YmQ2NjEzMGMiLCJyZXF1ZXN0SWQiOiJkYTZjYzA3MTFhNjk2ODE5ZDRhZGFjMTU4MWE0ZGZmZCJ9XQ==',
    'eNotj81uwjAQhF/FygkkktiJYydwQj2UisKhReJQ9bCxN2CRvzqGFqq+ex3a485+M7P79h1ovBiFTzqYB4lSmSzzKsQig5BDUoaQ0yzUEmWphWApVcEswAu2bgsNeotpHVpQznTtC4K++rXFjzMO7p6oQShFJWMgCpGzQnPQoFiWM+C6qrTHnWk8DU0fzJmUnAvGRCKT4m9z61pfQ/1w7ce+41VbGNu882zrUXGuH+ZxrKA3DupIdU2MbXgoR2JAuzz4az236W6mriHOIkome9Pq7nMg2x1hNKIL4gXBF+RL8ClZ9n2NeyzXxsVZKqNUkMl6tds8z0htTkgeUZ26KVn5f2schoej7RqMGffJkRRpEgnyChVY8+8Oft5/AURCbc0=',
    'eNrtlltP2zAUx79KlCeQSBqnzqXlCdgEE4xNg8EDIGQ7J61HGmeOQ7mI776TCytM65gGWpHoY87Nf5/zO1ZObu0ELqWAD4k9tH0hgojHqQODgDmU+dxhsRc4SQQRT8KQ9D1hr9lwCbnZZxPAlBLKUqocrRq+V1CaplDCQiG8iBAWDsKYDBLKEiZIEBNGkzRNMJwVxWaVJ1l7slATV7BCGpa5U+ClNNDGHIFu6g9t4hI3rp2u1++RyCXBMIgwqGAj+KozjBgbU5TDXu++EBbtQe6MOEZ1Ot830quJPfR+2loBUZJQ4L6TpH7g0JhSh1GROsQLkogBDxmvr27kBO/IJoU9JFFEaUhISAcBaT03KoemclWC3hjhUVj5o7qRWcZ6getZK8cyT9S0tPYPLeK53rqFhpCuW1chXbU2iiKDY+C70vSCfuT2Q2tld+fw496alckLsLZBXKhVawcYtq0st8ZaTaBHKFZ2o7Dvu6F1wFKmZZc9u/aWBmYgeSSaDtAtNED+BUqVVaZrsx97V5HvYTLXKBU0GtujZqY9JRhKQM/JqY0t3t48tc9m7gdDeyAO/S1rnzNmUqVxCHbXD3Sp8pfPWZGuWfbd2nNprVk5kjBdIK4Zy0cVysAQqNcma1rZfLWk1hq3cFojpa9rqLHxtanzfOLfQDSqwzhoTQcVF3Pj/2EzyAtuRui9zs14Pkq8MgYXK5PiYknTH2jyX4ymgHr0tb6zsnwHE2UPU5aVgDdWlRbQjLbKjb4+L6fSiDHo8zEWxScVx2uMlghR/YredjRtiO4Rnp8mcwOa3ceVYzW175Yw/y+Y+28aZm7yDsTzTI1k/hTFv4lf4rtIfOkS3796fh9FLpFdJLLBm0b2vn9Io1bnnOX50/DOyVlivEiMw7f9F8yf/OHl8xA9+wHiR9o/',
  ];
  
  console.log('\n=== Decoding captured payloads ===');
  for (const p of payloads) {
    try {
      const decoded = Buffer.from(p, 'base64').toString('utf8');
      console.log('\nPayload: ' + p.slice(0, 30) + '...');
      console.log('Decoded: ' + decoded.slice(0, 400));
    } catch (e) {
      console.log('Decode error: ' + e.message);
    }
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
