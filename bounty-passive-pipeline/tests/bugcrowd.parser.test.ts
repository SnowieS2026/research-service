import { test, expect } from '@playwright/test';
import path from 'path';
import { chromium } from 'playwright';
import { BugcrowdParser } from '../src/browser/parsers/BugcrowdParser.js';
import { Logger } from '../src/Logger.js';
import { readFileSync } from 'fs';

const ROOT = process.cwd();
const FIXTURE_V1 = path.join(ROOT, 'fixtures', 'html', 'bugcrowd-v1.html');
const FIXTURE_V2 = path.join(ROOT, 'fixtures', 'html', 'bugcrowd-v2.html');
const FIXTURE_JS = path.join(ROOT, 'fixtures', 'html', 'bugcrowd-js.html');

async function pageFromFixture(filePath: string) {
  const html = readFileSync(filePath, 'utf8');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setContent(html);
  return { page, browser };
}

test('BugcrowdParser.parse() extracts program_name from v1 fixture', async () => {
  const { page, browser } = await pageFromFixture(FIXTURE_V1);
  const logger = new Logger('Test');
  const parser = new BugcrowdParser(logger);
  const result = await parser.parse(page, FIXTURE_V1);
  expect(result.platform).toBe('bugcrowd');
  expect(result.program_name).toBe('Bugcrowd Test Program v1');
  await browser.close();
});

test('BugcrowdParser.parse() extracts scope_assets from v1 fixture', async () => {
  const { page, browser } = await pageFromFixture(FIXTURE_V1);
  const logger = new Logger('Test');
  const parser = new BugcrowdParser(logger);
  const result = await parser.parse(page, FIXTURE_V1);
  expect(result.scope_assets).toContain('example.com');
  expect(result.scope_assets).toContain('www.example.com');
  await browser.close();
});

test('BugcrowdParser.parse() extracts exclusions from v1 fixture', async () => {
  const { page, browser } = await pageFromFixture(FIXTURE_V1);
  const logger = new Logger('Test');
  const parser = new BugcrowdParser(logger);
  const result = await parser.parse(page, FIXTURE_V1);
  expect(result.exclusions).toContain('thirdparty.com');
  await browser.close();
});

test('BugcrowdParser.parse() extracts reward_range from v1 fixture', async () => {
  const { page, browser } = await pageFromFixture(FIXTURE_V1);
  const logger = new Logger('Test');
  const parser = new BugcrowdParser(logger);
  const result = await parser.parse(page, FIXTURE_V1);
  expect(result.reward_range).toBe('$100-$500');
  await browser.close();
});

test('BugcrowdParser.parse() produces a deterministic source_snapshot_hash', async () => {
  const { page, browser } = await pageFromFixture(FIXTURE_V1);
  const logger = new Logger('Test');
  const parser = new BugcrowdParser(logger);
  const result1 = await parser.parse(page, FIXTURE_V1);
  const result2 = await parser.parse(page, FIXTURE_V1);
  expect(result1.source_snapshot_hash).toBe(result2.source_snapshot_hash);
  expect(result1.source_snapshot_hash).toHaveLength(64); // SHA-256 hex
  await browser.close();
});

test('BugcrowdParser.parse() detects changed scope_assets in v2 fixture', async () => {
  const { page, browser } = await pageFromFixture(FIXTURE_V2);
  const logger = new Logger('Test');
  const parser = new BugcrowdParser(logger);
  const result = await parser.parse(page, FIXTURE_V2);
  expect(result.scope_assets).toContain('api.example.com'); // only in v2
  expect(result.scope_assets).toHaveLength(3);
  await browser.close();
});

test('BugcrowdParser.parse() detects changed reward_range in v2 fixture', async () => {
  const { page, browser } = await pageFromFixture(FIXTURE_V2);
  const logger = new Logger('Test');
  const parser = new BugcrowdParser(logger);
  const result = await parser.parse(page, FIXTURE_V2);
  expect(result.reward_range).toBe('$200-$1000');
  await browser.close();
});

test('BugcrowdParser.parse() returns empty string for missing selectors', async () => {
  const { page, browser } = await pageFromFixture(FIXTURE_V1);
  const { TextExtractor } = await import('../src/browser/core/TextExtractor.js');
  const extractor = new TextExtractor();
  const text = await extractor.extract(page, '.nonexistent-selector-12345');
  expect(text).toBe('');
  await browser.close();
});

test('BugcrowdParser.parse() handles a JS-rendered fixture without crashing', async () => {
  const { page, browser } = await pageFromFixture(FIXTURE_JS);
  const logger = new Logger('Test');
  const parser = new BugcrowdParser(logger);
  const result = await parser.parse(page, FIXTURE_JS);
  expect(result.platform).toBe('bugcrowd');
  expect(result.program_name).toBeTruthy();
  await browser.close();
});
