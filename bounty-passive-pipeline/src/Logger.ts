export class Logger {
  private level: string;

  constructor(level: string = 'info') {
    this.level = level;
  }

  private shouldLog(level: string, allowed: string[]): boolean {
    return allowed.includes(level);
  }

  log(message: string): void {
    this._write('info', message);
  }

  warn(message: string): void {
    this._write('warn', message);
  }

  error(message: string): void {
    this._write('error', message);
  }

  private _write(level: string, msg: string): void {
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
