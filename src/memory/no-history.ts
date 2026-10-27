import type { Message } from "../models/deepseek";
import { SYSTEM_PROMPT } from "../prompts/system";
import type { Memory } from "./types";

export function createMemory(): Memory {
  let messages: Message[] = [{ role: "system", content: SYSTEM_PROMPT }];
  return {
    add: (msg) => {
      if (msg.role === "user") messages = [messages[0]];
      messages.push(msg);
    },
    get: () => messages,
  };
}
