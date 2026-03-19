export class Logger {
    level;
    constructor(level = 'info') {
        this.level = level;
    }
    shouldLog(level, allowed) {
        return allowed.includes(level);
    }
    log(message) {
        this._write('info', message);
    }
    warn(message) {
        this._write('warn', message);
    }
    error(message) {
        this._write('error', message);
    }
    _write(level, msg) {
        if (this.shouldLog(level, [this.level])) {
            switch (level) {
                case 'error':
                    console.error(`[ERROR] ${msg}`);
                    break;
                case 'warn':
                    console.warn(`[WARN] ${msg}`);
                    break;
                default:
                    console.info(`[INFO] ${msg}`);
            }
        }
    }
}
