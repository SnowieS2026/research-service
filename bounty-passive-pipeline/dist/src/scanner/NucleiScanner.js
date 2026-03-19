/**
 * Nuclei wrapper – runs nuclei with selected templates based on stack detection.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { nucleiToFinding } from './ScanResult.js';
import { Logger } from '../Logger.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
const execAsync = promisify(exec);
const LOG = new Logger('NucleiScanner');
async function isToolAvailable(name) {
    try {
        await execAsync(`which ${name} || where ${name}`, { timeout: 10_000 });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Select nuclei template tags based on detected stack technologies.
 */
function selectTemplateTags(stackTechs) {
    const tags = [];
    const techSet = new Set(stackTechs.map(t => t.toLowerCase()));
    if (techSet.has('wordpress')) {
        tags.push('wordpress', 'wp', 'cms');
    }
    else if (techSet.has('drupal')) {
        tags.push('drupal', 'cms');
    }
    else if (techSet.has('joomla')) {
        tags.push('joomla', 'cms');
    }
    else if (techSet.has('magento')) {
        tags.push('magento', 'cms', 'ecommerce');
    }
    else if (techSet.has('shopify')) {
        tags.push('shopify', 'cms', 'ecommerce');
    }
    else if (techSet.has('laravel')) {
        tags.push('laravel', 'php');
    }
    else if (techSet.has('django')) {
        tags.push('django', 'python');
    }
    else if (techSet.has('flask')) {
        tags.push('flask', 'python');
    }
    else if (techSet.has('next.js')) {
        tags.push('nextjs', 'javascript', 'nodejs');
    }
    else if (techSet.has('nuxt.js')) {
        tags.push('nuxtjs', 'javascript', 'nodejs');
    }
    else if (techSet.has('react')) {
        tags.push('react', 'javascript');
    }
    else if (techSet.has('vue.js')) {
        tags.push('vue', 'javascript');
    }
    else if (techSet.has('angular')) {
        tags.push('angular', 'javascript');
    }
    else if (techSet.has('node.js')) {
        tags.push('nodejs', 'javascript');
    }
    else if (techSet.has('php')) {
        tags.push('php');
    }
    else if (techSet.has('python')) {
        tags.push('python');
    }
    else if (techSet.has('ruby')) {
        tags.push('ruby', 'rails');
    }
    else if (techSet.has('java')) {
        tags.push('java', 'spring');
    }
    else if (techSet.has('asp.net')) {
        tags.push('aspnet', 'dotnet');
    }
    else if (techSet.has('go')) {
        tags.push('golang');
    }
    // Always include generic web templates
    if (tags.length === 0) {
        tags.push('vulnerabilities', 'security-misconfiguration', 'exposed-panels');
    }
    // Always useful
    tags.push('security-headers');
    return [...new Set(tags)];
}
function parseNucleiOutput(stdout) {
    const findings = [];
    const lines = stdout.split('\n').filter(Boolean);
    for (const line of lines) {
        try {
            const parsed = JSON.parse(line);
            if (parsed.host && parsed.template) {
                findings.push(nucleiToFinding(parsed.host, parsed.template, parsed.severity ?? 'info', parsed.matched_at ?? new Date().toISOString(), parsed.description ?? '', `Template: ${parsed.template} | Type: ${parsed.type}`));
            }
        }
        catch {
            // Try text line format: [severity] [template] host
            const textMatch = line.match(/\[(\w+)\]\s+\[([^\]]+)\]\s+(https?:\/\/[^\s]+)/);
            if (textMatch) {
                findings.push(nucleiToFinding(textMatch[3], textMatch[2], textMatch[1], new Date().toISOString(), `Nuclei match: ${textMatch[2]}`, line));
            }
        }
    }
    return findings;
}
/**
 * Run nuclei against a list of targets with selected template tags.
 */
export async function runNuclei(targets, stackTechs, config) {
    const findings = [];
    const hasNuclei = await isToolAvailable('nuclei');
    if (!hasNuclei) {
        LOG.warn('nuclei not available – skipping nuclei scan');
        return findings;
    }
    if (targets.length === 0) {
        LOG.log('No targets for nuclei scan');
        return findings;
    }
    // Write target list to temp file
    const tmpDir = os.tmpdir();
    const urlsPath = path.join(tmpDir, `nuclei-urls-${Date.now()}.txt`);
    await fs.promises.writeFile(urlsPath, targets.join('\n'), 'utf8');
    const tags = selectTemplateTags(stackTechs);
    const templatesDir = config.nucleiTemplates || path.join(os.homedir(), 'nuclei-templates');
    // Build tag filter args
    const tagArgs = tags.flatMap(tag => ['-tags', tag]);
    const outputPath = path.join(tmpDir, `nuclei-output-${Date.now()}.txt`);
    const args = [
        'nuclei',
        '-l', urlsPath,
        '-t', templatesDir,
        ...tagArgs,
        '-json',
        '-o', outputPath,
        '-rl', '50' // rate limit 50/sec
    ];
    if (config.dryRun) {
        LOG.log(`[DRY_RUN] nuclei ${args.join(' ')}`);
        await fs.promises.unlink(urlsPath).catch(() => { });
        return findings;
    }
    try {
        // Check templates directory exists
        if (!fs.existsSync(templatesDir)) {
            LOG.warn(`Nuclei templates directory not found: ${templatesDir}`);
            // Fall back to default nuclei templates path
            args[args.indexOf(templatesDir)] = '';
        }
        await execAsync(args.filter(Boolean).join(' '), {
            timeout: config.timeoutPerTarget * Math.min(targets.length, 5),
            cwd: tmpDir
        });
        // Read output
        if (fs.existsSync(outputPath)) {
            const output = await fs.promises.readFile(outputPath, 'utf8');
            findings.push(...parseNucleiOutput(output));
            await fs.promises.unlink(outputPath).catch(() => { });
        }
    }
    catch (err) {
        const e = err;
        // nuclei exits non-zero on findings – that's expected
        if (e.code !== 0) {
            LOG.warn(`nuclei exited with code ${e.code}`);
        }
        // Try to read partial output
        if (fs.existsSync(outputPath)) {
            try {
                const output = await fs.promises.readFile(outputPath, 'utf8');
                findings.push(...parseNucleiOutput(output));
            }
            catch {
                // ignore
            }
        }
    }
    finally {
        await fs.promises.unlink(urlsPath).catch(() => { });
    }
    LOG.log(`NucleiScanner: ${findings.length} findings`);
    return findings;
}
