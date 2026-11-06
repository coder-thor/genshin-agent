import { callModel, type Message } from "../models/deepseek";
import { SYSTEM_PROMPT } from "../prompts/system";
import {  runTool, tools } from "../tools";
import { log } from "../utils/logger";

export async function reply(
  histories: Message[],
  onDelta?: (text: string) => void,
  onMessage?: (message: Message) => void,
) {
  const messages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...histories,
  ];

  while (true) {
    // 这个时候的 message 是不是就带了社区结果
    const answer = await callModel(messages, tools, onDelta); // onDelta是在一轮回答中的某个 token 出来的时候就会调用
    // 一轮回答结束， 把全量的所有内容都传给 onMessage
    messages.push(answer);
    onMessage?.(answer);  // 把这个 answer 也就是 llm 的回答 存进数据库

    if (!answer.tool_calls?.length) return answer.content ?? "";

    for (const call of answer.tool_calls) { // 循环查 llm 有没有给我下指令
      if (call.type !== "function") continue;
      const args = JSON.parse(call.function.arguments);
      const result = await runTool(call.function.name, args); // 拿到社区的查询结果以后
      log("调用工具", { name: call.function.name, args, result });
      const toolMessage: Message = { role: "tool", tool_call_id: call.id, content: JSON.stringify(result) };
      messages.push(toolMessage);
      onMessage?.(toolMessage); //  llm是不是可能不给回答 但是给出 tool 调用的指令， 所以这些指令也要进历史记录
    }
    // for循环结束
  }
}
