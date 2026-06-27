/**
 * 仅在 Electron 二进制未就绪时运行 install.js，避免每次 npm install 都触碰 dist。
 * 检测逻辑与 node_modules/electron/install.js 的 isInstalled() 一致。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const electronDir = join(root, 'node_modules', 'electron')
const installScript = join(electronDir, 'install.js')

function getPlatformPath() {
  const platform =
    process.env.ELECTRON_INSTALL_PLATFORM ||
    process.env.npm_config_platform ||
    process.platform

  switch (platform) {
    case 'mas':
    case 'darwin':
      return 'Electron.app/Contents/MacOS/Electron'
    case 'freebsd':
    case 'openbsd':
    case 'linux':
      return 'electron'
    case 'win32':
      return 'electron.exe'
    default:
      throw new Error(`Electron builds are not available on platform: ${platform}`)
  }
}

function isElectronDistReady() {
  if (!existsSync(installScript)) {
    console.warn('[electron-postinstall] electron package not found, skipping')
    return true
  }

  let version
  try {
    version = JSON.parse(readFileSync(join(electronDir, 'package.json'), 'utf8')).version
    const distVersion = readFileSync(join(electronDir, 'dist', 'version'), 'utf8').replace(/^v/, '')
    if (distVersion !== version) return false

    const platformPath = getPlatformPath()
    const pathTxt = readFileSync(join(electronDir, 'path.txt'), 'utf8')
    if (pathTxt !== platformPath) return false

    const electronPath =
      process.env.ELECTRON_OVERRIDE_DIST_PATH ||
      join(electronDir, 'dist', platformPath)
    return existsSync(electronPath)
  } catch {
    return false
  }
}

if (isElectronDistReady()) {
  console.log('[electron-postinstall] dist already present, skip install.js')
  process.exit(0)
}

console.log('[electron-postinstall] dist missing or incomplete, running install.js …')
const result = spawnSync(process.execPath, [installScript], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

process.exit(result.status ?? 1)
