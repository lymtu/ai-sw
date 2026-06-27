const TARGET_SAMPLE_RATE = 16_000

/** 将录音 Blob 解码为 Whisper 所需的 16kHz 单声道 Float32Array */
export async function blobToFloat32Mono16k(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer()
  const ctx = new AudioContext()
  try {
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0))
    const frames = Math.ceil(decoded.duration * TARGET_SAMPLE_RATE)
    const offline = new OfflineAudioContext(1, frames, TARGET_SAMPLE_RATE)
    const source = offline.createBufferSource()
    source.buffer = decoded
    source.connect(offline.destination)
    source.start(0)
    const rendered = await offline.startRendering()
    return rendered.getChannelData(0)
  } finally {
    await ctx.close()
  }
}
