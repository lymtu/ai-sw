import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

import { readFile } from "fs/promises";

import { getWeather } from "./agent-tools/index.ts";

import type { MessagesStream } from "./types/message.ts";
import type { ToolCallChunk, ToolMessage } from "@langchain/core/messages";
import getUserInput from "./tools/getUserInput.ts";

const model = new ChatOpenAI({
  model: "qwen-max",
  apiKey: "sk-3fc8694ab5e6472fa58d3a37924988b7",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
  n: 1, // 生成回答的数量
  modelKwargs: {
    enable_thinking: false, // 关闭深度思考
  },
});

const systemPrompt = await readFile("systemPrompt.md", "utf-8");

const agentName = {
  assistant: "AI助手",
} as const;

const agent = createAgent({
  model,
  name: agentName.assistant,
  tools: [getWeather],
  systemPrompt,
});

const stdoutToolInfo = (toolInfo: ToolCallChunk<string>) => {
  toolInfo.args = JSON.parse(toolInfo.args);
  console.log("Tool id: " + toolInfo.id);
  console.log(
    `${toolInfo?.name ?? "ToolName"}(${JSON.stringify(toolInfo?.args, null, 2)})`,
  );
  console.log("\r\n");
};

for (;;) {
  const input = await getUserInput("> ");
  if (input === null) {
    break;
  }

  process.stdout.write("ai > ");

  const stream = (await agent.stream(
    {
      messages: [{ role: "user", content: input }],
    },
    {
      streamMode: "messages",
    },
  )) as unknown as MessagesStream;

  const token = {
    input: 0,
    output: 0,
  };
  let toolsInfo: ToolCallChunk<string>[] = [];
  for await (const [message, metadata] of stream) {
    try {
      if (
        "tool_call_chunks" in message &&
        message?.tool_call_chunks.length > 0
      ) {
        if (toolsInfo.length === 0) {
          console.log("\r\nTools调用:");
        }
        message.tool_call_chunks.forEach((toolCall, idx) => {
          const index = toolCall?.index ?? idx;
          if (toolsInfo[index]) {
            toolsInfo[index].id += toolCall?.id ?? "";
            toolsInfo[index].name += toolCall?.name ?? "";
            toolsInfo[index].args += toolCall?.args ?? "";
            return;
          }

          toolsInfo[index] = toolCall;

          if (index !== 0) {
            // log last tool
            stdoutToolInfo(toolsInfo[index - 1]);
          }
        });
      } else if (metadata?.langgraph_node === "tools") {
        const toolId = (message as ToolMessage).tool_call_id;

        console.log("Tools调用成功:");
        // console.log("Tools调用结果:");
        console.log("Tool id: " + toolId);
        // console.log(
        //   JSON.stringify(JSON.parse(message.content.toString()), null, 2),
        // );
        console.log("\r\n");
      } else if (metadata?.langgraph_node !== "model_request") {
        console.log(metadata.langgraph_node);
      } else if ("usage_metadata" in message) {
        if (toolsInfo.length > 0) {
          stdoutToolInfo(toolsInfo[toolsInfo.length - 1]);
          toolsInfo = [];
        }

        const { input_tokens, output_tokens } = message.usage_metadata as any;
        token.input = input_tokens;
        token.output = output_tokens;
      } else if (message?.content) {
        process.stdout.write(message.content.toString());
      }
    } catch (error) {
      console.log(error);
      console.log([message, metadata]);
    }
  }

  process.stdout.write(`\r\n\r\n`);
  process.stdout.write(
    `input token: ${token.input} | output token: ${token.output} | total token: ${token.input + token.output}`,
  );
  process.stdout.write(`\r\n`);
}
