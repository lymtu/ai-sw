import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { OverlayViewMode } from '../../shared/overlay-layout'
import { transcribeRecording } from './transcribe'
import { useRecorder } from './useRecorder'
import type { InputMode } from './types'

type Params = {
  chatBusy: boolean
  viewMode: OverlayViewMode
  setViewMode: (mode: OverlayViewMode) => void
  onSendMessage: (text: string) => void
  onHideOverlay: () => void
}

export function useOverlayVoiceInput({
  chatBusy,
  viewMode,
  setViewMode,
  onSendMessage,
  onHideOverlay,
}: Params) {
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [input, setInput] = useState('')
  const [voicePreview, setVoicePreview] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const voiceMicRef = useRef<HTMLButtonElement>(null)
  const prevHasVoicePreviewRef = useRef(false)
  const transcribeGenRef = useRef(0)
  const { recording, start: startRecord, stop: stopRecord } = useRecorder()

  const hasVoicePreview = voicePreview.trim().length > 0
  const voicePanelLocked = chatBusy || transcribing

  const focusTextInput = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => inputRef.current?.focus())
    })
  }, [])

  const focusTextInputAtEnd = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = inputRef.current
        if (!el) return
        el.focus()
        const len = el.value.length
        el.setSelectionRange(len, len)
      })
    })
  }, [])

  const focusVoiceMic = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => voiceMicRef.current?.focus())
    })
  }, [])

  const focusInputForMode = useCallback(() => {
    if (hasVoicePreview) {
      focusTextInputAtEnd()
    } else if (inputMode === 'text') {
      focusTextInput()
    } else {
      focusVoiceMic()
    }
  }, [inputMode, hasVoicePreview, focusTextInput, focusTextInputAtEnd, focusVoiceMic])

  const enterTextMode = useCallback(
    (mergePreview = false) => {
      if (mergePreview && voicePreview.trim()) {
        setInput(voicePreview)
      }
      setVoicePreview('')
      setInputMode('text')
      focusTextInput()
    },
    [voicePreview, focusTextInput],
  )

  const enterVoiceMode = useCallback(() => {
    setInputMode('voice')
    setVoicePreview('')
    setError(null)
    focusVoiceMic()
  }, [focusVoiceMic])

  useEffect(() => {
    const wasPreview = prevHasVoicePreviewRef.current
    const gainedPreview =
      inputMode === 'voice' &&
      viewMode === 'input' &&
      hasVoicePreview &&
      !wasPreview
    const lostPreview =
      inputMode === 'voice' &&
      viewMode === 'input' &&
      !hasVoicePreview &&
      wasPreview
    prevHasVoicePreviewRef.current = hasVoicePreview
    if (gainedPreview) {
      focusTextInputAtEnd()
    } else if (lostPreview) {
      focusVoiceMic()
    }
  }, [
    inputMode,
    viewMode,
    hasVoicePreview,
    voicePreview,
    focusTextInputAtEnd,
    focusVoiceMic,
  ])

  const cancelTranscription = useCallback(() => {
    transcribeGenRef.current += 1
    setTranscribing(false)
    setError(null)
  }, [])

  const finishRecording = useCallback(async () => {
    if (!recording) return
    setTranscribing(true)
    setError(null)
    const gen = ++transcribeGenRef.current
    try {
      const { buffer, mimeType } = await stopRecord()
      if (gen !== transcribeGenRef.current) return
      const text = await transcribeRecording(buffer, mimeType)
      if (gen !== transcribeGenRef.current) return
      const trimmed = text.trim()
      if (!trimmed) {
        setError('未识别到语音内容')
        return
      }
      setInputMode('voice')
      setVoicePreview(trimmed)
      setViewMode('input')
    } catch (e) {
      if (gen !== transcribeGenRef.current) return
      setError(e instanceof Error ? e.message : '语音处理失败')
    } finally {
      if (gen === transcribeGenRef.current) {
        setTranscribing(false)
      }
    }
  }, [recording, stopRecord, setViewMode])

  const startRecording = useCallback(() => {
    if (recording || chatBusy || transcribing) return
    setError(null)
    setVoicePreview('')
    void startRecord().catch((e) => {
      setError(e instanceof Error ? e.message : '无法访问麦克风')
    })
  }, [recording, chatBusy, transcribing, startRecord])

  const toggleRecording = useCallback(() => {
    if (transcribing) {
      cancelTranscription()
      return
    }
    if (recording) {
      void finishRecording()
    } else {
      startRecording()
    }
  }, [transcribing, recording, cancelTranscription, finishRecording, startRecording])

  const handlePttStart = useCallback(() => {
    setViewMode('input')
    setInputMode('voice')
    setVoicePreview('')
    setError(null)
    if (transcribing) {
      cancelTranscription()
      focusVoiceMic()
      return
    }
    if (chatBusy || recording) {
      focusVoiceMic()
      return
    }
    void startRecord().catch((e) => {
      setError(e instanceof Error ? e.message : '无法访问麦克风')
    })
    focusVoiceMic()
  }, [
    setViewMode,
    transcribing,
    chatBusy,
    recording,
    cancelTranscription,
    startRecord,
    focusVoiceMic,
  ])

  useEffect(() => {
    const unsubStart = window.desktopAgent.onPttStart(() => {
      handlePttStart()
    })
    const unsubStop = window.desktopAgent.onPttStop(() => {
      void finishRecording()
    })
    return () => {
      unsubStart()
      unsubStop()
    }
  }, [handlePttStart, finishRecording])

  const toggleInputMode = useCallback(() => {
    if (recording || voicePanelLocked) return
    setViewMode('input')
    if (inputMode === 'text') {
      enterVoiceMode()
    } else {
      enterTextMode(true)
    }
  }, [
    inputMode,
    recording,
    voicePanelLocked,
    setViewMode,
    enterVoiceMode,
    enterTextMode,
  ])

  useEffect(() => {
    return window.desktopAgent.onOverlayToggleInputMode(() => {
      toggleInputMode()
    })
  }, [toggleInputMode])

  const discardVoicePreview = useCallback(() => {
    if (recording || voicePanelLocked) return
    setVoicePreview('')
    setError(null)
  }, [recording, voicePanelLocked])

  const handleSend = useCallback(() => {
    if (inputMode === 'voice') {
      onSendMessage(voicePreview)
    } else {
      onSendMessage(input)
    }
  }, [inputMode, voicePreview, input, onSendMessage])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        const canSend =
          inputMode === 'text' ? input.trim() : voicePreview.trim()
        if (canSend && !voicePanelLocked) handleSend()
      }
      if (event.key === 'Escape') {
        onHideOverlay()
      }
    },
    [inputMode, input, voicePreview, voicePanelLocked, handleSend, onHideOverlay],
  )

  const clearInput = useCallback(() => {
    setInput('')
    setVoicePreview('')
    setError(null)
  }, [])

  const voiceStatusLabel =
    error && inputMode === 'voice' && !hasVoicePreview
      ? error
      : transcribing
        ? '正在识别，点击取消'
        : recording
          ? '录音中，点击结束'
          : hasVoicePreview
            ? '核对后发送'
            : '点击麦克风开始'

  const sendDisabled =
    voicePanelLocked ||
    (inputMode === 'text' ? !input.trim() : !voicePreview.trim())

  return {
    inputMode,
    input,
    setInput,
    voicePreview,
    setVoicePreview,
    hasVoicePreview,
    transcribing,
    error,
    recording,
    inputRef,
    voiceMicRef,
    voicePanelLocked,
    voiceStatusLabel,
    voiceStatusHasError: Boolean(error && inputMode === 'voice' && !hasVoicePreview),
    sendDisabled,
    focusInputForMode,
    enterTextMode,
    enterVoiceMode,
    toggleInputMode,
    toggleRecording,
    discardVoicePreview,
    handleSend,
    handleKeyDown,
    clearInput,
  }
}
