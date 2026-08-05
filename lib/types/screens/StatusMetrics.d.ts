/**
 * Status-line metric renderers, ported from two pi extensions:
 *  - `pi-nano-context`: segmented context progress bar (morandi pastel
 *    segments by content type, free space right-aligned with the usage
 *    readout, largest-remainder column allocation).
 *  - `pi-tps-meter`: live 1/8-cell gauge while streaming and a min-max
 *    normalized sparkline with rolling avg / all-time μ / p95 after each
 *    message; colors green ≥ 50 tps, yellow ≥ 20, red below.
 */
/** Context bar segments — DeepSeek blue family (dark-theme friendly: deep
 *  navy → brand blue, neutral grey free segment; labels adapt to width). */
declare const USED_SEGMENTS: readonly [{
    readonly key: "system";
    readonly color: "#22305F";
    readonly labels: readonly ["system", "sys", "s"];
}, {
    readonly key: "prompt";
    readonly color: "#2B3D78";
    readonly labels: readonly ["prompt", "pr", "p"];
}, {
    readonly key: "assistant";
    readonly color: "#344A92";
    readonly labels: readonly ["assistant", "ast", "a"];
}, {
    readonly key: "thinking";
    readonly color: "#4D6BFE";
    readonly labels: readonly ["think", "th", "t"];
}, {
    readonly key: "tools";
    readonly color: "#5A7CFF";
    readonly labels: readonly ["tools", "tl", "x"];
}];
export type ContextSegments = Record<(typeof USED_SEGMENTS)[number]['key'], number>;
/** Compact token count like pi's: `988`, `3.4k`, `12k`, `1.0M`. */
export declare function formatTokens(count: number): string;
/**
 * The segmented context bar: used segments by content type, the remainder as
 * a light free segment whose right edge carries the usage readout
 * (`ctx 12.3k/1.0M 1.2% 988.9k`, shrinking as width allows).
 */
export declare function renderContextBar(segments: ContextSegments, usedTokens: number, contextWindow: number, width: number): string;
/** Speed color: green ≥ 50, yellow ≥ 20, red below (pi-tps-meter). */
export declare function speedColor(tps: number, text: string): string;
/** Live 1/8-cell horizontal gauge: `▕███████▋···▏`. */
export declare function renderTpsGauge(tps: number, peak: number): string;
/** Min-max normalized 12-sample sparkline: `▁▄▇▅▂▁▇█▅▃▆▇`. */
export declare function renderTpsSparkline(samples: readonly {
    tps: number;
}[]): string;
/** Rolling stats: 60s average, all-time mean and p95. */
export declare function tpsStats(samples: readonly {
    tps: number;
    at: number;
}[], nowMs: number): {
    avg: number;
    mean: number;
    p95: number;
};
export {};
//# sourceMappingURL=StatusMetrics.d.ts.map