const { chromium } = require('playwright');

const REG = 'KY05YTJ';
const SITES = [
  { name: 'motorist.co.uk', url: 'https://www.motorist.co.uk/mot-check' },
  { name: 'rac.co.uk', url: 'https://www.rac.co.uk/car-check/mot-check/' },
  { name: 'confused.com', url: 'https://www.confused.com/car-insurance/car-check' },
  { name: 'moneysupermarket.com', url: 'https://www.moneysupermarket.com/vehicles/check/' },
  { name: 'uswitch.com', url: 'https://www.uswitch.com/cars/check/' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const results = [];

  for (const site of SITES) {
    const page = await context.newPage();
    const result = { name: site.name, url: site.url };

    // Collect console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Collect anti-bot signals
    let cloudflare = false, incapsula = false, recaptcha = false, hcaptcha = false;

    page.on('response', resp => {
      const url = resp.url().toLowerCase();
      if (url.includes('cloudflare') || url.includes('challenges.cloudflare')) cloudflare = true;
      if (url.includes('incapsula')) incapsula = true;
      if (url.includes('recaptcha') || url.includes('google.com/recaptcha')) recaptcha = true;
      if (url.includes('hcaptcha')) hcaptcha = true;
    });

    try {
      console.log(`\n=== Testing: ${site.name} ===`);
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      // Detect anti-bot
      const pageContent = await page.content();
      const cfNotice = await page.$('[data-js-cf-alert]');
      const bodyText = await page.textContent('body').catch(() => '');

      if (bodyText.toLowerCase().includes('cloudflare') || bodyText.toLowerCase().includes('checking your browser')) cloudflare = true;
      if (bodyText.toLowerCase().includes('incapsula') || bodyText.toLowerCase().includes('access denied')) incapsula = true;
      if (bodyText.toLowerCase().includes('recaptcha')) recaptcha = true;
      if (bodyText.toLowerCase().includes('hcaptcha')) hcaptcha = true;

      // Find registration input fields
      const inputs = await page.$$('input');
      const inputInfo = [];
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const name = await input.getAttribute('name');
        const type = await input.getAttribute('type');
        const placeholder = await input.getAttribute('placeholder');
        const ariaLabel = await input.getAttribute('aria-label');
        inputInfo.push({ id, name, type, placeholder, ariaLabel });
      }

      // Look for form submit buttons
      const buttons = await page.$$('button, input[type="submit"], a[role="button"]');
      const buttonInfo = [];
      for (const btn of buttons) {
        const text = await btn.textContent().catch(() => '');
        const type = await btn.getAttribute('type');
        const role = await btn.getAttribute('role');
        buttonInfo.push({ text: text.trim(), type, role });
      }

      // Check page title
      const title = await page.title();

      // Check for login/paywalls
      const hasLoginForm = await page.$('input[type="email"], input[type="password"]').then(el => !!el);
      const hasPayText = bodyText.toLowerCase().includes('subscribe') || bodyText.toLowerCase().includes('subscription') || bodyText.toLowerCase().includes('pay');

      result.pageTitle = title;
      result.inputs = inputInfo;
      result.buttons = buttonInfo;
      result.hasLogin = hasLoginForm;
      result.hasPayText = hasPayText;
      result.cloudflare = cloudflare;
      result.incapsula = incapsula;
      result.recaptcha = recaptcha;
      result.hcaptcha = hcaptcha;
      result.consoleErrors = consoleErrors.slice(0, 5);

      // Try to fill registration and submit if we found an input
      const regInput = inputInfo.find(i =>
        i.placeholder?.toLowerCase().includes('regist') ||
        i.placeholder?.toLowerCase().includes('reg') ||
        i.placeholder?.toLowerCase().includes('vehicle') ||
        i.ariaLabel?.toLowerCase().includes('regist') ||
        i.ariaLabel?.toLowerCase().includes('reg') ||
        i.id?.toLowerCase().includes('regist') ||
        i.id?.toLowerCase().includes('reg') ||
        i.name?.toLowerCase().includes('regist') ||
        i.name?.toLowerCase().includes('reg')
      );

      if (regInput && !hasLoginForm) {
        const inputSelector = regInput.id ? `#${regInput.id}` :
          regInput.name ? `[name="${regInput.name}"]` : null;

        if (inputSelector) {
          try {
            await page.fill(inputSelector, REG);
            await page.waitForTimeout(500);

            // Try to find and click submit
            const submitBtn = buttonInfo.find(b =>
              b.text.toLowerCase().includes('check') ||
              b.text.toLowerCase().includes('search') ||
              b.text.toLowerCase().includes('mot') ||
              b.text.toLowerCase().includes('find') ||
              b.text.toLowerCase().includes('submit') ||
              b.type === 'submit'
            );

            if (submitBtn) {
              const btnSelectors = await page.$$('button, input[type="submit"]');
              for (const btn of btnSelectors) {
                const txt = await btn.textContent().catch(() => '');
                const type = await btn.getAttribute('type');
                if (txt.trim().toLowerCase().includes('check') ||
                    txt.trim().toLowerCase().includes('search') ||
                    txt.trim().toLowerCase().includes('mot') ||
                    type === 'submit') {
                  await btn.click();
                  await page.waitForTimeout(3000);
                  break;
                }
              }
            }

            const newBodyText = await page.textContent('body').catch(() => '');
            const resultText = newBodyText.slice(0, 2000);
            result.submitted = true;
            result.resultText = resultText;
          } catch (e) {
            result.submitted = false;
            result.error = e.message;
          }
        }
      } else if (!regInput) {
        result.noRegInputFound = true;
        result.inputInfoSummary = inputInfo.map(i => `${i.id || 'no-id'}/${i.name || 'no-name'} placeholder="${i.placeholder || ''}"`).join('; ');
      }

      console.log(`  Title: ${title}`);
      console.log(`  Inputs: ${JSON.stringify(inputInfo.filter(i => i.id || i.name).slice(0, 5))}`);
      console.log(`  Cloudflare: ${cloudflare}, Incapsula: ${incapsula}, reCAPTCHA: ${recaptcha}`);
      console.log(`  Has login: ${hasLoginForm}, Has pay text: ${hasPayText}`);
      if (result.submitted) {
        console.log(`  Result preview: ${result.resultText?.slice(0, 300)}`);
      }

    } catch (e) {
      result.error = e.message;
      console.log(`  ERROR: ${e.message}`);
    }

    await page.close();
    results.push(result);
  }

  await browser.close();

  console.log('\n\n======== FINAL SUMMARY ========');
  for (const r of results) {
    console.log(`\n${r.name} (${r.url})`);
    console.log(`  Title: ${r.pageTitle || 'N/A'}`);
    console.log(`  Cloudflare: ${r.cloudflare}, Incapsula: ${r.incapsula}, reCAPTCHA: ${r.recaptcha}, hCaptcha: ${r.hcaptcha}`);
    console.log(`  Login required: ${r.hasLogin}, Pay/subscription: ${r.hasPayText}`);
    if (r.noRegInputFound) {
      console.log(`  No reg input found. Inputs: ${r.inputInfoSummary}`);
    }
    if (r.submitted) {
      console.log(`  Submitted successfully. Result: ${r.resultText?.slice(0, 500)}`);
    }
    if (r.error) {
      console.log(`  Error: ${r.error}`);
    }
  }
})();
