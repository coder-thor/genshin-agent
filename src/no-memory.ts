import type { Message } from "./llm";
import { SYSTEM_PROMPT } from "./prompts";

// 没记忆：你每说一句新的，之前的对话就全扔掉，只留系统提示词
export function createMemory() {
  let messages: Message[] = [{ role: "system", content: SYSTEM_PROMPT }];
  return {
    add: (msg: Message) => {
      if (msg.role === "user") messages = [messages[0]];
      messages.push(msg);
    },
    get: () => messages,
  };
}
