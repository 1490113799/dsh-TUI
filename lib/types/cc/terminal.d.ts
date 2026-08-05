/** `(ctrl+o to expand)` hint in dim chalk, like the leak's ctrlOToExpand(). */
export declare function ctrlOToExpand(): string;
/**
 * Renders the content with line-based truncation for terminal display.
 * If the content exceeds the maximum number of lines, it truncates the content
 * and adds a message indicating the number of additional lines.
 */
export declare function renderTruncatedContent(content: string, terminalWidth: number, suppressExpandHint?: boolean): string;
//# sourceMappingURL=terminal.d.ts.map