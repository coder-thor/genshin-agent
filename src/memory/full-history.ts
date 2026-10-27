import type { Message } from "../models/deepseek";
import { SYSTEM_PROMPT } from "../prompts/system";
import type { Memory } from "./types";

export function createMemory(): Memory {
  const messages: Message[] = [{ role: "system", content: SYSTEM_PROMPT }];
  return {
    add: (msg) => {
      messages.push(msg);
    },
    get: () => messages,
  };
}
