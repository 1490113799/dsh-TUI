/**
 * Spinner animation utilities, ported from the leaked Claude Code source
 * (`src/components/Spinner/utils.ts`).
 */
export type RGBColor = {
    r: number;
    g: number;
    b: number;
};
export declare function getDefaultCharacters(): string[];
/** Interpolate between two RGB colors (t: 0 to 1). */
export declare function interpolateColor(color1: RGBColor, color2: RGBColor, t: number): RGBColor;
/** Convert an RGB object to an `rgb()` color string for the Text component. */
export declare function toRGBColor(color: RGBColor): string;
/** HSL hue (0-360) to RGB, using voice-mode waveform parameters (s=0.7, l=0.6). */
export declare function hueToRgb(hue: number): RGBColor;
export declare function parseRGB(colorStr: string): RGBColor | null;
//# sourceMappingURL=spinnerUtils.d.ts.map