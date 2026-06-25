import { AIMessage, HumanMessage, ToolMessage, type BaseMessage } from "langchain";
import type { ThreadMessageLike } from "@assistant-ui/react";

export function toThreadMessages(messages: BaseMessage[]): ThreadMessageLike[] {
  const result: ThreadMessageLike[] = [];

  for (const msg of messages) {
    if (HumanMessage.isInstance(msg)) {
      result.push({
        role: "user",
        content: [{ type: "text", text: msg.text }],
      });
    } else if (AIMessage.isInstance(msg)) {
      let parts: ThreadMessageLike["content"] = [];

      // Reasoning tokens
      const reasoning = msg.contentBlocks.find((block) => block.type === "reasoning")?.reasoning;
      if (reasoning) parts = [...parts, { type: "reasoning", text: reasoning }];

      // Tool calls
      for (const tc of msg.tool_calls ?? []) {
        parts = [...parts, {
          type: "tool-call",
          toolCallId: tc.id ?? "",
          toolName: tc.name,
          args: tc.args,
        }];
      }

      // Text response
      const text = msg.text;
      if (text) parts = [...parts, { type: "text", text }];

      result.push({ role: "assistant", content: parts });
    } else if (ToolMessage.isInstance(msg)) {
      // Attach tool results to the preceding assistant message
      const last = result[result.length - 1];
      if (last?.role === "assistant") {
        for (const part of last.content) {
          if (typeof part !== "string" && part.type === "tool-call" && part.toolCallId === msg.tool_call_id) {
            (part as { result?: string }).result = msg.text;
          }
        }
      }
    }
  }

  return result;
}