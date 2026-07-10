import { describe, expect, it } from "vitest";
import type { ChatMessage } from "$lib/types";
import { buildChatRequest } from "./chatRequest";

function message(role: ChatMessage["role"], content: string, id: string): ChatMessage {
  return { id, role, content, timestamp: Number(id) };
}

describe("buildChatRequest", () => {
  it("puts the newest prompt exactly once outside prior history", () => {
    const payload = buildChatRequest(
      [message("user", "Earlier question", "1"), message("assistant", "Earlier answer", "2")],
      "  Newest prompt  "
    );

    expect(payload).toEqual({
      message: "Newest prompt",
      history: [
        { role: "user", content: "Earlier question" },
        { role: "assistant", content: "Earlier answer" }
      ]
    });
    expect(JSON.stringify(payload).match(/Newest prompt/g)).toHaveLength(1);
  });

  it("excludes local system notices and keeps only the five latest valid turns", () => {
    const previous = [
      message("user", "one", "1"),
      message("assistant", "two", "2"),
      message("system", "local error text", "3"),
      message("user", "three", "4"),
      message("assistant", "four", "5"),
      message("user", "five", "6"),
      message("assistant", "six", "7")
    ];

    expect(buildChatRequest(previous, "seven").history).toEqual([
      { role: "assistant", content: "two" },
      { role: "user", content: "three" },
      { role: "assistant", content: "four" },
      { role: "user", content: "five" },
      { role: "assistant", content: "six" }
    ]);
  });
});
