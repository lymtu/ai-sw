import {
  ConfigProvider,
  carbonDarkTheme,
  carbonTheme,
} from '@agentscope-ai/design'
import zhCN from 'antd/locale/zh_CN'
import { cn } from '@renderer/shared/cn'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

function documentIsDark(): boolean {
  return document.documentElement.classList.contains('theme-dark')
}

/** AgentScope 组件依赖 design 的 ConfigProvider 注入样式与 prefixCls */
export function AgentscopeThemeProvider({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const [dark, setDark] = useState(documentIsDark)

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setDark(documentIsDark())
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const theme = useMemo(
    () => (dark ? carbonDarkTheme : carbonTheme),
    [dark],
  )

  return (
    <ConfigProvider {...theme} locale={zhCN}>
      <div
        className={cn(
          'spark flex min-h-0 flex-1 flex-col overflow-hidden',
          className,
        )}
      >
        {children}
      </div>
    </ConfigProvider>
  )
}
