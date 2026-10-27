import { callModel, type Message } from "../models/deepseek";
import { SYSTEM_PROMPT } from "../prompts/system";
import { runTool, tools } from "../tools";
import { log } from "../utils/logger";

export async function reply(question: string, histories: Message[]) {
  const messages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...histories,
  ];

  while (true) {
    // 这个时候的 message 是不是就带了社区结果
    const answer = await callModel(messages, tools);
    messages.push(answer);

    if (!answer.tool_calls?.length) return answer.content ?? "";

    for (const call of answer.tool_calls) { // 循环查 llm 有没有给我下指令
      if (call.type !== "function") continue;
      const args = JSON.parse(call.function.arguments);
      const result = await runTool(call.function.name, args); // 拿到社区的查询结果以后
      console.log(`[调用工具] ${call.function.name} ${call.function.arguments} => ${JSON.stringify(result)}`);
      log("调用工具", { name: call.function.name, args, result });
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
    // for循环结束
  }
}
