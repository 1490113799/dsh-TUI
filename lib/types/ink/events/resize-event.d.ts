import { Event } from './event.js';
/**
 * Terminal resize event. Not yet dispatched by the ported core; declared for
 * the event-handler props surface.
 */
export declare class ResizeEvent extends Event {
    readonly columns: number;
    readonly rows: number;
    constructor(columns: number, rows: number);
}
//# sourceMappingURL=resize-event.d.ts.map