import React from 'react'
import Box from '../ink/components/Box.js'
import Text from '../ink/components/Text.js'

/**
 * A single-line search input in the round-bordered box of the leak's
 * SearchBox: `⌕ ` prefix, block cursor at `cursorOffset` (inverse cell),
 * placeholder with its first character as the cursor when empty.
 */
export function SearchBox({
  query,
  placeholder = 'Search…',
  isFocused,
  isTerminalFocused,
  prefix = '⌕',
  width,
  cursorOffset,
  borderless = false,
}: {
  query: string
  placeholder?: string
  isFocused: boolean
  isTerminalFocused: boolean
  prefix?: string
  width?: number | string
  cursorOffset?: number
  borderless?: boolean
}): React.ReactNode {
  const offset = cursorOffset ?? query.length
  const borderStyle = borderless ? undefined : 'round'
  const borderColor = isFocused ? 'suggestion' : undefined
  const borderDimColor = !isFocused

  let content: React.ReactNode
  if (isFocused) {
    if (query) {
      content = isTerminalFocused ? (
        <>
          <Text>{query.slice(0, offset)}</Text>
          <Text inverse>{offset < query.length ? query[offset] : ' '}</Text>
          {offset < query.length && <Text>{query.slice(offset + 1)}</Text>}
        </>
      ) : (
        <Text>{query}</Text>
      )
    } else {
      content = isTerminalFocused ? (
        <>
          <Text inverse>{placeholder.charAt(0)}</Text>
          <Text dimColor>{placeholder.slice(1)}</Text>
        </>
      ) : (
        <Text dimColor>{placeholder}</Text>
      )
    }
  } else {
    content = query ? <Text>{query}</Text> : <Text>{placeholder}</Text>
  }

  return (
    <Box
      flexShrink={0}
      borderStyle={borderStyle}
      borderColor={borderColor}
      borderDimColor={borderDimColor}
      paddingX={borderless ? 0 : 1}
      width={width}
    >
      <Text dimColor={!isFocused}>
        {prefix} {content}
      </Text>
    </Box>
  )
}
