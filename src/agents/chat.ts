import type { Memory } from "../memory/types";
import { callModel } from "../models/deepseek";

export async function reply(memory: Memory) {
  const msg = await callModel(memory.get());
  memory.add(msg);
  return msg.content ?? "";
}
