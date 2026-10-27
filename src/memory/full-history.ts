import type { Message } from "../models/deepseek";
import { SYSTEM_PROMPT } from "../prompts/system";
import type { Memory } from "./types";

// 有记忆：所有对话都存在这里，每次整个发给模型
export function createMemory(): Memory {
  const messages: Message[] = [{ role: "system", content: SYSTEM_PROMPT }];
  return {
    add: (msg) => {
      messages.push(msg);
    },
    get: () => messages,
  };
}
