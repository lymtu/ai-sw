export const TRANSFORMERS_CACHE_NAME = 'transformers-cache'

/** Hugging Face / 镜像站 resolve URL 中的模型 ID，如 Xenova/whisper-small */
const MODEL_ID_IN_CACHE_URL =
  /(?:huggingface\.co|hf-mirror\.com)\/(.+?)\/resolve\//i

export type CachedWhisperModel = {
  modelId: string
  fileCount: number
  sizeBytes: number
}

export type WhisperCacheSummary = {
  models: CachedWhisperModel[]
  totalBytes: number
  entryCount: number
}

export function parseModelIdFromCacheUrl(url: string): string | null {
  const match = url.match(MODEL_ID_IN_CACHE_URL)
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB'] as const
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const value = bytes / 1024 ** i
  return `${value < 10 && i > 0 ? value.toFixed(1) : Math.round(value)} ${units[i]}`
}

async function openTransformersCache(): Promise<Cache | null> {
  if (typeof caches === 'undefined') return null
  try {
    return await caches.open(TRANSFORMERS_CACHE_NAME)
  } catch (e) {
    console.warn('openTransformersCache failed:', e)
    return null
  }
}

async function responseSize(response: Response): Promise<number> {
  const len = response.headers.get('Content-Length')
  if (len) {
    const n = Number.parseInt(len, 10)
    if (!Number.isNaN(n) && n >= 0) return n
  }
  try {
    return (await response.blob()).size
  } catch {
    return 0
  }
}

/** 扫描 transformers-cache，按模型 ID 汇总已缓存文件 */
export async function listCachedWhisperModels(): Promise<WhisperCacheSummary> {
  const cache = await openTransformersCache()
  if (!cache) {
    return { models: [], totalBytes: 0, entryCount: 0 }
  }

  const byModel = new Map<string, { fileCount: number; sizeBytes: number }>()
  let totalBytes = 0
  let entryCount = 0

  const requests = await cache.keys()
  for (const request of requests) {
    const url = request.url
    const modelId = parseModelIdFromCacheUrl(url)
    if (!modelId) continue

    const response = await cache.match(request)
    if (!response) continue

    const size = await responseSize(response)
    entryCount += 1
    totalBytes += size

    const prev = byModel.get(modelId) ?? { fileCount: 0, sizeBytes: 0 }
    byModel.set(modelId, {
      fileCount: prev.fileCount + 1,
      sizeBytes: prev.sizeBytes + size,
    })
  }

  const models = Array.from(byModel.entries())
    .map(([modelId, stats]) => ({
      modelId,
      fileCount: stats.fileCount,
      sizeBytes: stats.sizeBytes,
    }))
    .sort((a, b) => a.modelId.localeCompare(b.modelId))

  return { models, totalBytes, entryCount }
}

/** 删除某一模型在缓存中的全部文件 */
export async function deleteCachedWhisperModel(modelId: string): Promise<number> {
  const cache = await openTransformersCache()
  if (!cache) return 0

  const normalized = modelId.trim()
  const prefix = `/${normalized}/resolve/`
  let removed = 0

  for (const request of await cache.keys()) {
    const url = request.url
    const parsed = parseModelIdFromCacheUrl(url)
    if (parsed !== normalized && !url.includes(prefix)) continue
    if (await cache.delete(request)) removed += 1
  }

  return removed
}

export async function clearTransformersModelCache(): Promise<void> {
  if (typeof caches === 'undefined') return
  try {
    const deleted = await caches.delete(TRANSFORMERS_CACHE_NAME)
    if (!deleted) {
      const cache = await openTransformersCache()
      if (!cache) return
      const keys = await cache.keys()
      await Promise.all(keys.map((req) => cache.delete(req)))
    }
  } catch (e) {
    console.warn('clearTransformersModelCache failed:', e)
  }
}

export function isWhisperDownloadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  const lower = msg.toLowerCase()
  return (
    msg.includes('CONTENT_LENGTH_MISMATCH') ||
    msg.includes('ERR_CONTENT_LENGTH_MISMATCH') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error') ||
    lower.includes('load failed') ||
    msg.includes('Unable to load') ||
    /Error \((404|408|429|500|502|503|504)\)/.test(msg)
  )
}

export function formatWhisperLoadError(error: unknown): Error {
  const msg = error instanceof Error ? error.message : String(error)
  if (isWhisperDownloadError(error)) {
    return new Error(
      'Whisper 模型下载失败或缓存已损坏（常见于网络中断）。请到「设置 → 语音转写」清除对应模型缓存后重试；若在国内访问 huggingface.co 不稳定，可开代理或稍后再试。',
    )
  }
  return error instanceof Error ? error : new Error(msg)
}
