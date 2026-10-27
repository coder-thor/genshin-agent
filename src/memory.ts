import type { Message } from "./llm";
import { SYSTEM_PROMPT } from "./prompts";

// 有记忆：所有对话都存在这里，每次整个发给模型
export function createMemory() {
  const messages: Message[] = [{ role: "system", content: SYSTEM_PROMPT }];
  return {
    add: (msg: Message) => {
      messages.push(msg);
    },
    get: () => messages,
  };
}

export type Memory = ReturnType<typeof createMemory>;
