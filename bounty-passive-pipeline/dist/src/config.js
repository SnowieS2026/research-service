import fs from 'fs';
import path from 'path';
const SEVERITY_ORDER = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4
};
function isValidSeverity(s) {
    return s in SEVERITY_ORDER;
}
const DEFAULT_CONFIG = {
    PLATFORM_ADAPTERS: ['bugcrowd', 'hackerone', 'intigriti', 'standoff365'],
    RATE_LIMIT_DELAY_MS: 2000,
    DRY_RUN: true,
    MIN_SEVERITY_TO_NOTIFY: 'MEDIUM',
    WATCH_INTERVAL_MS: 21600000, // 6 hours
    TARGET_PROGRAMS: [],
    REPORTS_DIR: 'reports',
    SNAPSHOT_STORE: 'logs/snapshots',
    ENABLE_TELEGRAM: true,
    ENABLE_DB: true,
    LOG_LEVEL: 'info',
    // Scanner defaults
    SCANNER_ENABLED: false,
    SCANNER_DRY_RUN: true,
    SCANNER_MAX_TARGETS: 20,
    SCANNER_TIMEOUT_MS: 300_000,
    DALFOX_ENABLED: true,
    SQLMAP_ENABLED: true,
    NUCLEI_ENABLED: true,
    NUCLEI_TEMPLATES_DIR: '',
    SSRF_ENABLED: true,
    AUTH_ENABLED: true,
    API_ENABLED: true,
    SUBFINDER_ENABLED: false,
    GAU_ENABLED: false,
    HTTPX_ENABLED: false,
    GITLEAKS_ENABLED: false,
    // OSINT defaults
    OSINT_WEB_SEARCH_KEY: '',
    OSINT_HUNTER_API_KEY: '',
    OSINT_HIBP_API_KEY: '',
    OSINT_SHODAN_API_KEY: '',
    OSINT_NUMVALIDATE_KEY: '',
    OSINT_DEEP_SEARCH: false,
    OSINT_TIMEOUT_PER_COLLECTOR_MS: 60_000
};
function deepMerge(base, override) {
    const result = { ...base };
    for (const [key, value] of Object.entries(override)) {
        if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
                result[key] = value;
            }
            else if (typeof value === 'object' && !Array.isArray(value) && typeof result[key] === 'object' && result[key] !== null) {
                result[key] = deepMerge(result[key], value);
            }
            else {
                result[key] = value;
            }
        }
    }
    return result;
}
export function loadConfig(configPath) {
    let fileConfig = {};
    const configFilePath = configPath ?? path.join(process.cwd(), 'config.json');
    try {
        if (fs.existsSync(configFilePath)) {
            const raw = fs.readFileSync(configFilePath, 'utf8');
            fileConfig = JSON.parse(raw);
        }
    }
    catch (err) {
        console.warn(`[WARN] Failed to load config from ${configFilePath}: ${err}`);
    }
    // Build override from environment variables
    const envConfig = {};
    if (process.env.DRY_RUN !== undefined)
        envConfig.DRY_RUN = process.env.DRY_RUN !== 'false';
    if (process.env.RATE_LIMIT_DELAY_MS !== undefined) {
        const n = parseInt(process.env.RATE_LIMIT_DELAY_MS, 10);
        if (!isNaN(n))
            envConfig.RATE_LIMIT_DELAY_MS = n;
    }
    if (process.env.WATCH_INTERVAL_MS !== undefined) {
        const n = parseInt(process.env.WATCH_INTERVAL_MS, 10);
        if (!isNaN(n))
            envConfig.WATCH_INTERVAL_MS = n;
    }
    if (process.env.MIN_SEVERITY_TO_NOTIFY !== undefined) {
        const s = process.env.MIN_SEVERITY_TO_NOTIFY;
        if (isValidSeverity(s))
            envConfig.MIN_SEVERITY_TO_NOTIFY = s;
    }
    if (process.env.ENABLE_TELEGRAM !== undefined)
        envConfig.ENABLE_TELEGRAM = process.env.ENABLE_TELEGRAM !== 'false';
    if (process.env.ENABLE_DB !== undefined)
        envConfig.ENABLE_DB = process.env.ENABLE_DB !== 'false';
    if (process.env.SNAPSHOT_STORE !== undefined)
        envConfig.SNAPSHOT_STORE = process.env.SNAPSHOT_STORE;
    if (process.env.REPORTS_DIR !== undefined)
        envConfig.REPORTS_DIR = process.env.REPORTS_DIR;
    if (process.env.PLATFORM_ADAPTERS !== undefined) {
        try {
            envConfig.PLATFORM_ADAPTERS = process.env.PLATFORM_ADAPTERS.split(',').map(s => s.trim());
        }
        catch {
            // ignore
        }
    }
    if (process.env.TARGET_PROGRAMS !== undefined) {
        try {
            envConfig.TARGET_PROGRAMS = process.env.TARGET_PROGRAMS.split(',').map(s => s.trim());
        }
        catch {
            // ignore
        }
    }
    return deepMerge(DEFAULT_CONFIG, { ...fileConfig, ...envConfig });
}
/** Check if a given severity meets the minimum notification threshold. */
export function meetsSeverityThreshold(severity, minSeverity) {
    return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[minSeverity];
}
