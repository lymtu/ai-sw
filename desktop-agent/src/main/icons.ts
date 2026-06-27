import { app, nativeImage } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'

/** 开发：out/main → 项目根；打包：process.resourcesPath/resources */
function resourcesRoot(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'resources')
  }
  return join(__dirname, '../../resources')
}

function firstExisting(...paths: string[]): string | undefined {
  return paths.find((p) => existsSync(p))
}

export function getAppIconPath(): string | undefined {
  if (process.platform === 'win32') {
    return firstExisting(
      join(resourcesRoot(), 'icon.ico'),
      join(resourcesRoot(), 'icon.png'),
    )
  }
  return firstExisting(
    join(resourcesRoot(), 'icon.png'),
    join(resourcesRoot(), 'icons', 'tray-32.png'),
  )
}

export function getAppIcon() {
  const path = getAppIconPath()
  if (!path) return undefined
  const img = nativeImage.createFromPath(path)
  return img.isEmpty() ? undefined : img
}

export function getTrayIcon() {
  const iconsDir = join(resourcesRoot(), 'icons')
  const tray16 = join(iconsDir, 'tray-16.png')
  const tray32 = join(iconsDir, 'tray-32.png')

  const path =
    firstExisting(tray16, tray32, join(resourcesRoot(), 'icon.png')) ??
    tray16

  if (!existsSync(path)) {
    console.warn('[icons] Tray PNG not found. Run: node scripts/generate-icons.mjs')
    return nativeImage.createEmpty()
  }

  let image = nativeImage.createFromPath(path)
  if (image.isEmpty()) {
    console.warn('[icons] Failed to load tray icon:', path)
    return nativeImage.createEmpty()
  }

  if (process.platform === 'darwin') {
    image = image.resize({ width: 16, height: 16 })
    image.setTemplateImage(true)
  } else if (process.platform === 'win32') {
    const size = image.getSize()
    if (size.width > 16 || size.height > 16) {
      image = image.resize({ width: 16, height: 16 })
    }
  }

  return image
}
