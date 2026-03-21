import { test, expect } from '@playwright/test';
import path from 'path';
import { chromium } from 'playwright';
import { HackerOneParser } from '../src/browser/parsers/HackerOneParser.js';
import { Logger } from '../src/Logger.js';
import { readFileSync } from 'fs';
const ROOT = process.cwd();
const FIXTURE_V1 = path.join(ROOT, 'fixtures', 'html', 'hackerone-v1.html');
const FIXTURE_V2 = path.join(ROOT, 'fixtures', 'html', 'hackerone-v2.html');
async function pageFromFixture(filePath) {
    const html = readFileSync(filePath, 'utf8');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(html);
    return { page, browser };
}
test('HackerOneParser.parse() extracts program_name from v1 fixture', async () => {
    const { page, browser } = await pageFromFixture(FIXTURE_V1);
    const logger = new Logger('Test');
    const parser = new HackerOneParser(logger);
    const result = await parser.parse(page, FIXTURE_V1);
    expect(result.platform).toBe('hackerone');
    expect(result.program_name).toBe('Uber');
    await browser.close();
});
test('HackerOneParser.parse() extracts scope_assets from v1 fixture', async () => {
    const { page, browser } = await pageFromFixture(FIXTURE_V1);
    const logger = new Logger('Test');
    const parser = new HackerOneParser(logger);
    const result = await parser.parse(page, FIXTURE_V1);
    expect(result.scope_assets).toContain('https://www.uber.com');
    expect(result.scope_assets).toContain('https://api.uber.com');
    await browser.close();
});
test('HackerOneParser.parse() extracts exclusions from v1 fixture', async () => {
    const { page, browser } = await pageFromFixture(FIXTURE_V1);
    const logger = new Logger('Test');
    const parser = new HackerOneParser(logger);
    const result = await parser.parse(page, FIXTURE_V1);
    expect(result.exclusions).toContain('https://blog.uber.com');
    expect(result.exclusions).toContain('https://investor.uber.com');
    await browser.close();
});
test('HackerOneParser.parse() extracts reward_range from v1 fixture', async () => {
    const { page, browser } = await pageFromFixture(FIXTURE_V1);
    const logger = new Logger('Test');
    const parser = new HackerOneParser(logger);
    const result = await parser.parse(page, FIXTURE_V1);
    expect(result.reward_range).toBe('$10,000 – $30,000');
    await browser.close();
});
test('HackerOneParser.parse() produces a deterministic source_snapshot_hash', async () => {
    const { page, browser } = await pageFromFixture(FIXTURE_V1);
    const logger = new Logger('Test');
    const parser = new HackerOneParser(logger);
    const result1 = await parser.parse(page, FIXTURE_V1);
    const result2 = await parser.parse(page, FIXTURE_V1);
    expect(result1.source_snapshot_hash).toBe(result2.source_snapshot_hash);
    expect(result1.source_snapshot_hash).toHaveLength(64);
    await browser.close();
});
test('HackerOneParser.parse() detects changed scope_assets in v2 fixture', async () => {
    const { page, browser } = await pageFromFixture(FIXTURE_V2);
    const logger = new Logger('Test');
    const parser = new HackerOneParser(logger);
    const result = await parser.parse(page, FIXTURE_V2);
    expect(result.scope_assets).toContain('https://vault.uber.com');
    expect(result.scope_assets).toHaveLength(3);
    await browser.close();
});
test('HackerOneParser.parse() detects changed reward_range in v2 fixture', async () => {
    const { page, browser } = await pageFromFixture(FIXTURE_V2);
    const logger = new Logger('Test');
    const parser = new HackerOneParser(logger);
    const result = await parser.parse(page, FIXTURE_V2);
    expect(result.reward_range).toBe('$15,000 – $50,000');
    await browser.close();
});
