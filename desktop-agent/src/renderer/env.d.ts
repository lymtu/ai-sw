import type { DesktopAgentApi } from '../preload/index'

declare global {
  interface Window {
    desktopAgent: DesktopAgentApi
  }
}

export {}
