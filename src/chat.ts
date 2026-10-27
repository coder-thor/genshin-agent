import { callModel } from "./llm";
import type { Memory } from "./memory";

// 普通对话：把对话发给模型，拿到回答就结束
export async function reply(memory: Memory) {
  const msg = await callModel(memory.get());
  memory.add(msg);
  return msg.content ?? "";
}
