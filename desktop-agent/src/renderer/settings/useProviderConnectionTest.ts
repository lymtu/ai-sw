import { useCallback, useState } from 'react'
import type { PublicProvider } from '../../shared/types'

export function useProviderConnectionTest(
  provider: PublicProvider | undefined,
  apiKeys: Record<string, string>,
) {
  const [testStatus, setTestStatus] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  const clearTestStatus = useCallback(() => {
    setTestStatus(null)
  }, [])

  const handleTest = useCallback(async () => {
    if (!provider) return

    setTesting(true)
    setTestStatus(null)
    try {
      const result = await window.desktopAgent.testConnection({
        providerId: provider.id,
        baseUrl: provider.baseUrl,
        apiKey: apiKeys[provider.id]?.trim() || undefined,
      })
      setTestStatus(result.message)
    } catch (e) {
      setTestStatus(e instanceof Error ? e.message : '测试失败')
    } finally {
      setTesting(false)
    }
  }, [apiKeys, provider])

  return {
    testStatus,
    testing,
    clearTestStatus,
    handleTest,
  }
}
