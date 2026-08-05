import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import chalk from 'chalk';
import { Box, Text, useAnimationFrame, useTerminalSize } from '../ui.js';
import { stringWidth } from '../ink/stringWidth.js';
import { getGraphemeSegmenter } from '../utils/intl.js';
import { getTheme } from '../theme.js';
import { useTheme } from './design-system/ThemeProvider.js';
import { interpolateColor, parseRGB } from './Spinner/spinnerUtils.js';
import { renderBigText } from './bigfont.js';
import { WhaleArt } from './Whale.js';
const VERSION = '0.1.0';
/** Below this width the whale hides and the header goes text-only. */
const WHALE_MIN_COLUMNS = 64;
/** Header blue-white ladder: brand → ice → pale → near-white flash. */
const BRAND = { r: 77, g: 107, b: 254 };
const ICE = { r: 147, g: 190, b: 255 };
const PALE = { r: 215, g: 228, b: 255 };
const FLASH = { r: 238, g: 244, b: 255 };
/**
 * Paint `word` with a 10-column highlight window sweeping across it (CC's
 * useShimmerAnimation non-requesting cadence: one column per 200ms frame,
 * highlight brightness pulsing on a 400ms sine).
 */
function sweep(word, time, base, highlight) {
    const width = stringWidth(word);
    const cycle = width + 20;
    const glimmerStart = (Math.floor(time / 200) % cycle) - 10;
    let out = '';
    let col = 0;
    for (const { segment } of getGraphemeSegmenter().segment(word)) {
        const segWidth = stringWidth(segment);
        const highlighted = col >= glimmerStart && col + segWidth <= glimmerStart + 10;
        const opacity = highlighted ? (Math.sin(time / 400) + 1) / 2 : 0;
        const rgb = highlighted ? interpolateColor(base, highlight, opacity) : base;
        out += chalk.rgb(rgb.r, rgb.g, rgb.b).bold(segment);
        col += segWidth;
    }
    return out;
}
/** `max` → `Max` (effort levels arrive lower-case from the adapter). */
function capitalize(text) {
    return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}
/**
 * The header splash: the DeepSeek pixel whale on the left, and next to it
 * the wordmark (`✦ dsh-cc` with a shimmer sweep + version), the `DEEPSEEK
 * HARNESS` tagline in a 5-row block font (brand-blue → ice gradient with a
 * white flowing highlight), the active model and reasoning effort, the
 * session working directory, and the startup tip. Below the block sits the
 * `探索未至之境！` welcome line in ice blue with a white sweep. Narrow
 * terminals drop the whale and keep the text column.
 */
export function LogoV2({ model, effort, cwd, }) {
    const [ref, time] = useAnimationFrame(200);
    const [themeName] = useTheme();
    const theme = getTheme(themeName);
    const { columns } = useTerminalSize();
    const wordmarkRGB = parseRGB(theme.claude) ?? BRAND;
    const wordmarkShimmerRGB = parseRGB(theme.claudeShimmer) ?? ICE;
    const taglineRGB = parseRGB(theme.claudeBlue_FOR_SYSTEM_SPINNER) ?? ICE;
    const showWhale = columns >= WHALE_MIN_COLUMNS;
    const bigDeepSeek = renderBigText('DEEPSEEK', time, wordmarkRGB, taglineRGB, FLASH);
    const bigHarness = renderBigText('HARNESS', time, taglineRGB, PALE, FLASH);
    return (_jsxs(Box, { ref: ref, flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { flexDirection: "row", gap: 2, width: "100%", alignItems: "center", children: [showWhale && _jsx(WhaleArt, {}), _jsxs(Box, { flexDirection: "column", flexShrink: 1, children: [_jsxs(Text, { wrap: "truncate-end", children: [sweep('✦ dsh-cc', time, wordmarkRGB, wordmarkShimmerRGB), _jsx(Text, { dimColor: true, children: '  v' + VERSION })] }), bigDeepSeek.map((row, index) => (_jsx(Text, { wrap: "truncate-end", children: row }, `ds-${index}`))), bigHarness.map((row, index) => (_jsx(Text, { wrap: "truncate-end", children: row }, `h-${index}`))), _jsxs(Text, { wrap: "truncate-end", children: [_jsx(Text, { color: "claude", bold: true, children: model }), effort !== undefined && _jsx(Text, { dimColor: true, children: ' · ' + capitalize(effort) + ' effort' })] }), _jsx(Text, { dimColor: true, wrap: "truncate-end", children: cwd }), _jsxs(Text, { wrap: "truncate-end", children: [_jsx(Text, { color: "claude", bold: true, children: "Tip:" }), _jsx(Text, { color: "claudeBlue_FOR_SYSTEM_SPINNER", children: " /model" }), _jsx(Text, { dimColor: true, children: " \u5207\u6362\u6A21\u578B \u00B7 " }), _jsx(Text, { color: "claudeBlue_FOR_SYSTEM_SPINNER", children: "/help" }), _jsx(Text, { dimColor: true, children: " \u67E5\u770B\u547D\u4EE4 \u00B7 " }), _jsx(Text, { color: "claudeBlue_FOR_SYSTEM_SPINNER", children: "Tab" }), _jsx(Text, { dimColor: true, children: " \u81EA\u52A8\u8865\u5168" })] })] })] }), _jsx(Box, { marginTop: 1, paddingLeft: 2, children: _jsx(Text, { children: sweep('探索未至之境！', time, taglineRGB, FLASH) }) })] }));
}
