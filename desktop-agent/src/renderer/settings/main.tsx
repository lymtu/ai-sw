import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@renderer/shared/styles.css'
import { ThemeProvider } from '@renderer/shared/theme'
import { SettingsApp } from './SettingsApp'
import { suppressKnownSettingsDevWarnings } from './suppress-known-dev-warnings'

suppressKnownSettingsDevWarnings()

document.documentElement.classList.add('settings-root')
document.body.classList.add('settings-body')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SettingsApp />
    </ThemeProvider>
  </StrictMode>,
)
