export interface ExecFileNoThrowResult {
    code: number | null;
    stdout: string;
    stderr: string;
}
export interface ExecFileNoThrowOptions {
    /** Stdin payload (OSC 52 clipboard helpers and tmux load-buffer). */
    input?: string;
    /** Kill the child after this many milliseconds. */
    timeout?: number;
    /**
     * Accepted for call-site compatibility with the original execa-based
     * implementation; `false` (the only value the Ink core passes) matches this
     * shim's behavior of running in the current working directory.
     */
    useCwd?: boolean;
    /** Working directory for the child; defaults to the parent's cwd. */
    cwd?: string;
}
/**
 * Run a command without throwing: resolves with `{ code, stdout, stderr }`
 * even when the process exits non-zero or cannot spawn.
 */
export declare function execFileNoThrow(file: string, args?: readonly string[], options?: ExecFileNoThrowOptions): Promise<ExecFileNoThrowResult>;
//# sourceMappingURL=execFileNoThrow.d.ts.map