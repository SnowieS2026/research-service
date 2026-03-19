/**
 * OpenClaw sessions_send integration.
 * Sends a message to a named session.
 * Throws on failure (caller should handle gracefully).
 */
export async function sessions_send(sessionKey, message) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const escaped = message.replace(/'/g, "'\\''");
    const cmd = `openclaw sessions send '${sessionKey}' --message '${escaped}'`;
    try {
        const { stdout, stderr } = await execAsync(cmd, { timeout: 30_000 });
        if (stderr)
            console.warn('[sessions_send] stderr:', stderr);
        console.info('[sessions_send] Output:', stdout);
    }
    catch (err) {
        const e = err;
        throw new Error(`sessions_send failed: ${e.stderr ?? e.stdout ?? String(err)}`);
    }
}
