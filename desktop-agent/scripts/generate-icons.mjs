/**
 * 从 SVG 生成托盘 PNG 与 Windows ICO（需 devDependencies: sharp, to-ico）
 * 运行: node scripts/generate-icons.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import toIco from 'to-ico'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = join(root, 'resources/icons/app-icon.svg')
const svg = readFileSync(svgPath)

const outDir = join(root, 'resources/icons')
mkdirSync(outDir, { recursive: true })

const tray16 = await sharp(svg).resize(16, 16).png().toBuffer()
const tray32 = await sharp(svg).resize(32, 32).png().toBuffer()
const app256 = await sharp(svg).resize(256, 256).png().toBuffer()
const app48 = await sharp(svg).resize(48, 48).png().toBuffer()

writeFileSync(join(outDir, 'tray-16.png'), tray16)
writeFileSync(join(outDir, 'tray-32.png'), tray32)
writeFileSync(join(root, 'resources/icon.png'), app256)
writeFileSync(join(root, 'resources/icon-48.png'), app48)

const ico = await toIco([tray16, app48, app256])
writeFileSync(join(root, 'resources/icon.ico'), ico)

console.log('Generated:')
console.log('  resources/icons/tray-16.png')
console.log('  resources/icons/tray-32.png')
console.log('  resources/icon.png')
console.log('  resources/icon.ico')
