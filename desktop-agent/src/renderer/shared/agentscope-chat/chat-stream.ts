let chatGeneration = 0
let activeUnsub: (() => void) | null = null

export function beginAgentscopeChatStream(): number {
  activeUnsub?.()
  activeUnsub = null
  chatGeneration += 1
  return chatGeneration
}

export function bindAgentscopeChatStream(
  generation: number,
  handler: Parameters<typeof window.desktopAgent.onChatStream>[0],
): void {
  activeUnsub?.()
  activeUnsub = window.desktopAgent.onChatStream((chunk) => {
    if (generation !== chatGeneration) return
    handler(chunk)
  })
}

export function endAgentscopeChatStream(generation: number): void {
  if (generation !== chatGeneration) return
  activeUnsub?.()
  activeUnsub = null
}

export function cancelAgentscopeChatStream(): void {
  chatGeneration += 1
  activeUnsub?.()
  activeUnsub = null
}
