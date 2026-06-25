import { useCallback, useMemo, useState } from "react";
import {
  AssistantRuntimeProvider, useExternalStoreRuntime,
  type AppendMessage, type ThreadMessageLike,
} from "@assistant-ui/react";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Thread } from "@/components/thread";
import { toThreadMessages } from "./toThread";

export function Chat() {
  const [lcMessages, setLcMessages] = useState<(HumanMessage | AIMessage)[]>([]);
  const [conversationId, setConversationId] = useState<string>();

  const onNew = useCallback(async (message: AppendMessage) => {
    const text = message.content.filter((c) => c.type === "text").map((c) => c.text).join("");
    setLcMessages((m) => [...m, new HumanMessage(text)]);

    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        conversationId: conversationId,
      }),
    });
    const data = await res.json();
    setConversationId(data.conversationId);
    setLcMessages((m) => [...m, new AIMessage(data.reply)]);
  }, [conversationId]);

  const messages = useMemo(() => toThreadMessages(lcMessages), [lcMessages]);

  const runtime = useExternalStoreRuntime<ThreadMessageLike>({
    messages, onNew, convertMessage: (m) => m,
  });

  return (<AssistantRuntimeProvider runtime={runtime}><Thread /></AssistantRuntimeProvider>);
}