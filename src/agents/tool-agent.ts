import type { Memory } from "../memory/types";
import { callModel } from "../models/deepseek";
import { runTool, tools } from "../tools";

export async function reply(memory: Memory) {
  while (true) {
    const msg = await callModel(memory.get(), tools);
    memory.add(msg);
    if (!msg.tool_calls?.length) return msg.content ?? "";

    for (const call of msg.tool_calls) {
      if (call.type !== "function") continue;
      const result = await runTool(call.function.name, JSON.parse(call.function.arguments));
      console.log(`[调用工具] ${call.function.name} ${call.function.arguments} => ${JSON.stringify(result)}`);
      memory.add({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
}
