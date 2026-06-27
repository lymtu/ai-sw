/** 开发态：屏蔽依赖库已知、无害的 console 噪音（不修改 node_modules） */
const SUPPRESSED_SNIPPETS = [
  '[antd: Tooltip] `overlayClassName` is deprecated',
  'pseudo class ":first-child" is potentially unsafe when doing server-side rendering',
] as const

function shouldSuppress(args: unknown[]): boolean {
  const text = args.map(String).join(' ')
  return SUPPRESSED_SNIPPETS.some((snippet) => text.includes(snippet))
}

function patchConsole(
  method: 'warn' | 'error',
  original: (...args: unknown[]) => void,
): void {
  console[method] = (...args: unknown[]) => {
    if (shouldSuppress(args)) return
    original(...args)
  }
}

export function suppressKnownAgentscopeDevWarnings(): void {
  if (!import.meta.env.DEV) return

  patchConsole('warn', console.warn.bind(console))
  patchConsole('error', console.error.bind(console))
}
