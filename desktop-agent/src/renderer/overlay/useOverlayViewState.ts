import { useCallback, useEffect, useRef, useState } from 'react'
import type { OverlayViewMode } from '../../shared/overlay-layout'
import { applyTheme } from '@renderer/shared/theme'
import type { RadialMenuAction } from './OverlayRadialMenu'

type Params = {
  streaming: boolean
  stopStreaming: () => void
  focusInputForMode: () => void
  enterTextMode: (mergePreview?: boolean) => void
  enterVoiceMode: () => void
  startNewSession: () => void
}

export function useOverlayViewState({
  streaming,
  stopStreaming,
  focusInputForMode,
  enterTextMode,
  enterVoiceMode,
  startNewSession,
}: Params) {
  const [viewMode, setViewMode] = useState<OverlayViewMode>('input')
  const [menuOpen, setMenuOpen] = useState(false)
  const viewModeRef = useRef(viewMode)
  const streamingRef = useRef(streaming)
  const prevViewModeRef = useRef(viewMode)
  const focusInputForModeRef = useRef(focusInputForMode)
  const enterTextModeRef = useRef(enterTextMode)
  const enterVoiceModeRef = useRef(enterVoiceMode)
  const startNewSessionRef = useRef(startNewSession)
  const stopStreamingRef = useRef(stopStreaming)

  viewModeRef.current = viewMode
  streamingRef.current = streaming
  focusInputForModeRef.current = focusInputForMode
  enterTextModeRef.current = enterTextMode
  enterVoiceModeRef.current = enterVoiceMode
  startNewSessionRef.current = startNewSession
  stopStreamingRef.current = stopStreaming

  const showRadialMenu = viewMode === 'collapsed'
  const radialMenuOpen = showRadialMenu && menuOpen

  useEffect(() => {
    if (viewMode !== 'collapsed') setMenuOpen(false)
  }, [viewMode])

  const dismissRadialMenu = useCallback(() => {
    setMenuOpen(false)
  }, [])

  const hideOverlayWindow = useCallback(async () => {
    dismissRadialMenu()
    await window.desktopAgent.hideOverlay()
  }, [dismissRadialMenu])

  useEffect(() => {
    return window.desktopAgent.onOverlayHidden(() => {
      setMenuOpen(false)
    })
  }, [])

  useEffect(() => {
    return window.desktopAgent.onOverlayFocusText(() => {
      if (streamingRef.current || viewModeRef.current === 'conversation') {
        return
      }
      setViewMode('input')
      enterTextModeRef.current(false)
    })
  }, [])

  const handleOrbContextMenu = useCallback(() => {
    if (viewMode === 'conversation') {
      setViewMode('collapsed')
      setMenuOpen(true)
      return
    }
    if (viewMode === 'input') {
      setViewMode('collapsed')
      setMenuOpen(true)
      return
    }
    if (viewMode === 'collapsed') {
      setMenuOpen((open) => !open)
    }
  }, [viewMode])

  const handleOrbTap = useCallback(() => {
    if (streaming) {
      stopStreamingRef.current()
      return
    }
    if (viewMode === 'conversation') {
      setViewMode('input')
      focusInputForModeRef.current()
      return
    }
    if (viewMode === 'input') {
      setMenuOpen(false)
      setViewMode('collapsed')
      return
    }
    if (viewMode === 'collapsed' && menuOpen) {
      setMenuOpen(false)
      return
    }
    if (viewMode === 'collapsed') {
      setMenuOpen(false)
      setViewMode('input')
      focusInputForModeRef.current()
    }
  }, [streaming, viewMode, menuOpen])

  const toggleTheme = useCallback(async () => {
    const isDark = document.documentElement.classList.contains('theme-dark')
    const next = isDark ? 'light' : 'dark'
    applyTheme(next)
    await window.desktopAgent.saveConfig({ theme: next })
  }, [])

  const handleRadialAction = useCallback(
    (action: RadialMenuAction) => {
      const run = async () => {
        switch (action) {
          case 'text':
            setMenuOpen(false)
            setViewMode('input')
            enterTextModeRef.current(false)
            break
          case 'voice':
            setMenuOpen(false)
            setViewMode('input')
            enterVoiceModeRef.current()
            break
          case 'new-chat':
            setMenuOpen(false)
            startNewSessionRef.current()
            break
          case 'settings':
            dismissRadialMenu()
            await window.desktopAgent.showSettings()
            break
          case 'theme':
            dismissRadialMenu()
            await toggleTheme()
            break
          case 'history':
            dismissRadialMenu()
            await window.desktopAgent.showSettings('history')
            break
        }
      }
      void run()
    },
    [
      dismissRadialMenu,
      toggleTheme,
    ],
  )

  return {
    viewMode,
    setViewMode,
    viewModeRef,
    prevViewModeRef,
    menuOpen,
    setMenuOpen,
    showRadialMenu,
    radialMenuOpen,
    hideOverlayWindow,
    handleOrbTap,
    handleOrbContextMenu,
    handleRadialAction,
  }
}
