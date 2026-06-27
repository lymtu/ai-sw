import type { LocalWhisperLanguage, PublicConfig } from '../../shared/types'
import { isEnglishOnlyWhisperModel } from '../../shared/whisper-local'
import { Dropdown } from '@renderer/shared/Dropdown'
import { Field, inputClass } from './settings-form'
import { WhisperCachePanel } from './WhisperCachePanel'

type Props = {
  config: PublicConfig
  onConfigChange: (updater: (c: PublicConfig) => PublicConfig) => void
}

const PRESET_WHISPER_TINY = 'Xenova/whisper-tiny'
const PRESET_WHISPER_SMALL = 'Xenova/whisper-small'

function localModelPresetValue(modelId: string): string {
  if (modelId === PRESET_WHISPER_TINY) return PRESET_WHISPER_TINY
  if (modelId === PRESET_WHISPER_SMALL) return PRESET_WHISPER_SMALL
  return 'custom'
}

export function SttPanel({ config, onConfigChange }: Props) {
  const englishOnlyModel = isEnglishOnlyWhisperModel(config.localWhisperModel)
  const localModelPreset = localModelPresetValue(config.localWhisperModel)
  const isCustomLocalModel = localModelPreset === 'custom'

  return (
    <section className="flex max-w-lg flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">语音转写</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          按住说话后，将录音转为文字再发送给对话模型
        </p>
      </div>

      <Dropdown
        label="转写方式"
        hint="无 API 时选本地 Whisper；有兼容接口时可选云端"
        value={config.sttMode}
        onChange={(sttMode) =>
          onConfigChange((c) => ({
            ...c,
            sttMode: sttMode as 'local' | 'api',
          }))
        }
        options={[
          {
            value: 'local',
            label: '本地 Whisper',
            description: '无需 API，首次会下载模型',
          },
          {
            value: 'api',
            label: '云端 API',
            description: '使用当前供应商 Key',
          },
        ]}
      />

      {config.sttMode === 'local' ? (
        <>
          {englishOnlyModel ? (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
              当前模型为纯英文版（.en），中文会被识别成英文。请改为{' '}
              <strong>Xenova/whisper-small</strong> 等多语言模型。
            </p>
          ) : null}
          <Dropdown
            label="识别语言"
            hint="本地库不会自动猜语言，未指定时会默认按英文识别"
            value={config.localWhisperLanguage ?? 'chinese'}
            onChange={(localWhisperLanguage) =>
              onConfigChange((c) => ({
                ...c,
                localWhisperLanguage:
                  localWhisperLanguage as LocalWhisperLanguage,
              }))
            }
            options={[
              { value: 'chinese', label: '中文', description: '推荐' },
              { value: 'english', label: '英文' },
            ]}
          />
          <Dropdown
            label="本地模型"
            hint="small 中文更准、体积更大；勿选 .en 结尾的纯英文模型"
            value={localModelPreset}
            onChange={(value) => {
              if (value === 'custom') {
                onConfigChange((c) => {
                  if (localModelPresetValue(c.localWhisperModel) === 'custom') {
                    return c
                  }
                  return { ...c, localWhisperModel: '' }
                })
                return
              }
              onConfigChange((c) => ({ ...c, localWhisperModel: value }))
            }}
            options={[
              {
                value: PRESET_WHISPER_SMALL,
                label: 'whisper-small',
                description: '推荐，约 150MB，中文更准',
              },
              {
                value: PRESET_WHISPER_TINY,
                label: 'whisper-tiny',
                description: '更快，约 40MB，准确度一般',
              },
              { value: 'custom', label: '自定义', description: '自行填写模型 ID' },
            ]}
          />
          {isCustomLocalModel ? (
            <Field
              label="模型 ID"
              hint="Hugging Face 上的 Xenova/whisper-* 多语言模型（勿用 .en 纯英文版）"
            >
              <input
                className={inputClass}
                value={config.localWhisperModel}
                placeholder="例如 Xenova/whisper-base"
                onChange={(e) =>
                  onConfigChange((c) => ({
                    ...c,
                    localWhisperModel: e.target.value,
                  }))
                }
              />
            </Field>
          ) : null}
          <WhisperCachePanel activeModelId={config.localWhisperModel} />
        </>
      ) : (
        <Field
          label="云端 Whisper 模型名"
          hint="如 whisper-1，需 API 支持 /audio/transcriptions"
        >
          <input
            className={inputClass}
            value={config.whisperModel}
            onChange={(e) =>
              onConfigChange((c) => ({ ...c, whisperModel: e.target.value }))
            }
          />
        </Field>
      )}
    </section>
  )
}
