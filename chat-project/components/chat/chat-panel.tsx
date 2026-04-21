"use client";

import { ArrowUpIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage } from "@/lib/chat-types";
import { textFromChatMessage } from "@/lib/chat-types";
import { cn } from "@/lib/utils";

type Props = {
  conversationId: string;
  initialMessages: ChatMessage[];
  onFinished?: () => void;
};

export function ChatPanel({
  conversationId,
  initialMessages,
  onFinished,
}: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: trimmed }],
    };
    const snapshot = messages;
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    setError(null);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: nextMessages,
        }),
        signal: ac.signal,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setMessages(snapshot);
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const assistantId =
        res.headers.get("X-Assistant-Message-Id") ?? crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          parts: [{ type: "text", text: "" }],
        },
      ]);

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("响应体为空");
      }

      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          const idx = copy.findIndex((m) => m.id === assistantId);
          if (idx === -1) return prev;
          copy[idx] = {
            ...copy[idx],
            parts: [{ type: "text", text: acc }],
          };
          return copy;
        });
      }

      onFinished?.();
    } catch (e) {
      const err = e as Error;
      if (err.name === "AbortError") {
        onFinished?.();
        return;
      }
      setError(err.message);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-[44rem] flex-col gap-8 px-4 py-10 md:px-6 md:py-12">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="font-medium text-foreground/90 text-lg tracking-tight md:text-xl">
                有什么可以帮你的？
              </p>
              <p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
                在下方输入问题，支持 Markdown 与代码展示。
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex w-full animate-in fade-in-0 slide-in-from-bottom-1 duration-200",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {m.role === "user" ? (
                <div className="max-w-[min(92%,36rem)] rounded-[1.15rem] rounded-br-md bg-foreground px-4 py-3 text-[15px] text-background leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                  <p className="whitespace-pre-wrap">{textFromChatMessage(m)}</p>
                </div>
              ) : (
                <div className="max-w-[min(100%,42rem)] rounded-2xl border border-border/60 bg-card/70 px-5 py-4 text-card-foreground shadow-[0_1px_0_rgba(0,0,0,0.03)] backdrop-blur-[2px]">
                  <MarkdownContent content={textFromChatMessage(m)} />
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} className="h-px w-full shrink-0" aria-hidden />
        </div>
      </ScrollArea>

      {error && (
        <div className="shrink-0 border-border/60 border-t bg-background/90 px-4 py-3 backdrop-blur-sm">
          <Alert variant="destructive" className="mx-auto max-w-[44rem]">
            <AlertTitle>请求失败</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={() => setError(null)}>
                关闭
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="sticky bottom-0 z-20 shrink-0 border-border/50 border-t bg-background/85 backdrop-blur-md">
        <form
          className="mx-auto w-full max-w-[44rem] px-4 py-4 md:px-6 md:py-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(input);
          }}
        >
          <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card p-2 shadow-[0_4px_24px_-6px_rgba(15,23,42,0.12)]">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="尽管问…"
              rows={2}
              className="min-h-[52px] resize-none border-0 bg-transparent px-3 py-2 text-[15px] shadow-none focus-visible:ring-0"
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit(input);
                }
              }}
            />
            <div className="flex items-center justify-end gap-2 px-1 pb-1">
              {busy && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => abortRef.current?.abort()}
                >
                  停止
                </Button>
              )}
              <Button
                type="submit"
                size="icon"
                className="size-9 shrink-0 rounded-xl"
                disabled={busy || !input.trim()}
                aria-label="发送"
              >
                {busy ? <Spinner /> : <ArrowUpIcon className="size-4" />}
              </Button>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Enter 发送 · Shift+Enter 换行
          </p>
        </form>
      </div>
    </div>
  );
}
