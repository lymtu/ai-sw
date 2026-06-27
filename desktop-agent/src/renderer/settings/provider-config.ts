import type { PublicConfig, PublicProvider } from '../../shared/types'

export function updateProvider(
  config: PublicConfig,
  providerId: string,
  updater: (provider: PublicProvider) => PublicProvider,
): PublicConfig {
  return {
    ...config,
    providers: config.providers.map((provider) =>
      provider.id === providerId ? updater(provider) : provider,
    ),
  }
}

export function isSuccessMessage(message: string): boolean {
  return message.includes('成功') || message.includes('已保存')
}
