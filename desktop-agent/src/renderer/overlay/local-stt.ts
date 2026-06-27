import { env, pipeline } from '@huggingface/transformers'
import type { AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers'
import type { LocalWhisperLanguage } from '../../shared/types'
import {
  isEnglishOnlyWhisperModel,
  whisperLanguageToCode,
} from '../../shared/whisper-local'
import {
  clearTransformersModelCache,
  formatWhisperLoadError,
  isWhisperDownloadError,
} from '@renderer/shared/whisper-cache'

const SAMPLE_RATE = 16_000

env.allowLocalModels = false
env.useBrowserCache = true

let transcriberPromise: Promise<AutomaticSpeechRecognitionPipeline> | null =
  null
let loadedModelId = ''

export function resetLocalWhisperPipeline(): void {
  transcriberPromise = null
  loadedModelId = ''
}

/** 设置页删除缓存后：仅当删的是当前已加载模型（或全部清空）时重置 pipeline */
export function handleWhisperCacheInvalidated(deletedModelId?: string): void {
  if (!deletedModelId || deletedModelId === loadedModelId) {
    resetLocalWhisperPipeline()
  }
}

/** 清除 Transformers.js 浏览器缓存并丢弃已加载的 pipeline */
export async function clearWhisperCacheAndReset(): Promise<void> {
  await clearTransformersModelCache()
  resetLocalWhisperPipeline()
}

export function preloadLocalWhisper(modelId: string): void {
  if (isEnglishOnlyWhisperModel(modelId)) return
  void getTranscriber(modelId).catch(() => {
    resetLocalWhisperPipeline()
  })
}

async function createTranscriber(
  modelId: string,
): Promise<AutomaticSpeechRecognitionPipeline> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return (await pipeline(
        'automatic-speech-recognition',
        modelId,
      )) as unknown as AutomaticSpeechRecognitionPipeline
    } catch (error) {
      if (attempt === 0 && isWhisperDownloadError(error)) {
        await clearTransformersModelCache()
        continue
      }
      throw formatWhisperLoadError(error)
    }
  }
  throw new Error('Whisper 模型加载失败')
}

function extractTranscriptionText(result: unknown): string {
  if (typeof result === 'string') return result.trim()
  if (Array.isArray(result)) {
    return result.map(extractTranscriptionText).join(' ').trim()
  }
  if (result && typeof result === 'object' && 'text' in result) {
    const text = (result as { text?: unknown }).text
    return typeof text === 'string' ? text.trim() : ''
  }
  return ''
}

function getTranscriber(modelId: string) {
  if (!transcriberPromise || loadedModelId !== modelId) {
    loadedModelId = modelId
    transcriberPromise = createTranscriber(modelId)
  }
  return transcriberPromise
}

/** 归一化音量，避免录音过小导致识别乱猜为英文 */
function normalizeAudioLevel(audio: Float32Array): Float32Array {
  let peak = 0
  for (let i = 0; i < audio.length; i++) {
    peak = Math.max(peak, Math.abs(audio[i]))
  }
  if (peak < 1e-6) return audio
  const scale = 0.9 / peak
  if (scale >= 1) return audio
  const out = new Float32Array(audio.length)
  for (let i = 0; i < audio.length; i++) {
    out[i] = audio[i] * scale
  }
  return out
}

export async function transcribeLocal(
  audio: Float32Array,
  modelId: string,
  language: LocalWhisperLanguage,
): Promise<string> {
  if (isEnglishOnlyWhisperModel(modelId)) {
    throw new Error(
      '当前为纯英文 Whisper 模型（.en），无法识别中文。请在设置 → 语音转写 改用 Xenova/whisper-small',
    )
  }

  const transcriber = await getTranscriber(modelId)
  const normalized = normalizeAudioLevel(audio)
  const durationSec = normalized.length / SAMPLE_RATE
  const languageCode = whisperLanguageToCode(language)

  const options: {
    task: 'transcribe'
    language: string
    chunk_length_s?: number
    stride_length_s?: number
  } = {
    task: 'transcribe',
    language: languageCode,
  }

  if (durationSec > 25) {
    options.chunk_length_s = 30
    options.stride_length_s = 5
  }

  const result = await transcriber(normalized, options)
  const text = extractTranscriptionText(result)
  if (!text) {
    throw new Error('未识别到语音内容')
  }
  return text
}
