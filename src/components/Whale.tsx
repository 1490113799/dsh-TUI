import React from 'react'
import { Box, Text } from '../ui.js'

/**
 * The DeepSeek pixel whale, ported from `deepseek_whale_exact_ansi.py`: a
 * 24×18 sprite in four true-color tones (deep-navy outline, DeepSeek-blue
 * body, ice-blue belly, white mouth). Rendered with the half-block
 * technique — each terminal cell packs two vertical pixels into one `▀`/`▄`
 * glyph (foreground = upper pixel, background = lower), so the whale shows
 * at 24 columns × 9 rows with visually square pixels.
 */

type Rgb = readonly [number, number, number]

/** Sprite palette: D outline · B body · L belly · W mouth · `.` transparent. */
const PALETTE: Record<string, Rgb | undefined> = {
  D: [20, 38, 96],
  B: [78, 111, 255],
  L: [190, 225, 255],
  W: [255, 255, 255],
}

const SPRITE = [
  '...............D........',
  '...............DD.......',
  '...............DBD.....D',
  '...............DBBD.DDDB',
  '....DDDDDDD....DBBBDBBBB',
  '...DBBBBBBBD....BBBBBBBD',
  '..DBBBBBBBBBDD..DBBBBBD.',
  '.DBBBBBBBBBBBBDDDBBBDD..',
  'DBBBBBBBBBBBBBBBBBBD....',
  'DBBBBBBBBBBBBBBBBBBD....',
  'DBDBBBBBBDBBBBBBBBBD....',
  'DBDBBBBBBDBBBBBBBBBD....',
  'DBBBWWWWWBBBBBBBBBD.....',
  'DDWWWWWWWWWBBBBDBBD.....',
  '.DLWWWWWWWWWDBBBDD......',
  '..DDLWWWWWWWLBBBBD......',
  '..DDDLLLLLLLLDBBBD......',
  '....DDDDDDDDDD..........',
] as const

const fg = (rgb: Rgb): string => `\x1b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m`
const bg = (rgb: Rgb): string => `\x1b[48;2;${rgb[0]};${rgb[1]};${rgb[2]}m`
const RESET = '\x1b[0m'

/**
 * Render the sprite to 9 ANSI rows (one per sprite row pair). Consecutive
 * cells sharing one style are run-length encoded; trailing transparent
 * cells are dropped so the rows measure exactly the whale's bounding box.
 */
export function renderWhaleRows(): string[] {
  const rows: string[] = []
  for (let r = 0; r < SPRITE.length; r += 2) {
    const upper = SPRITE[r]!
    const lower = SPRITE[r + 1]!
    let out = ''
    let current = ''
    for (let x = 0; x < upper.length; x++) {
      const up = PALETTE[upper[x]!]
      const lo = PALETTE[lower[x]!]
      let seq: string
      let ch: string
      if (up !== undefined && lo !== undefined) {
        seq = fg(up) + bg(lo)
        ch = '▀'
      } else if (up !== undefined) {
        seq = fg(up)
        ch = '▀'
      } else if (lo !== undefined) {
        seq = fg(lo)
        ch = '▄'
      } else {
        seq = ''
        ch = ' '
      }
      if (seq !== current) {
        out += seq === '' ? RESET : seq
        current = seq
      }
      out += ch
    }
    // Drop the transparent tail (plain spaces paint nothing), then always
    // close the row's style — a row ending on a colored cell would
    // otherwise leak its SGR into the line's remaining padding.
    let row = out.replace(/[ ]+$/, '')
    if (!row.endsWith(RESET)) row += RESET
    rows.push(row)
  }
  return rows
}

/** The whale as an Ink component: 9 rows × 24 columns, never shrinking. */
export function WhaleArt(): React.ReactNode {
  const rows = React.useMemo(renderWhaleRows, [])
  return (
    <Box flexDirection="column" flexShrink={0}>
      {rows.map((row, index) => (
        <Text key={index} wrap="truncate-end">
          {row}
        </Text>
      ))}
    </Box>
  )
}
