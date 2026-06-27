import type { AIMessageChunk, ToolMessage } from "@langchain/core/messages";
import type { IterableReadableStreamInterface } from "@langchain/core/utils/stream";

// 定义 metadata 的类型
interface StreamMetadata {
  tags: string[];
  name: string | undefined;
  ls_integration: string;
  lc_agent_name: string;
  thread_id: string;
  langgraph_step: number;
  langgraph_node: string;
  langgraph_triggers: string[];
  langgraph_path: string[];
  langgraph_checkpoint_ns: string;
  checkpoint_ns: string;
  ls_provider: string;
  ls_model_name: string;
  ls_model_type: string;
  ls_temperature: number | undefined;
  ls_max_tokens: number | undefined;
  ls_stop: string | undefined;
  versions: Record<string, string>;
}

// 每个 chunk 的类型
type MessagesStreamChunk = [AIMessageChunk | ToolMessage, StreamMetadata];

type MessagesStream = IterableReadableStreamInterface<MessagesStreamChunk>;

export type { StreamMetadata, MessagesStreamChunk, MessagesStream };
