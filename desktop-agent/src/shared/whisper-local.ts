import type { LocalWhisperLanguage } from './types'

/** Xenova 带 .en 的模型只能识别英文，中文会被强行转成英文输出 */
export function isEnglishOnlyWhisperModel(modelId: string): boolean {
  const id = modelId.trim().toLowerCase()
  return id.endsWith('.en') || id.includes('whisper-tiny.en')
}

/** 多语言模型 ID；若当前为 .en 则回退到 small */
export function normalizeLocalWhisperModel(modelId: string | undefined): string {
  const id = (modelId ?? '').trim()
  if (!id || isEnglishOnlyWhisperModel(id)) {
    return 'Xenova/whisper-small'
  }
  return id
}

/**
 * Transformers.js 未指定 language 时会默认英文。
 * `auto` 在库里等同未指定，不能用于中文场景。
 */
export function normalizeLocalWhisperLanguage(
  language: LocalWhisperLanguage | undefined,
): LocalWhisperLanguage {
  if (!language || language === 'auto') return 'chinese'
  return language
}

/** Whisper 语言参数：使用 ISO 代码 zh / en，避免歧义 */
export function whisperLanguageToCode(
  language: LocalWhisperLanguage,
): string {
  const normalized = normalizeLocalWhisperLanguage(language)
  return normalized === 'english' ? 'en' : 'zh'
}
