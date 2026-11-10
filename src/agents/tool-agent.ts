import { callModel, type Message } from "../models/deepseek";
import { SYSTEM_PROMPT } from "../prompts/system";
import { runTool, tools } from "../tools";
import { logLine } from "../utils/logger";

const maxSteps = 5;
// 这节课留下的最近条数。LangChain SummarizationMiddleware 的默认是 20。
const keep = 6; // 留下最近 6 条对话记录

// 原文还在 chat_messages。这里只改这一次送给模型的 histories。
async function compress(histories: Message[], onSummarize?: () => void | Promise<void>) {
  if (histories.length <= keep) return histories; // 如果历史记录的长度还不满足 keep的数量 就不需要做压缩
  // 根据用户的 messages 数量来决定是否压缩 6 条消息 上下文 50k, 1k, 
  // claude code 计算详细的 token 消耗 当 token 数量真正到达 40k 的时候进行压缩
 // 1000  - 6 = 
  let cut = histories.length - keep; // 找到切入点 1000 条消息 6条 1000 - 6 = 994 
  // history[994].role = tool 993
  // 切开的位置如果落在 tool 上，再往前挪，带 tool_calls 的 assistant 留在原文里。
  // 让 cut = 993 
  while (cut > 0 && histories[cut].role === "tool") cut -= 1;
  if (cut === 0) return histories;

  const older = histories.slice(0, cut); // 前面的 993 条消息
  const recent = histories.slice(cut); // cut 后面的所有messages 都留下来
  // 真正开始摘要才提示。没过 keep 的轮次不会走到这里。
  logLine("上下文压缩 --- context summarized");
  await onSummarize?.();
  // 我们自己构造一次交互
  const { message } = await callModel([
    // 我们 agent工程师写给ai对不对
    { role: "system", content: "把下面的旧对话收成一段。留下角色名、已经查到的资料、用户还没问完的问题。不要编。" },
    { role: "user", content: JSON.stringify(older) },
  ]);

  return [
    { role: "user" as const, content: "此前对话摘要：" + (message.content ?? "") },
    ...recent, // 最近的 7条 加进来
  ];
}

export async function reply(
  histories: Message[],
  onDelta?: (text: string) => void | Promise<void>,
  onMessage?: (message: Message) => void,
  onSummarize?: () => void | Promise<void>,
) {
  // reply 会在每次用户提问的时候被调用 histories里已经包含了用户最新的问题
  const messages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...await compress(histories, onSummarize), // 真正到达临界点的时候才会有意义吧
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
