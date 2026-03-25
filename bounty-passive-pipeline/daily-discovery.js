/**
 * daily-discovery.js — Standalone discovery runner for cron jobs
 * Checks all 4 bounty platforms for NEW programs with accessible attack surface
 * Run: npx tsx daily-discovery.js
 */
import { MetadataBrowser } from './src/browser/MetadataBrowser.js';
import { getAdapter, supportedPlatforms } from './src/browser/parsers/PlatformAdapters.js';
const PLATFORMS = supportedPlatforms();
import { Logger } from './src/Logger.js';
import path from 'path';
import fs from 'fs';

const LOG = new Logger('DailyDiscovery');
const PIPELINE_ROOT = process.cwd();

async function main() {
  const date = new Date().toISOString().slice(0, 10);
  const outPath = path.join(PIPELINE_ROOT, 'logs', 'research', `daily-discovery-${date}.md`);
  
  LOG.log(`Starting daily discovery for ${date}`);
  
  const browser = new MetadataBrowser();
  await browser.init();
  
  const snapshotDir = path.join(PIPELINE_ROOT, 'logs', 'snapshots');
  const snapshotFiles = fs.existsSync(snapshotDir) ? fs.readdirSync(snapshotDir).filter(f => f.endsWith('.json')) : [];
  const existingProgramUrls = new Set();
  for (const file of snapshotFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(snapshotDir, file), 'utf8'));
      if (data.platform && data.program_url) {
        existingProgramUrls.add(data.program_url);
      }
      // Also handle other formats
      if (data.programName || data.program_name || data.name) {
        existingProgramUrls.add(data.programUrl || data.program_url || data.program_name || data.name);
      }
    } catch {}
  }
  
  LOG.log(`Existing snapshots: ${existingProgramUrls.size}`);
  
  const allNewPrograms = [];
  
  for (const platform of PLATFORMS) {
    LOG.log(`Checking ${platform}...`);
    try {
      const adapter = getAdapter(platform);
      if (!adapter) { LOG.warn(`No adapter for ${platform}`); continue; }
      
      const programs = await adapter.fetchPrograms(browser);
      LOG.log(`  Found ${programs.length} programs on ${platform}`);
      
      for (const program of programs) {
        if (!existingProgramUrls.has(program.url)) {
          allNewPrograms.push({ ...program, platform });
          LOG.log(`  NEW: ${program.url}`);
        }
      }
    } catch (err) {
      LOG.error(`  ${platform} failed: ${err}`);
    }
  }
  
  await browser.close();
  
  LOG.log(`\nTotal new programs: ${allNewPrograms.length}`);
  
  // Build report
  let report = `# Daily Discovery — ${date}\n\n`;
  report += `New programs found: ${allNewPrograms.length}\n\n`;
  
  if (allNewPrograms.length > 0) {
    report += `## New Programs\n\n`;
    for (const p of allNewPrograms) {
      report += `- [${p.platform}] ${p.url}`;
      if (p.name) report += ` (${p.name})`;
      report += '\n';
    }
    report += '\n';
  }
  
  // Check accessible targets for new programs using a fresh browser
  const accessible = [];
  
  for (const prog of allNewPrograms.slice(0, 10)) {
    try {
      const browser2 = new MetadataBrowser();
      await browser2.init();
      
      const page = await browser2.newPage();
      await page.goto(prog.url, { timeout: 15000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      
      // Collect URLs from the page (run IN browser)
      const pageUrls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href]'));
        return links.map(a => a.href).filter(h => h.startsWith('http'));
      });
      
      // Dedupe by hostname
      const hostnames = new Set();
      for (const url of pageUrls) {
        try {
          hostnames.add(new URL(url).hostname);
        } catch {}
      }
      
      // Check each unique hostname for accessibility (run OUTSIDE browser)
      const accessibleTargets = [];
      for (const hostname of hostnames) {
        if (hostname.includes('google') || hostname.includes('cookie') || hostname.includes('intigriti') || hostname.includes('bugcrowd') || hostname.includes('hackerone')) continue;
        
        try {
          const testResp = await page.request.get(`https://${hostname}`, { timeout: 5000 });
          const cfRay = testResp.headers()['cf-ray'] || '';
          const status = testResp.status();
          
          if (!cfRay && status < 500) {
            accessibleTargets.push(`https://${hostname} (${status})`);
          }
        } catch {}
      }
      
      if (accessibleTargets.length > 0) {
        accessible.push({ program: prog, targets: accessibleTargets });
        LOG.log(`  ACCESSIBLE: ${prog.url} — ${accessibleTargets.length} targets`);
      }
      
      await browser2.close();
    } catch (err) {
      LOG.log(`  Could not check ${prog.url}: ${err.message.slice(0, 80)}`);
    }
  }
  
  if (accessible.length > 0) {
    report += `## Programs With Accessible Attack Surface\n\n`;
    for (const item of accessible) {
      report += `### ${item.program.url}\n`;
      report += `Platform: ${item.program.platform}\n`;
      if (item.program.name) report += `Name: ${item.program.name}\n`;
      report += `Accessible targets:\n`;
      for (const t of item.targets.slice(0, 10)) {
        report += `- ${t}\n`;
      }
      report += '\n';
    }
  }
  
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, report);
  LOG.log(`Report saved to ${outPath}`);
  
  // Also update heartbeat state
  const statePath = path.join(PIPELINE_ROOT, '..', 'memory', 'heartbeat-state.json');
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    state.lastDiscoveryRunAt = new Date().toISOString();
    state.newProgramsLastRun = allNewPrograms.length;
    state.accessibleProgramsLastRun = accessible.length;
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (e) {
    LOG.warn(`Could not update heartbeat state: ${e.message}`);
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`New programs: ${allNewPrograms.length}`);
  console.log(`With accessible targets: ${accessible.length}`);
  if (accessible.length > 0) {
    console.log(`\nTop accessible programs:`);
    for (const item of accessible.slice(0, 3)) {
      console.log(`- ${item.program.url} (${item.targets.length} targets)`);
    }
  }
}

main().catch(err => {
  LOG.error(`Fatal: ${err}`);
  console.error(err);
  process.exit(1);
});
