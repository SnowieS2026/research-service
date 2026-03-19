import { Logger } from '../../Logger.js';
const LOG = new Logger('TextExtractor');
/**
 * Extracts text from the page DOM using a CSS selector.
 * If the selector is not found, returns an empty string rather than throwing.
 */
export class TextExtractor {
    async extract(page, selector) {
        try {
            const element = page.locator(selector).first();
            const count = await element.count();
            if (count === 0) {
                LOG.warn(`Selector "${selector}" found no elements – returning empty string`);
                return '';
            }
            const text = (await element.textContent()) ?? '';
            LOG.log(`Extracted text from "${selector}": ${text.slice(0, 60)}…`);
            return text.trim();
        }
        catch (err) {
            LOG.warn(`Selector "${selector}" threw: ${err} – returning empty string`);
            return '';
        }
    }
}
