const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const SCOPE_DIR = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/session-scope';
  const intPath = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json';
  
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const ctx = await browser.newContext({ storageState: intPath });
  const page = await ctx.newPage();
  
  await page.goto('https://app.intigriti.com/researcher/dashboard', { waitUntil: 'networkidle', timeout: 0 });

  console.log('Intigriti open. Browse to any program page.');
  console.log('Scope auto-captured every time the URL changes.');
  console.log('Close browser when done...');
  
  let lastUrl = '';
  let captured = [];
  
  // Watch for URL changes and capture scope
  setInterval(async () => {
    try {
      const url = page.url();
      if (url !== lastUrl && url.includes('program')) {
        lastUrl = url;
        await page.waitForTimeout(3000); // Wait for content to load
        
        const data = await page.evaluate(() => {
          const results = { url: window.location.href, title: document.title, domains: [] };
          
          // Get all text and extract domains/URLs
          const text = document.body.innerText;
          const urlMatches = text.match(/https?:\/\/[^\s<>"']+/g) || [];
          const domainSet = new Set();
          
          urlMatches.forEach(u => {
            try {
              const url = new URL(u);
              if (!url.hostname.includes('intigriti.com') && 
                  !url.hostname.includes('google.com') &&
                  !url.hostname.includes('youtube.com') &&
                  !url.hostname.includes('linkedin.com') &&
                  !url.hostname.includes('facebook.com') &&
                  !url.hostname.includes('twitter.com') &&
                  !url.hostname.includes('vimeo.com') &&
                  !url.hostname.includes('cookieyes.com') &&
                  u.length < 200) {
                domainSet.add(url.hostname.replace(/\.$/, ''));
              }
            } catch {}
          });
          
          // Also look for domain strings in text
          const domainRegex = /\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z]{2,}(?:\/[^\s]*)?\b/gi;
          const textDomains = text.match(domainRegex) || [];
          textDomains.forEach(d => {
            const clean = d.toLowerCase();
            if (!clean.includes('intigriti') && !clean.includes('google') && clean.length < 100) {
              domainSet.add(d.split('/')[0].replace(/\.$/, ''));
            }
          });
          
          results.domains = [...domainSet];
          return results;
        });
        
        const slug = data.url.split('/').filter(Boolean).slice(-1)[0] || 'unknown';
        const filename = 'scope-' + Date.now() + '-' + slug + '.json';
        fs.writeFileSync(path.join(SCOPE_DIR, filename), JSON.stringify(data, null, 2));
        console.log('[CAPTURED] ' + slug + ' | ' + data.domains.length + ' domains: ' + data.domains.slice(0, 3).join(', '));
        captured.push(data);
      }
    } catch {}
  }, 2000);
  
  // Keep alive
  await new Promise(() => {});
})().catch(e => { console.error(e.message); process.exit(1); });
