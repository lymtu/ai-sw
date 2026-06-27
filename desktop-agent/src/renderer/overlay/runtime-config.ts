import type { PublicConfig } from '../../shared/types'

/** Overlay 侧最新配置（含设置页未保存前的预览） */
let runtimeConfig: PublicConfig | null = null

export function setOverlayRuntimeConfig(config: PublicConfig): void {
  runtimeConfig = config
}

export function getOverlayRuntimeConfig(): PublicConfig | null {
  return runtimeConfig
}
