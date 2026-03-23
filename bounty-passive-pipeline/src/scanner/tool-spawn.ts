/**
 * tool-spawn.ts — Crash-safe CLI tool runner for Windows.
 * 
 * Problem: Node's execFileP() captures stdout/stderr from Go/Python tools
 * that emit ANSI/VT100 codes. Node's stream parser deadlocks on escape
 * sequences → entire terminal freezes.
 * 
 * Secondary: AbortSignal.timeout() does NOT kill processes on Windows.
 * Orphaned processes hold handles → crash on next execFileP call.
 * 
 * Fix: spawn() with stdio:['ignore','pipe','pipe'] — stdout/stderr are
 * collected but NOT piped through Node's internal stream processors.
 * On timeout, taskkill /F /T /PID cleans up the entire process tree.
 */
import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import os from 'os';

const WIN = os.platform() === 'win32';

export interface SpawnResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  killed: boolean;
}

/**
 * Kill a process tree on Windows.
 */
async function winKill(pid: number): Promise<boolean> {
  return new Promise((resolve) => {
    const killer = spawn('taskkill', ['/F', '/T', '/PID', String(pid)], {
      stdio: 'ignore',
      shell: true,
      windowsHide: true,
    });
    killer.on('close', (code) => resolve(code === 0));
    killer.on('error', () => resolve(false));
    setTimeout(() => resolve(false), 5000);
  });
}

/**
 * Run a CLI tool with capture-safe spawning.
 * - stdout/stderr ARE collected (into strings) but NOT piped through Node's
 *   stream machinery that deadlocks on ANSI codes.
 * - On timeout, process tree is killed via taskkill on Windows.
 * 
 * @param cmd   Full path or name of the executable
 * @param args  Command-line arguments
 * @param opts.timeoutMs  Kill after this long (default 60s)
 * @param opts.killOnly  If true, just kill the PID and return (no spawn)
 */
export async function spawnTool(
  cmd: string,
  args: string[],
  opts: { timeoutMs?: number; cwd?: string; env?: Record<string, string>; killOnlyPid?: number } = {}
): Promise<SpawnResult> {
  const { timeoutMs = 60_000, cwd, env, killOnlyPid } = opts;

  // Kill-only path (used for cleanup)
  if (killOnlyPid != null) {
    if (WIN) {
      await winKill(killOnlyPid);
    } else {
      try { process.kill(killOnlyPid, 'SIGKILL'); } catch { /* ignore */ }
    }
    return { stdout: '', stderr: '', exitCode: null, killed: true };
  }

  return new Promise((resolve) => {
    const proc: ChildProcess = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true,
      cwd,
      env: { ...process.env, ...env },
    });

    let resolved = false;
    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    const timer = setTimeout(async () => {
      if (resolved) return;
      resolved = true;
      if (WIN) {
        await winKill(proc.pid!);
      } else {
        try { proc.kill('SIGKILL'); } catch { /* ignore */ }
      }
      resolve({ stdout, stderr, exitCode: null, killed: true });
    }, timeoutMs);

    proc.on('close', (code, _signal) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code, killed: false });
    });

    proc.on('error', (err) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: null, killed: false });
    });
  });
}
