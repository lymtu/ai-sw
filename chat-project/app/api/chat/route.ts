import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import {
  setConversationTitleIfDefault,
  upsertMessage,
} from "@/lib/db/conversations";
import { isMongoConfigured } from "@/lib/db/mongodb";
import type { ChatMessage } from "@/lib/chat-types";
import { textFromChatMessage } from "@/lib/chat-types";
import { createChatModel } from "@/lib/llm/langchain-model";

export const runtime = "nodejs";

function toLangChainMessages(msgs: ChatMessage[]): BaseMessage[] {
  const out: BaseMessage[] = [];
  for (const m of msgs) {
    const text = textFromChatMessage(m);
    if (m.role === "user") out.push(new HumanMessage(text));
    else if (m.role === "assistant") out.push(new AIMessage(text));
    else if (m.role === "system") out.push(new SystemMessage(text));
  }
  return out;
}

function chunkText(chunk: { content: unknown }): string {
  const c = chunk.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    let s = "";
    for (const p of c) {
      if (
        p &&
        typeof p === "object" &&
        "type" in p &&
        (p as { type: string }).type === "text" &&
        "text" in p
      ) {
        s += String((p as { text: string }).text);
      }
    }
    return s;
  }
  return "";
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "未配置 OPENAI_API_KEY" }, { status: 503 });
  }
  if (!isMongoConfigured()) {
    return Response.json({ error: "未配置 MONGODB_URI" }, { status: 503 });
  }

  let body: {
    messages?: ChatMessage[];
    conversationId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "无效请求体" }, { status: 400 });
  }

  const { conversationId, messages } = body;
  if (!conversationId || !messages?.length) {
    return Response.json(
      { error: "缺少 conversationId 或 messages" },
      { status: 400 },
    );
  }

  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return Response.json({ error: "最后一条须为用户消息" }, { status: 400 });
  }

  try {
    await upsertMessage(conversationId, last);
    await setConversationTitleIfDefault(conversationId, textFromChatMessage(last));
  } catch (e) {
    console.error(e);
    return Response.json({ error: "无法写入消息" }, { status: 500 });
  }

  const assistantId = crypto.randomUUID();
  const model = createChatModel();
  const lcMessages = toLangChainMessages(messages);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullText = "";
      let streamError: unknown;
      try {
        const streamIter = await model.stream(lcMessages, { signal: req.signal });
        for await (const chunk of streamIter) {
          const piece = chunkText(chunk);
          if (piece) {
            fullText += piece;
            controller.enqueue(encoder.encode(piece));
          }
        }
      } catch (e) {
        streamError = e;
      } finally {
        try {
          if (fullText.length > 0) {
            await upsertMessage(conversationId, {
              id: assistantId,
              role: "assistant",
              parts: [{ type: "text", text: fullText }],
            });
          }
        } catch (e) {
          console.error("persist assistant message failed", e);
        }
      }
      const err = streamError as Error | undefined;
      if (err) {
        if (err.name === "AbortError") {
          controller.close();
        } else {
          console.error(err);
          controller.error(err);
        }
      } else {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Assistant-Message-Id": assistantId,
    },
  });
}
