import React from 'react'
import { Box, Text } from '../ui.js'
import type { SessionRecord } from '../sessionHistory.js'
import { Pane } from './design-system/Pane.js'
import { ListItem } from './design-system/ListItem.js'
import { Byline } from './design-system/Byline.js'
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js'

/** Compact timestamp like `Jan 2, 03:04` for the resume list. */
function formatTimestamp(ms: number): string {
  const date = new Date(ms)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * `/resume` session picker in the CC ModelPicker style: a Pane with the
 * recent sessions as Select rows (title + time description, ✓ on the
 * current session), plus the Enter/Esc hint line.
 */
export function ResumePicker({
  sessions,
  focusIndex,
  currentSessionId,
}: {
  sessions: readonly SessionRecord[]
  focusIndex: number
  currentSessionId: string
}): React.ReactNode {
  return (
    <Pane color="permission">
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="remember" bold>
            Resume
          </Text>
        </Box>
        {sessions.map((session, index) => (
          <ListItem
            key={session.id}
            isFocused={index === focusIndex}
            isSelected={session.id === currentSessionId}
            description={formatTimestamp(session.updatedAt)}
          >
            {session.title || session.id}
          </ListItem>
        ))}
      </Box>
      <Text dimColor italic>
        <Byline>
          <KeyboardShortcutHint shortcut="Enter" action="confirm" bold />
          <KeyboardShortcutHint shortcut="Esc" action="exit" />
        </Byline>
      </Text>
    </Pane>
  )
}
