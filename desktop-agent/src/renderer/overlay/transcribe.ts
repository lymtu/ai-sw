import {
  normalizeLocalWhisperLanguage,
  normalizeLocalWhisperModel,
} from '../../shared/whisper-local'
import { blobToFloat32Mono16k } from './audio-utils'
import { transcribeLocal } from './local-stt'
import { getOverlayRuntimeConfig } from './runtime-config'

/** 按设置选择本地 Whisper 或云端 API 转写 */
export async function transcribeRecording(
  buffer: ArrayBuffer,
  mimeType: string,
): Promise<string> {
  const config =
    getOverlayRuntimeConfig() ?? (await window.desktopAgent.getConfig())

  if (config.sttMode === 'api') {
    return window.desktopAgent.transcribe(buffer, mimeType)
  }

  const blob = new Blob([buffer], { type: mimeType })
  const audio = await blobToFloat32Mono16k(blob)
  return transcribeLocal(
    audio,
    normalizeLocalWhisperModel(config.localWhisperModel),
    normalizeLocalWhisperLanguage(config.localWhisperLanguage),
  )
}
