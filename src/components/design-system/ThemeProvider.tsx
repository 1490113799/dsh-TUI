import React, { createContext, useContext } from 'react'
import type { ThemeName } from '../../theme.js'

/**
 * Simplified theme provider for the cc-tui port. The leaked Claude Code
 * original resolved `auto` against the terminal's system theme and persisted
 * the choice; cc-tui is dark-first and exposes the palette via `useTheme`.
 */
const ThemeContext = createContext<ThemeName>('dark')

export function ThemeProvider({
  children,
  theme = 'dark',
}: {
  children: React.ReactNode
  theme?: ThemeName
}): React.ReactNode {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  )
}

/** Resolves the active `ThemeName`. Returns `[themeName]` to match the leak's shape. */
export function useTheme(): [ThemeName] {
  return [useContext(ThemeContext)]
}
