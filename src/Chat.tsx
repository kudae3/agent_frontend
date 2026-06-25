import { useCallback, useMemo } from "react";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { useStream } from "@langchain/react";
import { Thread } from "@/components/thread";
import { toThreadMessages } from "./toThread";

export function Chat() {
  const stream = useStream({
    apiUrl: "http://localhost:3000/chat",
    assistantId: "claude",
  });

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const text = message.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("");
      await stream.submit({ messages: [{ type: "human", content: text }] });
    },
    [stream],
  );

  // Convert LangChain messages to assistant-ui's ThreadMessageLike format
  const messages = useMemo(
    () => toThreadMessages(stream.messages),
    [stream.messages],
  );

  const runtime = useExternalStoreRuntime<ThreadMessageLike>({
    messages,
    onNew,
    onCancel: () => stream.stop(),
    convertMessage: (m) => m,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
}