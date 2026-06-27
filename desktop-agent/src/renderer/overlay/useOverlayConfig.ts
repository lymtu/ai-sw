import { useCallback, useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { PublicConfig } from '../../shared/types'
import {
  handleWhisperCacheInvalidated,
  preloadLocalWhisper,
} from './local-stt'
import { setOverlayRuntimeConfig } from './runtime-config'
import { primeOverlayWindowPosition } from './useOverlayWindowDrag'

type CanvasSize = {
  width: number
  height: number
}

export function useOverlayConfig(
  setCanvasSize: Dispatch<SetStateAction<CanvasSize | null>>,
) {
  const [opaqueOverlay, setOpaqueOverlay] = useState(false)

  const applyOverlayConfig = useCallback((config: PublicConfig) => {
    setOverlayRuntimeConfig(config)
    setOpaqueOverlay(config.opaqueOverlay)
    if (config.sttMode === 'local') {
      preloadLocalWhisper(config.localWhisperModel)
    }
  }, [])

  useEffect(() => {
    void window.desktopAgent.getConfig().then(applyOverlayConfig)
    void window.desktopAgent.getOverlayCanvasSize().then(setCanvasSize)
    void window.desktopAgent.getOverlayPosition().then(primeOverlayWindowPosition)
  }, [applyOverlayConfig, setCanvasSize])

  useEffect(() => {
    return window.desktopAgent.onConfigUpdated((config) => {
      applyOverlayConfig(config)
    })
  }, [applyOverlayConfig])

  useEffect(() => {
    return window.desktopAgent.onSttCacheCleared(({ modelId }) => {
      handleWhisperCacheInvalidated(modelId)
    })
  }, [])

  return { opaqueOverlay }
}
