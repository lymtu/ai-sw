import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@renderer/shared/cn'
import { IconTrash } from '@renderer/shared/icons/Icon'
import { deleteButtonClass, Field, inputClass } from './settings-form'
import {
  formatAcceleratorDisplay,
  formatPartsDisplay,
  getAcceleratorPartsFromKeyDown,
  getModifierParts,
  keyboardEventToAccelerator,
} from './hotkey-utils'

type Props = {
  label: string
  hint?: string
  value: string
  onChange: (accelerator: string) => void
}

export function HotkeyRecorder({ label, hint, value, onChange }: Props) {
  const [recording, setRecording] = useState(false)
  const [preview, setPreview] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const recordingRef = useRef(false)

  const stopRecording = useCallback(() => {
    recordingRef.current = false
    setRecording(false)
    setPreview('')
    void window.desktopAgent.resumeGlobalShortcuts()
  }, [])

  const startRecording = useCallback(() => {
    recordingRef.current = true
    setRecording(true)
    setPreview('')
    void window.desktopAgent.suspendGlobalShortcuts()
  }, [])

  const handleClear = useCallback(() => {
    onChange('')
    stopRecording()
    inputRef.current?.blur()
  }, [onChange, stopRecording])

  useEffect(() => {
    if (!recording) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (!recordingRef.current) return

      event.preventDefault()
      event.stopPropagation()

      if (event.key === 'Escape') {
        stopRecording()
        inputRef.current?.blur()
        return
      }

      const parts = getAcceleratorPartsFromKeyDown(event)
      setPreview(formatPartsDisplay(parts))

      if (!event.repeat) {
        const accelerator = keyboardEventToAccelerator(event)
        if (accelerator) {
          onChange(accelerator)
          stopRecording()
          inputRef.current?.blur()
        }
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (!recordingRef.current) return

      event.preventDefault()
      event.stopPropagation()

      if (event.key === 'Escape') return

      const parts = getModifierParts(event)
      setPreview(formatPartsDisplay(parts))
    }

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)

    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
    }
  }, [recording, onChange, stopRecording])

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current = false
        void window.desktopAgent.resumeGlobalShortcuts()
      }
    }
  }, [])

  const displayValue = recording
    ? preview || '请按下快捷键…'
    : formatAcceleratorDisplay(value)

  const defaultHint = recording
    ? '正在监听按键… 按 Esc 取消（已暂停全局快捷键）'
    : '点击输入框后，按下要绑定的快捷键组合'

  return (
    <Field label={label} hint={hint ?? defaultHint}>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          readOnly
          type="text"
          value={displayValue}
          placeholder="点击后录制"
          onFocus={startRecording}
          onBlur={stopRecording}
          className={cn(
            inputClass,
            'min-w-0 flex-1 cursor-pointer select-none caret-transparent',
            recording &&
              'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/25',
          )}
        />
        <button
          type="button"
          disabled={!value}
          title="清除快捷键"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClear}
          className={deleteButtonClass}
        >
          <IconTrash className="size-3.5 shrink-0" />
          清除
        </button>
      </div>
    </Field>
  )
}
