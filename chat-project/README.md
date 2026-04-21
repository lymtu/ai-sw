# AI 对话（chat-project）

Next.js 16 + React 19 + Tailwind 4 + [shadcn/ui](https://ui.shadcn.com/) 的 AI 聊天应用：服务端使用 **LangChain**（`@langchain/openai`）流式调用 OpenAI **兼容**接口，**会话与消息持久化在 MongoDB**（连接串仅服务端使用）。

## 功能

- 流式回复（LangChain `ChatOpenAI` + 纯文本流）
- 多会话：新建 / 切换 / 删除
- 助手消息 Markdown 渲染（`react-markdown` + GFM）
- 无需登录；数据存于自建 MongoDB

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写：

| 变量 | 说明 |
|------|------|
| `MONGODB_URI` | MongoDB 连接 URI（必填） |
| `MONGODB_DB` | 数据库名，默认 `chat_app` |
| `OPENAI_API_KEY` | 兼容服务的 API Key（必填） |
| `OPENAI_BASE_URL` | **无法访问 OpenAI 官方时必填**，指向可访问的兼容端（见下） |
| `OPENAI_MODEL` | 模型名，需与提供商一致 |
| `OPENAI_TIMEOUT_MS` | 请求超时（毫秒），默认 `120000` |
| `OPENAI_MAX_RETRIES` | LangChain 重试次数，默认 `0`（避免长时间重试） |
| `OPENAI_TEMPERATURE` | 采样温度，默认 `0.7` |

### 通义 Qwen（`qwen-plus`）

使用阿里云百炼 [DashScope OpenAI 兼容接口](https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope)：

| 区域 | `OPENAI_BASE_URL` |
|------|---------------------|
| 中国内地（北京） | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| 国际（新加坡等） | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` |

- `OPENAI_API_KEY`：在百炼控制台创建 **DashScope API Key**（与 OpenAI 官方 Key 不同）。
- `OPENAI_MODEL`：`qwen-plus`（或文档中的其它 Qwen 模型名）。

未设置 `OPENAI_MODEL` 且 `OPENAI_BASE_URL` 包含 `dashscope` 时，服务端默认使用 `qwen-plus`。

### 其它兼容服务

若出现连接 `api.openai.com` 超时，可改用 DeepSeek、OpenRouter 等兼容 `/v1/chat/completions` 的地址与对应模型名。

## 本地运行

1. 启动可访问的 MongoDB 实例。
2. 配置 `.env.local`（务必检查 `OPENAI_BASE_URL`）。
3. 安装依赖并启动开发服务：

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 生产构建

```bash
npm run build
npm start
```

## API 说明（服务端）

- `GET/POST /api/conversations` — 列表 / 新建会话
- `GET /api/conversations/[id]/messages` — 某会话消息
- `DELETE /api/conversations/[id]` — 删除会话及消息
- `POST /api/chat` — 流式文本（`text/plain`），响应头含 `X-Assistant-Message-Id`

## 技术栈

- [Next.js App Router](https://nextjs.org/docs)、[LangChain JS](https://js.langchain.com/)、[MongoDB Node 驱动](https://www.mongodb.com/docs/drivers/node/)
