export type SttMode = 'local' | 'api'
export type ThemeMode = 'light' | 'dark' | 'system'

export type SettingsSection =
  | 'general'
  | 'history'
  | 'chat'
  | 'providers'
  | 'stt'
  | 'prompt'
  | 'shortcuts'
  | 'about'
/** 本地 Whisper 识别语言（库内无真实 auto，旧配置 auto 会迁移为 chinese） */
export type LocalWhisperLanguage = 'auto' | 'chinese' | 'english'

export interface ProviderModel {
  id: string
  name: string
  model: string
}

export interface Provider {
  id: string
  name: string
  baseUrl: string
  models: ProviderModel[]
}

export interface AppConfig {
  providers: Provider[]
  activeProviderId: string
  activeModelId: string
  whisperModel: string
  /** local: @huggingface/transformers Whisper；api: OpenAI 兼容 /audio/transcriptions */
  sttMode: SttMode
  /** Hugging Face 模型 ID，如 Xenova/whisper-small（支持中文） */
  localWhisperModel: string
  /** 本地 Whisper 源语言，指定为中文可显著提高中文准确率 */
  localWhisperLanguage: LocalWhisperLanguage
  systemPrompt: string
  hotkeyToggleOverlay: string
  hotkeyPushToTalk: string
  /** 悬浮窗显示时：切换文字 / 语音输入 */
  hotkeyToggleInputMode: string
  launchAtLogin: boolean
  opaqueOverlay: boolean
  theme: ThemeMode
}

export interface PublicProvider extends Provider {
  apiKeySet: boolean
}

export interface PublicConfig extends AppConfig {
  providers: PublicProvider[]
}

export interface TestConnectionInput {
  providerId: string
  baseUrl?: string
  apiKey?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type { ChatStreamChunk } from './chat-stream'

/** Overlay 窗口外框（拖动时需固定 width/height，避免 Windows 上 setPosition 改尺寸） */
export interface OverlayWindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export const DEFAULT_PROVIDERS: Provider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', model: 'gpt-4o-mini' },
      { id: 'gpt-4o', name: 'GPT-4o', model: 'gpt-4o' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', model: 'deepseek-chat' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', model: 'deepseek-reasoner' },
    ],
  },
  {
    id: 'dashscope',
    name: '阿里云百炼',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-turbo', name: '通义千问 Turbo', model: 'qwen-turbo' },
      { id: 'qwen-plus', name: '通义千问 Plus', model: 'qwen-plus' },
    ],
  },
]

const firstProvider = DEFAULT_PROVIDERS[0]!
const firstModel = firstProvider.models[0]!

export const DEFAULT_CONFIG: AppConfig = {
  providers: DEFAULT_PROVIDERS,
  activeProviderId: firstProvider.id,
  activeModelId: firstModel.id,
  whisperModel: 'whisper-1',
  sttMode: 'local',
  localWhisperModel: 'Xenova/whisper-small',
  localWhisperLanguage: 'chinese',
  systemPrompt:
    'You are a helpful desktop assistant. Reply concisely in the user language.',
  hotkeyToggleOverlay: 'CommandOrControl+Shift+Space',
  hotkeyPushToTalk: 'CommandOrControl+Shift+V',
  hotkeyToggleInputMode: 'CommandOrControl+Shift+M',
  launchAtLogin: false,
  opaqueOverlay: false,
  theme: 'light',
}

export const IPC = {
  configGet: 'config:get',
  configSave: 'config:save',
  configTest: 'config:test',
  chatSend: 'chat:send',
  chatCancel: 'chat:cancel',
  sttTranscribe: 'stt:transcribe',
  overlayToggle: 'overlay:toggle',
  overlayShow: 'overlay:show',
  overlayHide: 'overlay:hide',
  overlayShowSettings: 'overlay:show-settings',
  /** 主进程 → 设置窗口：打开指定侧栏页 */
  settingsOpenSection: 'settings:open-section',
  overlayGetPosition: 'overlay:get-position',
  overlaySetPosition: 'overlay:set-position',
  overlayMove: 'overlay:move',
  overlayDragStart: 'overlay:drag-start',
  overlayDragEnd: 'overlay:drag-end',
  overlayResize: 'overlay:resize',
  overlayGetCanvasSize: 'overlay:get-canvas-size',
  overlaySetIgnoreMouseEvents: 'overlay:set-ignore-mouse-events',
  overlayGetDisplayLimits: 'overlay:get-display-limits',
  chatStream: 'chat:stream',
  windowMinimize: 'window:minimize',
  windowClose: 'window:close',
  shortcutsSuspend: 'shortcuts:suspend',
  shortcutsResume: 'shortcuts:resume',
  sttClearCache: 'stt:clear-cache',
  sttCacheCleared: 'stt:cache-cleared',
  /** payload: { modelId?: string } — 删除的模型；省略表示全部清空 */
  sttNotifyCacheChanged: 'stt:notify-cache-changed',
  /** 主进程 → Overlay：配置保存后同步 */
  configUpdated: 'config:updated',
  /** 主进程 → Overlay：窗口即将隐藏 */
  overlayHidden: 'overlay:hidden',
  chatHistoryList: 'chat-history:list',
  chatHistoryGet: 'chat-history:get',
  chatHistorySave: 'chat-history:save',
  chatHistoryDelete: 'chat-history:delete',
  chatHistoryClear: 'chat-history:clear',
  /** 主进程 → Overlay：会话列表变更（设置页清空/删除等） */
  chatHistoryChanged: 'chat-history:changed',
} as const
