<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## chat-project 约定

- **密钥与数据库**：`OPENAI_API_KEY`、`MONGODB_URI` 仅放在服务端环境变量（如 `.env.local`），勿提交仓库；勿在客户端读写。
- **持久化**：会话与消息经 `lib/db` 写入 MongoDB；前端不将业务数据存 IndexedDB/localStorage。
- **UI**：优先使用 shadcn 生成的 `components/ui/*`，与 `app/globals.css` 主题变量一致。
- **AI 路由**：流式对话入口为 `app/api/chat/route.ts`（LangChain `ChatOpenAI`，环境变量见 `lib/llm/langchain-model.ts`）；会话 CRUD 在 `app/api/conversations/`。通义 Qwen 使用 DashScope 兼容地址（如 `https://dashscope.aliyuncs.com/compatible-mode/v1`）+ 百炼 API Key + `OPENAI_MODEL=qwen-plus`（或其它 Qwen 模型名）。
