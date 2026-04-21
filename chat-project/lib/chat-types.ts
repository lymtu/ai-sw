export type ChatTextPart = { type: "text"; text: string };

/** 与 MongoDB 中存储结构一致，替代原 ai 包的 UIMessage */
export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: ChatTextPart[];
};

export function textFromChatMessage(m: ChatMessage): string {
  return m.parts
    .filter((p): p is ChatTextPart => p.type === "text")
    .map((p) => p.text)
    .join("");
}
