import { BugcrowdParser } from './BugcrowdParser.js';
import { HackerOneParser } from './HackerOneParser.js';
import { IntigritiParser } from './IntigritiParser.js';
import { Standoff365Parser } from './Standoff365Parser.js';
import { Logger } from '../../Logger.js';
const LOG = new Logger('adapters');
const loggerCache = new Map();
function getLoggerForPlatform(platform) {
    if (!loggerCache.has(platform)) {
        loggerCache.set(platform, new Logger(`adapter:${platform}`));
    }
    return loggerCache.get(platform);
}
/**
 * Factory: returns the correct parser for a given platform name.
 */
export function getAdapter(platform) {
    switch (platform.toLowerCase()) {
        case 'bugcrowd':
            return new BugcrowdParser(getLoggerForPlatform('bugcrowd'));
        case 'hackerone':
            return new HackerOneParser(getLoggerForPlatform('hackerone'));
        case 'intigriti':
            return new IntigritiParser(getLoggerForPlatform('intigriti'));
        case 'standoff365':
            return new Standoff365Parser(getLoggerForPlatform('standoff365'));
        default:
            LOG.warn(`Unknown platform "${platform}", defaulting to BugcrowdParser`);
            return new BugcrowdParser(getLoggerForPlatform('bugcrowd'));
    }
}
/** Returns true if the platform is supported. */
export function isSupportedPlatform(platform) {
    return ['bugcrowd', 'hackerone', 'intigriti', 'standoff365'].includes(platform.toLowerCase());
}
/** Returns all supported platform names. */
export function supportedPlatforms() {
    return ['bugcrowd', 'hackerone', 'intigriti', 'standoff365'];
}
