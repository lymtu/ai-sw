import { ChatOpenAI } from "@langchain/openai";

/**
 * 通过环境变量配置 OpenAI 兼容接口（含阿里云 DashScope / Qwen）。
 *
 * Qwen（通义）：`OPENAI_BASE_URL` 设为 DashScope 兼容地址，例如：
 * - 中国内地：`https://dashscope.aliyuncs.com/compatible-mode/v1`
 * - 国际：`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
 * `OPENAI_API_KEY` 使用百炼控制台申请的 DashScope API Key。
 */
export function createChatModel() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  const defaultModel =
    baseURL?.includes("dashscope") ? "qwen-plus" : "gpt-4o-mini";
  const model = process.env.OPENAI_MODEL?.trim() ?? defaultModel;
  const timeout = Number(process.env.OPENAI_TIMEOUT_MS ?? 120_000);
  const maxRetries = Number(process.env.OPENAI_MAX_RETRIES ?? 0);
  const temperature = Number(process.env.OPENAI_TEMPERATURE ?? 0.7);

  return new ChatOpenAI({
    model,
    apiKey,
    temperature,
    timeout,
    maxRetries,
    configuration: baseURL ? { baseURL } : undefined,
  });
}
