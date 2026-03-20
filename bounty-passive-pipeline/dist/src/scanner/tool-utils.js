/**
 * Utility – check if a CLI tool is available in PATH.
 * Handles both Windows (where) and Unix (which).
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileP = promisify(execFile);
export async function isToolAvailable(name) {
    try {
        if (process.platform === 'win32') {
            await execFileP('where', [name], { timeout: 10_000 });
        }
        else {
            await execFileP('which', [name], { timeout: 10_000 });
        }
        return true;
    }
    catch {
        return false;
    }
}
