import { useCallback, useRef, useState } from 'react'

export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
    const recorder = new MediaRecorder(stream, { mimeType })
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    setRecording(true)
  }, [])

  const stop = useCallback((): Promise<{ buffer: ArrayBuffer; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        reject(new Error('未在录音'))
        return
      }

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        recorder.stream.getTracks().forEach((t) => t.stop())
        mediaRecorderRef.current = null
        setRecording(false)
        resolve({ buffer: await blob.arrayBuffer(), mimeType })
      }

      recorder.stop()
    })
  }, [])

  return { recording, start, stop }
}
