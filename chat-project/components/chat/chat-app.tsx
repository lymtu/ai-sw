"use client";

import type { ChatMessage } from "@/lib/chat-types";
import {
  MessageSquarePlusIcon,
  MoreHorizontalIcon,
  PanelLeftIcon,
  SparklesIcon,
  TrashIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Conv = { id: string; title: string; updatedAt: string };

export function ChatApp() {
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);

  const refreshList = useCallback(async () => {
    setListError(null);
    const res = await fetch("/api/conversations");
    const data = (await res.json()) as {
      conversations?: Conv[];
      error?: string;
    };
    if (!res.ok) {
      setListError(data.error ?? "无法加载会话列表");
      return;
    }
    setConversations(data.conversations ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      setListLoading(true);
      await refreshList();
      setListLoading(false);
    })();
  }, [refreshList]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    void (async () => {
      setMessagesLoading(true);
      const res = await fetch(`/api/conversations/${selectedId}/messages`);
      const data = (await res.json()) as {
        messages?: ChatMessage[];
        error?: string;
      };
      if (!cancelled) {
        if (!res.ok) {
          setMessages([]);
        } else {
          setMessages(data.messages ?? []);
        }
        setMessagesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function handleNewChat() {
    const res = await fetch("/api/conversations", { method: "POST" });
    const data = (await res.json()) as { id?: string; error?: string };
    if (!res.ok || !data.id) {
      setListError(data.error ?? "创建失败");
      return;
    }
    await refreshList();
    setSelectedId(data.id);
    setMobileOpen(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    if (selectedId === id) {
      setSelectedId(null);
      setMessages([]);
    }
    await refreshList();
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-1">
      <Button
        className="h-10 w-full justify-start gap-2 rounded-xl font-medium shadow-sm"
        onClick={() => void handleNewChat()}
      >
        <MessageSquarePlusIcon className="size-4 opacity-90" />
        新建会话
      </Button>
      <p className="px-1 pt-4 pb-1 font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
        历史
      </p>
      <ScrollArea className="min-h-0 flex-1 pr-1">
        <div className="flex flex-col gap-0.5">
          {listLoading ? (
            <div className="flex flex-col gap-2 pt-1">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-6 text-center text-muted-foreground text-xs leading-relaxed">
              暂无会话，点击上方开始
            </p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "group flex items-center gap-0.5 rounded-xl transition-colors",
                  selectedId === c.id
                    ? "bg-foreground/[0.06] ring-1 ring-border/80"
                    : "hover:bg-muted/80",
                )}
              >
                <Button
                  variant="ghost"
                  className="h-10 min-w-0 flex-1 justify-start rounded-xl px-3 font-normal text-[13px]"
                  onClick={() => {
                    setSelectedId(c.id);
                    setMobileOpen(false);
                  }}
                >
                  <span className="truncate">{c.title}</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-xs" }),
                      "mr-0.5 shrink-0 opacity-60 hover:opacity-100",
                    )}
                  >
                    <MoreHorizontalIcon className="size-4" />
                    <span className="sr-only">操作</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => void handleDelete(c.id)}
                    >
                      <TrashIcon data-icon="inline-start" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex h-dvh w-full overflow-hidden flex-col bg-muted/25 md:flex-row">
      <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-border/60 border-b bg-card/90 px-3 py-2.5 backdrop-blur-md md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "size-9 rounded-lg",
            )}
          >
            <PanelLeftIcon className="size-4" />
            <span className="sr-only">打开侧栏</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(100%,18rem)] gap-0 p-0">
            <SheetHeader className="border-border/60 border-b px-4 py-4 text-left">
              <SheetTitle className="flex items-center gap-2 font-semibold text-base">
                <SparklesIcon className="size-4 text-foreground/80" />
                Studio
              </SheetTitle>
            </SheetHeader>
            <div className="p-3">{sidebar}</div>
          </SheetContent>
        </Sheet>
        <span className="font-medium text-foreground text-sm tracking-tight">
          Studio
        </span>
      </header>

      <aside className="sticky top-0 hidden h-dvh w-[272px] shrink-0 flex-col overflow-hidden border-border/60 border-r bg-card/90 backdrop-blur-md md:flex">
        <div className="flex flex-col gap-1 border-border/50 border-b px-4 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background">
              <SparklesIcon className="size-[18px]" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-semibold text-foreground text-sm tracking-tight">
                Studio
              </span>
              <span className="text-[11px] text-muted-foreground">
                AI 对话
              </span>
            </div>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col p-3">{sidebar}</div>
      </aside>

      <main className="chat-studio-bg relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {listError && (
          <div className="shrink-0 p-3 md:p-4">
            <Alert
              variant="destructive"
              className="mx-auto max-w-[44rem] border-destructive/30"
            >
              <AlertTitle>配置或服务异常</AlertTitle>
              <AlertDescription>{listError}</AlertDescription>
            </Alert>
          </div>
        )}

        {!selectedId && (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
            <div className="flex max-w-lg flex-col items-center gap-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-foreground/[0.06] ring-1 ring-border/80">
                <SparklesIcon className="size-8 text-foreground/70" />
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="font-semibold text-2xl text-foreground tracking-tight md:text-3xl">
                  从这里开始构建对话
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed md:text-[15px]">
                  选一个历史会话，或新建会话。界面参考了现代 AI 产品常见的留白与输入体验。
                </p>
              </div>
              <Button
                size="lg"
                className="h-11 rounded-xl px-8 font-medium"
                onClick={() => void handleNewChat()}
              >
                <MessageSquarePlusIcon className="size-4" />
                新建会话
              </Button>
            </div>
          </div>
        )}

        {selectedId && messagesLoading && (
          <div className="flex flex-1 flex-col gap-4 px-6 py-12">
            <Skeleton className="mx-auto h-12 max-w-2xl rounded-2xl" />
            <Skeleton className="mx-auto h-32 max-w-2xl rounded-2xl" />
            <Skeleton className="ml-auto h-11 w-2/3 max-w-md rounded-2xl" />
          </div>
        )}

        {selectedId && !messagesLoading && (
          <ChatPanel
            key={selectedId}
            conversationId={selectedId}
            initialMessages={messages}
            onFinished={() => void refreshList()}
          />
        )}
      </main>
    </div>
  );
}
