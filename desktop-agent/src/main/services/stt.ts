import { unlink, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { getActiveSttTarget } from '../config'

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const { baseUrl, whisperModel, apiKey } = getActiveSttTarget()

  if (!apiKey) {
    throw new Error('当前供应商未配置 API Key')
  }

  const ext = mimeType.includes('webm') ? 'webm' : 'wav'
  const tempPath = join(tmpdir(), `desktop-agent-${randomUUID()}.${ext}`)

  try {
    await writeFile(tempPath, buffer)

    const audioBytes = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer
    const blob = new Blob([audioBytes], { type: mimeType })
    const form = new FormData()
    form.append('file', blob, `audio.${ext}`)
    form.append('model', whisperModel)

    const res = await fetch(
      `${normalizeBaseUrl(baseUrl)}/audio/transcriptions`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      },
    )

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(
        `语音转写失败 (${res.status}): ${errText.slice(0, 200) || res.statusText}`,
      )
    }

    const json = (await res.json()) as { text?: string }
    const text = json.text?.trim()
    if (!text) {
      throw new Error('未识别到语音内容')
    }
    return text
  } finally {
    await unlink(tempPath).catch(() => {})
  }
}
