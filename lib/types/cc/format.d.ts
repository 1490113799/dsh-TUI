/**
 * Token/byte display formatters, ported from the leaked Claude Code source
 * (src/utils/format.ts) minus the app-level formatter registry.
 */
export declare function formatNumber(number: number): string;
export declare function formatTokens(count: number): string;
/** Compact duration like `12s`, `3m 4s`, `1h 2m` (ported from the leak). */
export declare function formatDuration(durationMs: number, options?: {
    mostSignificantOnly?: boolean;
}): string;
//# sourceMappingURL=format.d.ts.map