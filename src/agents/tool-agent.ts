import { callModel, type Message } from "../models/deepseek";
import { SYSTEM_PROMPT } from "../prompts/system";
import { runTool, tools } from "../tools";
import { logLine } from "../utils/logger";

const maxSteps = 5;

export async function reply(
  histories: Message[],
  onDelta?: (text: string) => void | Promise<void>,
  onMessage?: (message: Message) => void,
) {
  const messages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...histories,
  ];

  let steps = 0;
  while (true) {
    steps += 1;
    if (steps > maxSteps) return "查了几次还没写完，换个问法再试一次";

    const { message, finishReason } = await callModel(messages, tools, onDelta);
    messages.push(message);
    onMessage?.(message);

    // 输出被截断时，工具参数可能是半截，不执行。
    if (finishReason === "length") return message.content ?? "";
    if (!message.tool_calls?.length) return message.content ?? "";

    let yattaDone = false;
    for (const call of message.tool_calls) {
      if (call.type !== "function") continue;
      // get_yatta 是这一轮的最后一步，后面的工具不再执行。
      if (yattaDone) break;
      logLine(`role: assistant 调用 tools --- ${call.function.name} ${call.function.arguments}`);
      let result: unknown;
      try {
        const args = JSON.parse(call.function.arguments) as { name: string };
        result = await runTool(call.function.name, args);
      } catch (error) {
        const reason = error instanceof Error ? error.message : "这次工具调用失败";
        logLine(`role: assistant 调用 tools --- ${call.function.name} 失败 ${reason}`);
        result = { error: "这次工具调用失败" };
      }
      const toolMessage: Message = {
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      };
      messages.push(toolMessage);
      onMessage?.(toolMessage);
      if (call.function.name === "get_yatta") yattaDone = true;
    }

    if (!yattaDone) continue;

    steps += 1;
    if (steps > maxSteps) return "查了几次还没写完，换个问法再试一次";
    const final = await callModel(messages, undefined, onDelta);
    messages.push(final.message);
    onMessage?.(final.message);
    return final.message.content ?? "";
  }
}
