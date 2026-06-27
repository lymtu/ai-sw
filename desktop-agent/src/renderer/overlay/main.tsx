import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { suppressKnownAgentscopeDevWarnings } from '@renderer/shared/agentscope-chat/suppress-known-dev-warnings'
import '@renderer/shared/styles.css'
import { ThemeProvider } from '@renderer/shared/theme'
import { OverlayApp } from './OverlayApp'

suppressKnownAgentscopeDevWarnings()

document.documentElement.classList.add('overlay-root')
document.body.classList.add('overlay-body')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <OverlayApp />
    </ThemeProvider>
  </StrictMode>,
)
