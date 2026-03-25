const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const SCOPE_DIR = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/session-scope';
  const intPath = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/intigriti-state.json';
  
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const ctx = await browser.newContext({ storageState: intPath });
  const page = await ctx.newPage();

  console.log('Browser open on Intigriti. Navigate to programs and click on each one.');
  console.log('When on a program page, wait 3 seconds then press SPACE in this terminal.');
  console.log('The scope will be extracted from the page.');
  console.log('Type "done" when finished.\n');

  let captured = [];
  
  // Listen for space key to trigger capture
  const readline = require('readline');
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    require('tty').setRawMode(true);
  }
  
  process.stdin.on('keypress', async (str, key) => {
    if (key.name === 'space') {
      // Extract scope from current page
      const data = await page.evaluate(() => {
        const results = { url: window.location.href, title: document.title, domains: [], paths: [] };
        
        // Method 1: Look for scope table/list items
        const items = document.querySelectorAll('[class*="scope"], [class*="target"], [class*="asset"], [class*="domain"], [data-testid*="scope"]');
        items.forEach(el => {
          const text = el.innerText || '';
          const links = el.querySelectorAll('a[href]');
          links.forEach(a => {
            try {
              const u = new URL(a.href);
              if (!u.hostname.includes('intigriti.com')) {
                results.domains.push(u.hostname);
                if (u.pathname !== '/') results.paths.push(u.pathname);
              }
            } catch {}
          });
          // Also grab text that looks like URLs
          const urls = text.match(/https?:\/\/[^\s<>"']+/g);
          if (urls) {
            urls.forEach(u => {
              try {
                const url = new URL(u);
                if (!url.hostname.includes('intigriti.com')) {
                  results.domains.push(url.hostname);
                }
              } catch {}
            });
          }
        });
        
        // Method 2: Get all text and extract domains
        const text = document.body.innerText;
        const domainMatches = text.match(/[a-z0-9][a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?/gi) || [];
        domainMatches.forEach(d => {
          if (!d.includes('intigriti') && !d.includes('google') && !d.includes('youtube') && d.length < 100) {
            try {
              const url = new URL(d.startsWith('http') ? d : 'https://' + d);
              if (!url.hostname.includes('intigriti.com')) {
                results.domains.push(url.hostname);
              }
            } catch {
              // Might just be a domain string
              if (d.includes('.')) {
                results.domains.push(d.split('/')[0].replace(/\.$/, ''));
              }
            }
          }
        });
        
        // Dedupe
        results.domains = [...new Set(results.domains)];
        results.paths = [...new Set(results.paths)];
        return results;
      });
      
      console.log('\n--- CAPTURED ---');
      console.log('URL:', data.url);
      console.log('Title:', data.title);
      console.log('Domains:', data.domains.length, data.domains.slice(0, 10));
      console.log('Paths:', data.paths.length, data.paths.slice(0, 10));
      
      if (data.domains.length > 0) {
        const slug = data.url.split('/').pop() || 'unknown';
        const filename = 'scope-' + slug + '.json';
        fs.writeFileSync(path.join(SCOPE_DIR, filename), JSON.stringify(data, null, 2));
        console.log('Saved:', filename);
        captured.push(data);
      }
    } else if (key.name === 'return' || str === 'done') {
      console.log('\nDone. Closing...');
      await browser.close();
      process.exit(0);
    }
  });
  
  console.log('Ready. Press SPACE on program pages to capture scope, ENTER or "done" to finish.\n');
})().catch(e => { console.error(e.message); process.exit(1); });
