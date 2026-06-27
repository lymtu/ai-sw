const THINK_TAGS: ReadonlyArray<{ open: string; close: string }> = [
  { open: '\u003cthink\u003e', close: '\u003c/think\u003e' },
  {
    open: '\u003credacted_thinking\u003e',
    close: '\u003c/redacted_thinking\u003e',
  },
]

/** 去掉所有 think / redacted_thinking 块，保留标签外的正文 */
export function stripThinkTags(raw: string): string {
  let text = raw
  for (const tag of THINK_TAGS) {
    const openRe = new RegExp(escapeRegExp(tag.open), 'g')
    const closeRe = new RegExp(escapeRegExp(tag.close), 'g')
    text = text.replace(openRe, '').replace(closeRe, '')
  }
  return text.trim()
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 解析模型在正文里用 think / redacted_thinking 标签包裹的思考内容 */
export function splitThinkAndAnswer(raw: string): {
  thinking: string
  answer: string
} {
  let earliest = -1
  let marker: (typeof THINK_TAGS)[number] | null = null

  for (const tag of THINK_TAGS) {
    const idx = raw.indexOf(tag.open)
    if (idx !== -1 && (earliest === -1 || idx < earliest)) {
      earliest = idx
      marker = tag
    }
  }

  if (!marker || earliest === -1) {
    return { thinking: '', answer: raw }
  }

  const afterOpen = raw.slice(earliest + marker.open.length)
  const close = afterOpen.indexOf(marker.close)
  if (close === -1) {
    return { thinking: afterOpen, answer: raw.slice(0, earliest) }
  }

  return {
    thinking: afterOpen.slice(0, close),
    answer: `${raw.slice(0, earliest)}${afterOpen.slice(close + marker.close.length)}`.trim(),
  }
}

export function mergeStreamText(
  reasoningBuf: string,
  textBuf: string,
): { thinking: string; answer: string } {
  const fromTags = splitThinkAndAnswer(textBuf)
  const thinking = [reasoningBuf, fromTags.thinking].filter(Boolean).join('\n')
  return {
    thinking: thinking.trim(),
    answer: fromTags.answer.trim(),
  }
}

/**
 * 解析应展示给用户的正文（思考区单独走 Thinking 卡片，不占用 content）。
 */
export function resolveDisplayAnswer(
  reasoningBuf: string,
  textBuf: string,
): string {
  const { answer } = mergeStreamText(reasoningBuf, textBuf)
  if (answer.trim()) return answer.trim()

  const stripped = stripThinkTags(textBuf)
  if (stripped) return stripped

  return textBuf.trim()
}
