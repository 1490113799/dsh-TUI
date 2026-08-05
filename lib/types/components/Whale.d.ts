import React from 'react';
/**
 * Render the sprite to 9 ANSI rows (one per sprite row pair). Consecutive
 * cells sharing one style are run-length encoded; trailing transparent
 * cells are dropped so the rows measure exactly the whale's bounding box.
 */
export declare function renderWhaleRows(): string[];
/** The whale as an Ink component: 9 rows × 24 columns, never shrinking. */
export declare function WhaleArt(): React.ReactNode;
//# sourceMappingURL=Whale.d.ts.map