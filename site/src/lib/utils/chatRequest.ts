import type { ChatMessage } from "$lib/types";

export interface ChatHistoryEntry {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequestPayload {
  message: string;
  history: ChatHistoryEntry[];
}

/**
 * Build the API payload from the conversation as it existed before the current
 * optimistic user message was appended. Local system notices are UI state, not
 * conversational history, and are intentionally excluded.
 */
export function buildChatRequest(
  previousMessages: readonly ChatMessage[],
  currentContent: string
): ChatRequestPayload {
  return {
    message: currentContent.trim(),
    history: previousMessages
      .filter(
        (message): message is ChatMessage & { role: "user" | "assistant" } =>
          message.role === "user" || message.role === "assistant"
      )
      .slice(-5)
      .map(({ role, content }) => ({ role, content }))
  };
}
