const CODE_KEY_MAP: Record<string, string> = {
  Space: 'Space',
  Enter: 'Enter',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Escape: 'Escape',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  Insert: 'Insert',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backquote: '`',
}

const MODIFIER_KEYS = new Set([
  'Control',
  'Shift',
  'Alt',
  'Meta',
  'OS',
  'Command',
])

const MODIFIER_PARTS = new Set([
  'CommandOrControl',
  'Control',
  'Shift',
  'Alt',
  'Super',
  'Option',
])

function isMacPlatform(): boolean {
  return navigator.platform.toUpperCase().includes('MAC')
}

function codeToElectronKey(code: string, key: string): string | null {
  if (code.startsWith('Key') && code.length === 4) {
    return code.slice(3)
  }
  if (code.startsWith('Digit') && code.length === 6) {
    return code.slice(5)
  }
  if (/^F\d+$/.test(code)) {
    return code
  }
  if (CODE_KEY_MAP[code]) {
    return CODE_KEY_MAP[code]
  }
  if (key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
    return key.toUpperCase()
  }
  return null
}

export function getModifierParts(event: KeyboardEvent): string[] {
  const parts: string[] = []
  const isMac = isMacPlatform()

  if (isMac) {
    if (event.metaKey) parts.push('CommandOrControl')
    if (event.ctrlKey) parts.push('Control')
  } else {
    if (event.ctrlKey) parts.push('CommandOrControl')
    if (event.metaKey) parts.push('Super')
  }

  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')

  return parts
}

/** 根据当前按键状态生成加速器片段（keydown 时包含主键） */
export function getAcceleratorPartsFromKeyDown(event: KeyboardEvent): string[] {
  const parts = getModifierParts(event)

  if (event.key === 'Escape' || MODIFIER_KEYS.has(event.key)) {
    return parts
  }

  const electronKey = codeToElectronKey(event.code, event.key)
  if (electronKey) {
    parts.push(electronKey)
  }

  return parts
}

export function isValidAcceleratorParts(parts: string[]): boolean {
  if (parts.length < 2) return false
  const hasMainKey = parts.some((p) => !MODIFIER_PARTS.has(p))
  return hasMainKey
}

export function partsToAccelerator(parts: string[]): string {
  return parts.join('+')
}

/** 将键盘事件转为 Electron globalShortcut 加速器字符串（完成录制时） */
export function keyboardEventToAccelerator(event: KeyboardEvent): string | null {
  if (event.repeat) return null

  const parts = getAcceleratorPartsFromKeyDown(event)
  if (!isValidAcceleratorParts(parts)) return null

  return partsToAccelerator(parts)
}

/** 界面展示用（如 Ctrl+Shift+Space） */
export function formatAcceleratorDisplay(accelerator: string): string {
  if (!accelerator.trim()) return ''
  return formatPartsDisplay(accelerator.split('+'))
}

export function formatPartsDisplay(parts: string[]): string {
  if (parts.length === 0) return ''

  const isMac = isMacPlatform()
  return parts
    .map((part) => {
      switch (part) {
        case 'CommandOrControl':
          return isMac ? '⌘' : 'Ctrl'
        case 'Control':
          return isMac ? '⌃' : 'Ctrl'
        case 'Shift':
          return isMac ? '⇧' : 'Shift'
        case 'Alt':
        case 'Option':
          return isMac ? '⌥' : 'Alt'
        case 'Super':
          return 'Win'
        default:
          return part
      }
    })
    .join(isMac ? '' : '+')
}
