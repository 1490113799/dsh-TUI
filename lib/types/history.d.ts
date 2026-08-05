/** One persisted input-history entry. */
export type HistoryEntry = {
    text: string;
    /** Unix ms timestamp. */
    ts: number;
};
/** Append an input to the persisted history (dedupes the immediately-previous entry). */
export declare function appendHistory(text: string): void;
/** Read the persisted history, newest first. */
export declare function loadHistory(): HistoryEntry[];
/** Stable id for a history entry (dedupe React keys across identical texts). */
export declare function historyEntryId(entry: HistoryEntry): string;
//# sourceMappingURL=history.d.ts.map