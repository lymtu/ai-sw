import { useCallback, useEffect, useState } from 'react'
import type { ThemeMode } from '../../shared/types'

function resolveThemeClass(mode: ThemeMode): 'theme-light' | 'theme-dark' {
  if (mode === 'dark') return 'theme-dark'
  if (mode === 'light') return 'theme-light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'theme-dark'
    : 'theme-light'
}

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement
  root.classList.remove('theme-light', 'theme-dark')
  root.classList.add(resolveThemeClass(mode))
  root.dataset.theme = mode
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const syncFromConfig = useCallback(async () => {
    const config = await window.desktopAgent.getConfig()
    applyTheme(config.theme)
  }, [])

  useEffect(() => {
    applyTheme('light')
    void syncFromConfig()
  }, [syncFromConfig])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      void window.desktopAgent.getConfig().then((c) => {
        if (c.theme === 'system') applyTheme('system')
      })
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    return window.desktopAgent.onConfigUpdated((c) => {
      applyTheme(c.theme)
    })
  }, [])

  return children
}

export function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>('light')

  useEffect(() => {
    void window.desktopAgent.getConfig().then((c) => setTheme(c.theme))
  }, [])

  const setThemeMode = (mode: ThemeMode) => {
    setTheme(mode)
    applyTheme(mode)
  }

  return { theme, setThemeMode }
}
