/**
 * session-nav.js - Open saved sessions in headed browser for manual navigation.
 * Infinitara browses to any program page, scope is captured automatically.
 * Run: node session-nav.js [bugcrowd|intigriti|all]
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SESSION_DIR = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions';
const SCOPE_DIR = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/session-scope';
fs.mkdirSync(SCOPE_DIR, { recursive: true });

async function captureScope(page, platform) {
  await page.waitForTimeout(2000);
  const url = page.url();
  
  // Capture scope from page DOM
  const data = await page.evaluate(() => {
    const text = document.body.innerText;
    const urlRegex = /https?:\/\/[^\s<>"']+/g;
    const urls = (text.match(urlRegex) || []);
    const domainSet = new Set();
    const pathSet = new Set();
    urls.forEach(u => {
      try {
        const url = new URL(u);
        if (!url.hostname.includes('intigriti.com') && !url.hostname.includes('bugcrowd.com') &&
            !url.hostname.includes('google.com') && !url.hostname.includes('youtube.com') &&
            !url.hostname.includes('linkedin.com') && !url.hostname.includes('facebook.com') &&
            !url.hostname.includes('twitter.com') && !url.hostname.includes('vimeo.com')) {
          domainSet.add(url.hostname.replace(/\.$/, ''));
          if (url.pathname !== '/' && url.pathname.length > 1) {
            pathSet.add(url.pathname.split('?')[0]);
          }
        }
      } catch {}
    });
    return {
      title: document.title,
      domains: [...domainSet],
      paths: [...pathSet],
      url: window.location.href
    };
  });
  
  return data;
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'all';
  
  const browsers = [];
  
  if (mode === 'bugcrowd' || mode === 'all') {
    const bcPath = path.join(SESSION_DIR, 'bugcrowd-state.json');
    if (fs.existsSync(bcPath)) {
      const bcBrowser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
      const bcCtx = await bcBrowser.newContext({ storageState: bcPath });
      const bcPage = await bcCtx.newPage();
      
      // Intercept scope data from API calls
      bcCtx.on('response', async r => {
        try {
          const text = await r.text();
          if (text.startsWith('{') && (r.url().includes('target') || r.url().includes('scope') || r.url().includes('asset') || r.url().includes('engagement'))) {
            const filename = 'bc-api-' + Date.now() + '.json';
            fs.writeFileSync(path.join(SCOPE_DIR, filename), JSON.stringify({ url: r.url(), body: JSON.parse(text) }, null, 2));
            console.log('[BC API CAPTURED]', r.url().slice(0, 80));
          }
        } catch {}
      });
      
      await bcPage.goto('https://bugcrowd.com/dashboard', { waitUntil: 'networkidle', timeout: 0 });
      console.log('[Bugcrowd] Dashboard open. Navigate to any engagement, scope auto-captured.');
      console.log('[Bugcrowd] Close browser when done, or type "done" in this terminal to finish.');
      browsers.push({ browser: bcBrowser, name: 'Bugcrowd' });
    }
  }
  
  if (mode === 'intigriti' || mode === 'all') {
    const intPath = path.join(SESSION_DIR, 'intigriti-state.json');
    if (fs.existsSync(intPath)) {
      const intBrowser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
      const intCtx = await intBrowser.newContext({ storageState: intPath });
      const intPage = await intCtx.newPage();
      
      intCtx.on('response', async r => {
        try {
          const text = await r.text();
          if (text.startsWith('{') && (r.url().includes('target') || r.url().includes('scope') || r.url().includes('asset'))) {
            const filename = 'int-api-' + Date.now() + '.json';
            fs.writeFileSync(path.join(SCOPE_DIR, filename), JSON.stringify({ url: r.url(), body: JSON.parse(text) }, null, 2));
            console.log('[INT API CAPTURED]', r.url().slice(0, 80));
          }
        } catch {}
      });
      
      await intPage.goto('https://app.intigriti.com/researcher/dashboard', { waitUntil: 'networkidle', timeout: 0 });
      console.log('[Intigriti] Dashboard open. Navigate to any program page, scope auto-captured.');
      browsers.push({ browser: intBrowser, name: 'Intigriti' });
    }
  }
  
  console.log('\n=== NAVIGATION READY ===');
  console.log('Scope captures will be saved to: ' + SCOPE_DIR);
  console.log('Press Enter in this terminal when done browsing...');
  
  // Wait for user to finish
  await new Promise(resolve => {
    process.stdin.once('data', () => {
      console.log('Closing browsers...');
      browsers.forEach(b => b.browser.close().catch(() => {}));
      resolve();
    });
  });
  
  // Read all captured scope
  const files = fs.readdirSync(SCOPE_DIR).filter(f => f.endsWith('.json'));
  console.log('\n' + files.length + ' scope capture(s) saved:');
  files.forEach(f => console.log('  ' + f));
  
  if (files.length > 0) {
    const allData = {};
    files.forEach(f => {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(SCOPE_DIR, f), 'utf8'));
        const key = f.replace('.json', '');
        allData[key] = d;
      } catch {}
    });
    fs.writeFileSync(path.join(SCOPE_DIR, '_captured.json'), JSON.stringify(allData, null, 2));
    console.log('Merged into _captured.json');
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
