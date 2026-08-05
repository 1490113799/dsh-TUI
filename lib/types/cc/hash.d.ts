export declare function djb2Hash(str: string): number;
/**
 * Hash arbitrary content for change detection. Bun.hash is ~100x faster than
 * sha256 and collision-resistant enough for diff detection (not crypto-safe).
 * The original used `require('crypto')`; cc-tui runs ESM so node:crypto is
 * imported statically and Bun.hash is skipped entirely.
 */
export declare function hashContent(content: string): string;
/**
 * Hash two strings without allocating a concatenated temp string. Seed-chains
 * naturally disambiguate ("ts","code") vs ("tsc","ode") via the NUL separator.
 */
export declare function hashPair(a: string, b: string): string;
//# sourceMappingURL=hash.d.ts.map