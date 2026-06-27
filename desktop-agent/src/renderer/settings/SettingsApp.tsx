import { useEffect, useState } from 'react'
import { SettingsTitleBar } from './SettingsTitleBar'
import { SettingsSidebar, type SettingsNavId } from './SettingsSidebar'
import { SettingsPanel } from './SettingsPanels'
import { cn } from '@renderer/shared/cn'
import { SettingsSaveBar } from './SettingsSaveBar'
import { useSettingsConfig } from './useSettingsConfig'

export function SettingsApp() {
  const [nav, setNav] = useState<SettingsNavId>('general')
  const {
    config,
    setConfig,
    apiKeys,
    setApiKey,
    status,
    clearStatus,
    loading,
    save,
  } = useSettingsConfig()

  useEffect(() => {
    const endOrbDrag = () => {
      void window.desktopAgent.endOverlayDrag()
    }
    window.addEventListener('pointerup', endOrbDrag)
    window.addEventListener('mouseup', endOrbDrag)
    return () => {
      window.removeEventListener('pointerup', endOrbDrag)
      window.removeEventListener('mouseup', endOrbDrag)
    }
  }, [])

  useEffect(() => {
    return window.desktopAgent.onSettingsOpenSection((section) => {
      setNav(section)
    })
  }, [])

  useEffect(() => {
    clearStatus()
  }, [nav, clearStatus])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <SettingsTitleBar />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SettingsSidebar active={nav} onChange={setNav} />

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <main
            className={cn(
              'min-h-0 flex-1',
              nav === 'chat'
                ? 'flex flex-col overflow-hidden px-4 py-3'
                : 'custom-scrollbar custom-scrollbar-y px-6 py-5 pb-24',
            )}
          >
            <div
              className={cn(
                nav === 'chat' && 'flex min-h-0 min-w-0 flex-1 flex-col',
              )}
            >
              <SettingsPanel
                nav={nav}
                config={config}
                apiKeys={apiKeys}
                onApiKeyChange={setApiKey}
                onConfigChange={setConfig}
              />
            </div>

            {nav !== 'chat' ? (
              <SettingsSaveBar
                status={status}
                loading={loading}
                visible={nav !== 'about' && nav !== 'history'}
                onSave={() => void save()}
              />
            ) : null}
          </main>
        </div>
      </div>
    </div>
  )
}
