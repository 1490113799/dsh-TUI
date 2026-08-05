/**
 * Local slash commands for the dsh-cc TUI. Claude Code's command system is
 * deeply wired into its engine; cc-tui ships a small built-in set with the
 * same `/name — description` suggestion chrome, and `runCommand` is the seam
 * where `ctx.commands` integration can land later.
 */
export interface LocalCommand {
    /** The command name without the slash, e.g. `clear`. */
    name: string;
    /** One-line description shown in the suggestion overlay. */
    description: string;
    /** Optional bracket tag shown between name and description. */
    tag?: string;
}
export declare const LOCAL_COMMANDS: LocalCommand[];
/** Commands that must not be sent to the model when typed alone. */
export declare function isLocalCommandName(input: string): boolean;
/** Filter commands by a `/…` input prefix (matches the CC overlay behavior). */
export declare function filterCommands(input: string): LocalCommand[];
//# sourceMappingURL=commands.d.ts.map