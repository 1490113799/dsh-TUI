import React from 'react';
/**
 * A single-line search input in the round-bordered box of the leak's
 * SearchBox: `⌕ ` prefix, block cursor at `cursorOffset` (inverse cell),
 * placeholder with its first character as the cursor when empty.
 */
export declare function SearchBox({ query, placeholder, isFocused, isTerminalFocused, prefix, width, cursorOffset, borderless, }: {
    query: string;
    placeholder?: string;
    isFocused: boolean;
    isTerminalFocused: boolean;
    prefix?: string;
    width?: number | string;
    cursorOffset?: number;
    borderless?: boolean;
}): React.ReactNode;
//# sourceMappingURL=SearchBox.d.ts.map