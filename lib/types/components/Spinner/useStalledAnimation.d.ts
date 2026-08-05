/**
 * Tracks the transition to red when tokens stop flowing (ported from the
 * leak's `Spinner/useStalledAnimation.ts`). Driven by the parent's animation
 * clock time instead of independent intervals, so it slows down when the
 * terminal is blurred.
 */
export declare function useStalledAnimation(time: number, currentResponseLength: number, hasActiveTools?: boolean, reducedMotion?: boolean): {
    isStalled: boolean;
    stalledIntensity: number;
};
//# sourceMappingURL=useStalledAnimation.d.ts.map