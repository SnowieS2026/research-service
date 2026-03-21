import { test, expect } from '@playwright/test';
// Increase timeout for Intigriti tests — Stencil apps take longer to render
test.setTimeout(60_000);
import path from 'path';
import { chromium } from 'playwright';
import { IntigritiParser } from '../src/browser/parsers/IntigritiParser.js';
import { Logger } from '../src/Logger.js';
import { readFileSync } from 'fs';
const ROOT = process.cwd();
const FIXTURE_V1 = path.join(ROOT, 'fixtures', 'html', 'intigriti-v1.html');
const FIXTURE_V2 = path.join(ROOT, 'fixtures', 'html', 'intigriti-v2.html');
async function pageFromFixture(filePath) {
    const html = readFileSync(filePath, 'utf8');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(html);
    return { page, browser };
}
test('IntigritiParser.parse() extracts program_name from v1 fixture', async () => {
    const { page, browser } = await pageFromFixture(FIXTURE_V1);
    const logger = new Logger('Test');
    const parser = new IntigritiParser(logger);
    const result = await parser.parse(page, FIXTURE_V1);
    expect(result.platform).toBe('intigriti');
    expect(result.program_name).toBe('intigriti');
    await browser.close();
});
test('IntigritiParser.parse() extracts scope_assets from v1 fixture', async () => {
    const { page, browser } = await pageFromFixture(FIXTURE_V1);
    const logger = new Logger('Test');
    const parser = new IntigritiParser(logger);
    const result = await parser.parse(page, FIXTURE_V1);
    expect(result.scope_assets).toContain('api.intigriti.com');
    expect(result.scope_assets).toContain('app.intigriti.com');
    expect(result.scope_assets).toContain('www.intigriti.com');
    expect(result.scope_assets).toHaveLength(4);
    await browser.close();
});
test('IntigritiParser.parse() extracts exclusions from v1 fixture', async () => {
    const { page, browser } = await pageFromFixture(FIXTURE_V1);
    const logger = new Logger('Test');
    const parser = new IntigritiParser(logger);
    const result = await parser.parse(page, FIXTURE_V1);
    expect(result.exclusions).toContain('blog.intigriti.com');
    expect(result.exclusions).toContain('marketing.intigriti.com');
    await browser.close();
});
test('IntigritiParser.parse() extracts reward_range from v1 fixture', async () => {
    const { page, browser } = await pageFromFixture(FIXTURE_V1);
    const logger = new Logger('Test');
    const parser = new IntigritiParser(logger);
    const result = await parser.parse(page, FIXTURE_V1);
    // High severity top reward: 7.0-8.9 → Intigriti pays €2,000-5,000 for High
    expect(result.reward_range).toBeTruthy();
    expect(result.reward_currency).toBe('EUR');
    await browser.close();
});
test('IntigritiParser.parse() produces a deterministic source_snapshot_hash', async () => {
    const { page, browser } = await pageFromFixture(FIXTURE_V1);
    const logger = new Logger('Test');
    const parser = new IntigritiParser(logger);
    const result1 = await parser.parse(page, FIXTURE_V1);
    const result2 = await parser.parse(page, FIXTURE_V1);
    expect(result1.source_snapshot_hash).toBe(result2.source_snapshot_hash);
    expect(result1.source_snapshot_hash).toHaveLength(64);
    await browser.close();
});
test('IntigritiParser.parse() detects changed scope_assets in v2 fixture', async () => {
    const { page, browser } = await pageFromFixture(FIXTURE_V2);
    const logger = new Logger('Test');
    const parser = new IntigritiParser(logger);
    const result = await parser.parse(page, FIXTURE_V2);
    // v2 has api, app, new.intigriti.com (4 total with auth)
    expect(result.scope_assets).toContain('new.intigriti.com');
    await browser.close();
});
test('IntigritiParser.parse() extracts reward_currency as EUR', async () => {
    const { page, browser } = await pageFromFixture(FIXTURE_V1);
    const logger = new Logger('Test');
    const parser = new IntigritiParser(logger);
    const result = await parser.parse(page, FIXTURE_V1);
    expect(result.reward_currency).toBe('EUR');
    await browser.close();
});
