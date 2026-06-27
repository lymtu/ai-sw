# Desktop Agent

Electron + React 桌面端 AI 助手：托盘常驻、全局快捷键、悬浮输入框、按住说话（语音转文字后自动对话）。

## 功能

- 启动后默认仅托盘图标，无主窗口
- 托盘左键：打开设置
- 托盘右键：显示输入框 / 打开设置 / 退出
- `Ctrl+Shift+Space`：显示/隐藏悬浮输入框（可在设置中修改）
- `Ctrl+Shift+V`：语音快捷键（按一次开始录音，再按一次结束并发送）
- 本地保存 OpenAI 兼容 API 配置（API Key 加密存储于主进程）
- 流式对话回复
- **本地语音转文字**：`@huggingface/transformers` + Whisper（默认，无需 Whisper API）

## 悬浮窗布局：难点与方案

悬浮球 + 输入条/对话区要在**拖动、贴边、左/右展开、收起**时保持球在屏幕上的位置稳定，且输入条不被窗口裁切。实现上踩过几类坑，最终方案如下。

### 难点

| 问题 | 原因 |
|------|------|
| 切换状态时球「跳一下」 | 频繁 `setBounds` 改宽高，或展开方向变化时顺带改窗口 `x` |
| 左展开输入条被裁切 | 固定 640px 窗宽时，面板用负 margin 拉到球左侧，大半在窗外观不到 |
| 左展开后又去「加宽窗口」 | 动态加宽 + 补偿 `x`，球在屏幕上仍可能被带动 |
| 收起后球突然左移 | 收起态把球簇 `left` 设为 0，展开态在 `panelW + gap`，同一透明大窗内坐标不一致 |
| Grid 五列 + 负 margin | 难推理、难维护，左右与 6px 间距容易算错 |

### 方案要点（当前实现）

1. **大透明窗口、常态不 resize**（见 `resolve.md` 方案一）：创建后宽高固定；输入/对话/收起只在窗内切 CSS，避免状态切换时改窗口尺寸。
2. **展开态窗宽一次算死**：`左面板 + 间距 + 球簇 + 间距 + 右面板` + shell 水平 padding（`overlayExpandedCanvasWidth()`），切换左/右展开**只改面板 `left`，不改窗宽、不挪球**。
3. **展开态窗高一次算死**：工作区高度的 **50%**（`overlayCanvasHeight(workAreaHeight)`），创建后**不再 resize**，避免切换/流式抖动。
4. **顶留白**：`overlayExpandedTopReserve()` = 半个环形菜单外框高；球与输入行在留白下方，对话 `top:0` 自工具行顶向下长，超出部分在半屏内滚动。
5. **工具行内绝对定位**：球簇 `left` 固定为 `panelContentWidth + panelGap`；间距按 **48px 球缘**算（`OVERLAY_LAYOUT.panelGap`）。
6. **透明区**：`pointer-events: none`，仅 `.overlay-hit-target` 可点；大半屏透明主要是占位，不挡鼠标。

相关代码：`src/shared/overlay-layout.ts`、`src/renderer/overlay/OverlayApp.tsx`、`src/main/overlay-bounds.ts`。

## 图标资源

SVG 位于 `resources/icons/`：

| 文件 | 用途 |
|------|------|
| `app-icon.svg` | 应用主图标（64×64） |
| `tray-icon.svg` | 系统托盘（16×16） |
| `microphone.svg` | 麦克风默认 |
| `microphone-recording.svg` | 录音中（带动画） |
| `microphone-transcribing.svg` | 转写中（波形动画） |
| `send.svg` / `settings.svg` / `hide.svg` | 发送、设置、关闭 |

界面内使用 React 组件：`src/renderer/shared/icons/Icon.tsx`（`currentColor` 随主题变色）。

**Windows 托盘 / 任务栏** 需 PNG/ICO（不支持 SVG）。首次克隆或图标缺失时执行：

```bash
yarn icons
```

会生成 `resources/icons/tray-16.png`、`resources/icon.ico` 等，然后重启 `yarn dev`。

## 环境要求

- Node.js 20+
- Windows 10/11（首版优先；macOS 托盘/快捷键行为可能略有差异）
- 麦克风权限（语音功能）

## 安装与运行

```bash
cd desktop-agent
yarn install
yarn dev
```

## 配置说明

在设置页填写：

| 字段 | 说明 |
|------|------|
| API Key | OpenAI 或兼容服务密钥 |
| Base URL | 如 `https://api.openai.com/v1` 或 DashScope `.../compatible-mode/v1` |
| 对话模型 | 如 `gpt-4o-mini`、`qwen-plus` |
| 语音转写（独立页） | **本地**（默认）或 **云端 API**；识别语言建议「中文」；模型默认 `whisper-small` |
| 系统提示词 | 可选 |
| 快捷键 | Electron 格式，如 `CommandOrControl+Shift+Space` |

### 通义 Qwen 示例

- Base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- API Key: 百炼 DashScope Key
- 对话模型: `qwen-plus`

## 打包

```bash
yarn build
yarn dist
```

安装包输出在 `release/` 目录。

## 安全说明

- API Key 仅保存在主进程，使用系统 `safeStorage` 加密（不可用时回退 base64）
- 渲染进程通过 `contextBridge` 调用 IPC，无法直接读取密钥
- 所有 `fetch` 请求在主进程执行

## 语音转写说明

默认使用 [**Transformers.js**](https://huggingface.co/docs/transformers.js) 在本地运行 Whisper：

1. 录音结束 → 浏览器解码为 16kHz 音频
2. 本地模型转文字（不消耗 Whisper API 额度）
3. 文字自动发给对话模型（仍需配置对话用 API Key）

可在设置里切换为「云端 API」，走原来的 OpenAI 兼容 `/audio/transcriptions`。

## 快捷键限制

Electron 的 `globalShortcut` **不支持 keyup**，因此「按住说话」在 MVP 中实现为：**按一次开始录音，再按一次结束**。如需真正的按住/松开，可后续接入 `uiohook-napi`。
